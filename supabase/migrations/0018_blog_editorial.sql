-- ============================================================================
-- Somos Preta — Blog: fluxo editorial completo
--
-- O blog nasceu com dois estados (rascunho/publicado) e um switch binário. Na
-- prática a redação trabalha com mais etapas: escreve, manda revisar, agenda
-- para uma data, publica, às vezes tira do ar sem apagar e no fim arquiva.
-- Esta migration dá nome a cada uma dessas etapas e acrescenta o que a tela de
-- publicações precisa para ser a fonte da verdade do blog:
--
--   • quatro estados novos (em_revisao, agendado, despublicado, arquivado);
--   • destaque, para a redação escolher o que abre o blog em vez de depender
--     apenas da data;
--   • agendado_para, separado de publicado_em — agendar não pode reescrever a
--     data em que um post já esteve no ar;
--   • categorias como tabela, para o botão "Gerenciar categorias" ter o que
--     gerenciar (hoje a lista é uma const no código, e o banco aceita texto
--     livre);
--   • contagem de visualizações em tabela própria. Contar DENTRO de
--     somos_preta_blog_posts seria mais simples e estaria errado: o trigger
--     trg_touch_somos_preta_blog_posts (0001) reescreve updated_at a cada
--     update, então cada visita marcaria o post como "editado agora" — o que
--     destrói a coluna "Última edição" da tela e polui o lastModified do
--     sitemap, que lê updated_at.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

-- ============================================================================
-- ENUM — valores novos primeiro, sozinhos
-- ============================================================================
-- Postgres aceita ALTER TYPE ... ADD VALUE dentro de transação, mas proíbe USAR
-- o valor novo na mesma transação ("unsafe use of new value"). O SQL Editor
-- roda o arquivo inteiro como uma transação só, então daqui para baixo nenhum
-- comando EXECUTADO pode mencionar 'agendado' & cia. — só corpos de função, que
-- são avaliados depois. Mesmo sanduíche de 0012_tarefas_auditoria_ux.sql.
alter type somos_preta_blog_status add value if not exists 'em_revisao';
alter type somos_preta_blog_status add value if not exists 'agendado';
alter type somos_preta_blog_status add value if not exists 'despublicado';
alter type somos_preta_blog_status add value if not exists 'arquivado';

-- ============================================================================
-- POSTS — colunas novas
-- ============================================================================
alter table somos_preta_blog_posts
  add column if not exists destaque      boolean not null default false,
  add column if not exists agendado_para timestamptz;

-- A tela lista por status e ordena por data; o índice antigo cobria só status.
create index if not exists idx_somos_preta_blog_status_data
  on somos_preta_blog_posts (status, publicado_em desc);

-- Parcial por agendado_para (e não por status) de propósito: a condição não
-- pode citar um valor de enum criado nesta mesma transação.
create index if not exists idx_somos_preta_blog_agendado
  on somos_preta_blog_posts (agendado_para)
  where agendado_para is not null;

-- ============================================================================
-- CATEGORIAS
-- ============================================================================
-- O post continua guardando a categoria como TEXTO, e não como chave
-- estrangeira: o site público filtra comparando string (blog-pagina.tsx,
-- blog-hero.tsx) e uma FK obrigaria a reescrever esses pontos sem ganho real
-- para uma lista de sete itens. Esta tabela é o catálogo — quem renomeia uma
-- categoria propaga o novo nome para os posts (ver somos_preta_blog_salvar_categoria).
create table if not exists somos_preta_blog_categorias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  slug       text not null unique,
  -- Nome do token semântico da paleta (terracota, oliva, info...), não um hex:
  -- a cor precisa acompanhar o tema claro/escuro definido em globals.css.
  cor        text not null default 'neutro',
  ordem      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_somos_preta_blog_categorias_ordem
  on somos_preta_blog_categorias (ordem, nome);

-- Semeia o catálogo com as sete categorias que hoje vivem em
-- src/lib/constants/blog.ts, para a tela não abrir vazia.
insert into somos_preta_blog_categorias (nome, slug, cor, ordem) values
  ('Creators',         'creators',         'sucesso',   1),
  ('Marcas',           'marcas',           'info',      2),
  ('Campanhas',        'campanhas',        'progresso', 3),
  ('Mercado',          'mercado',          'info',      4),
  ('Cultura',          'cultura',          'erro',      5),
  ('Bastidores',       'bastidores',       'atencao',   6),
  ('Norte e Nordeste', 'norte-e-nordeste', 'terracota', 7)
-- Sem árbitro: a tabela tem unique em nome E em slug, e apontar só um
-- deixaria a violação do outro derrubar a migration inteira.
on conflict do nothing;

-- ============================================================================
-- VISUALIZAÇÕES
-- ============================================================================
-- Agregado por dia, não uma linha por visita: dá a série temporal que a tela
-- precisa (mês atual x mês anterior) sem virar uma tabela de log infinita.
create table if not exists somos_preta_blog_visualizacoes (
  post_id uuid not null references somos_preta_blog_posts(id) on delete cascade,
  dia     date not null default current_date,
  total   integer not null default 0,
  primary key (post_id, dia)
);

create index if not exists idx_somos_preta_blog_visualizacoes_dia
  on somos_preta_blog_visualizacoes (dia);

-- ============================================================================
-- RLS
-- ============================================================================
alter table somos_preta_blog_categorias    enable row level security;
alter table somos_preta_blog_visualizacoes enable row level security;

-- Categorias: a equipe gerencia; qualquer visitante lê (o site monta os filtros
-- do blog a partir daqui).
drop policy if exists "staff_all_blog_categorias" on somos_preta_blog_categorias;
create policy "staff_all_blog_categorias" on somos_preta_blog_categorias
  for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

drop policy if exists "public_read_blog_categorias" on somos_preta_blog_categorias;
create policy "public_read_blog_categorias" on somos_preta_blog_categorias
  for select using (true);

-- Visualizações: só a equipe lê, e ninguém escreve direto — a contagem entra
-- exclusivamente pela RPC security definer abaixo, então não há como apagar ou
-- reescrever o histórico.
-- O que a RPC NÃO impede é inflar: ela é aberta a anon e soma 1 por chamada,
-- sem deduplicação. É um contador otimista de audiência, não uma métrica
-- auditável — quem precisar de número defensável tem de medir do lado servidor.
drop policy if exists "staff_read_blog_visualizacoes" on somos_preta_blog_visualizacoes;
create policy "staff_read_blog_visualizacoes" on somos_preta_blog_visualizacoes
  for select to authenticated using (somos_preta_is_staff());

-- ============================================================================
-- FUNÇÕES
-- ============================================================================
-- Os corpos abaixo citam os valores de enum criados no topo deste arquivo.
-- Isso é seguro porque só são avaliados na execução, mas o validador de corpo
-- do plpgsql pode tentar resolvê-los na criação — mesmo cuidado de 0017.
set check_function_bodies = off;

-- Slug simples, sem depender da extensão unaccent (que não está habilitada).
create or replace function somos_preta_slug(p_texto text)
returns text
language sql immutable
as $$
  select coalesce(
    nullif(
      regexp_replace(
        regexp_replace(
          translate(
            lower(coalesce(p_texto, '')),
            'áàâãäéèêëíìîïóòôõöúùûüçñ',
            'aaaaaeeeeiiiiooooouuuucn'
          ),
          '[^a-z0-9]+', '-', 'g'
        ),
        '(^-+|-+$)', '', 'g'
      ),
      ''
    ),
    'sem-nome'
  );
$$;

-- ----------------------------------------------------------------------------
-- Registra uma visualização de post publicado.
-- Chamada pelo site público, que roda como anon — daí o security definer: a
-- policy de somos_preta_blog_visualizacoes não dá insert a ninguém.
-- Recebe o slug (e não o id) porque é o que a página pública tem em mãos, e
-- confere o status aqui dentro: rascunho e agendado não acumulam audiência.
-- ----------------------------------------------------------------------------
create or replace function somos_preta_blog_registrar_visualizacao(p_slug text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_post uuid;
begin
  select id into v_post
  from somos_preta_blog_posts
  where slug = p_slug and status = 'publicado';

  if v_post is null then
    return;
  end if;

  insert into somos_preta_blog_visualizacoes (post_id, dia, total)
  values (v_post, current_date, 1)
  on conflict (post_id, dia)
  do update set total = somos_preta_blog_visualizacoes.total + 1;
end;
$$;

revoke all on function somos_preta_blog_registrar_visualizacao(text) from public;
grant execute on function somos_preta_blog_registrar_visualizacao(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Métricas de audiência por post: total, mês corrente e mês anterior.
-- A tela precisa dos três juntos (coluna "Visualizações" + card com variação),
-- e trazer a tabela de dias inteira para somar no cliente cresceria sem teto.
-- ----------------------------------------------------------------------------
create or replace function somos_preta_blog_metricas()
returns table (post_id uuid, total bigint, mes_atual bigint, mes_anterior bigint)
language sql stable security definer set search_path = public
as $$
  select
    v.post_id,
    coalesce(sum(v.total), 0)::bigint,
    coalesce(sum(v.total) filter (
      where v.dia >= date_trunc('month', current_date)::date
    ), 0)::bigint,
    coalesce(sum(v.total) filter (
      where v.dia >= (date_trunc('month', current_date) - interval '1 month')::date
        and v.dia <  date_trunc('month', current_date)::date
    ), 0)::bigint
  from somos_preta_blog_visualizacoes v
  where somos_preta_is_staff()
  group by v.post_id;
$$;

revoke all on function somos_preta_blog_metricas() from public;
grant execute on function somos_preta_blog_metricas() to authenticated;

-- ----------------------------------------------------------------------------
-- Publica o que já venceu o agendamento.
-- Sem pg_cron habilitado, quem dispara é quem chega primeiro: a página pública
-- do blog (revalidate de 60s, então no máximo uma vez por minuto) e a tela de
-- publicações ao carregar. É idempotente e barata — o índice parcial de
-- agendado_para atende o where.
-- ----------------------------------------------------------------------------
create or replace function somos_preta_blog_publicar_agendados()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  n integer;
begin
  update somos_preta_blog_posts
  set status       = 'publicado',
      -- publicado_em primeiro no coalesce: um post que já esteve no ar e foi
      -- reagendado mantém a data de estreia — é ela que o site e o sitemap
      -- mostram, e é para preservá-la que agendado_para existe em separado.
      publicado_em = coalesce(publicado_em, agendado_para, now()),
      agendado_para = null
  where status = 'agendado'
    and agendado_para is not null
    and agendado_para <= now();

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function somos_preta_blog_publicar_agendados() from public;
grant execute on function somos_preta_blog_publicar_agendados() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Cria ou renomeia uma categoria.
-- Precisa ser função (e não dois updates no cliente) porque renomear tem de
-- propagar para somos_preta_blog_posts.categoria na mesma transação: o post
-- guarda o rótulo como texto, e um rename pela metade deixaria posts órfãos,
-- invisíveis no filtro do site.
-- ----------------------------------------------------------------------------
create or replace function somos_preta_blog_salvar_categoria(
  p_id uuid,
  p_nome text,
  p_cor text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_nome_antigo text;
  v_slug text;
  v_id uuid;
begin
  if not somos_preta_is_staff() then
    raise exception 'Apenas a equipe pode gerenciar categorias';
  end if;

  p_nome := btrim(coalesce(p_nome, ''));
  if p_nome = '' then
    raise exception 'O nome da categoria é obrigatório';
  end if;

  -- somos_preta_slug é muitos-para-um ("Café" e "cafe" dão o mesmo endereço),
  -- então nomes diferentes podem colidir no unique de slug. Sem esta checagem
  -- o editor receberia um 23505 cru em vez de uma frase que explica o problema.
  v_slug := somos_preta_slug(p_nome);
  if exists (
    select 1 from somos_preta_blog_categorias
    where slug = v_slug and (p_id is null or id <> p_id)
  ) then
    raise exception 'Já existe uma categoria com o endereço "%"', v_slug;
  end if;

  if p_id is null then
    insert into somos_preta_blog_categorias (nome, slug, cor, ordem)
    values (
      p_nome,
      v_slug,
      coalesce(nullif(btrim(p_cor), ''), 'neutro'),
      coalesce((select max(ordem) + 1 from somos_preta_blog_categorias), 1)
    )
    returning id into v_id;
    return v_id;
  end if;

  select nome into v_nome_antigo from somos_preta_blog_categorias where id = p_id;
  if v_nome_antigo is null then
    raise exception 'Categoria não encontrada';
  end if;

  update somos_preta_blog_categorias
  set nome = p_nome,
      slug = v_slug,
      cor  = coalesce(nullif(btrim(p_cor), ''), cor)
  where id = p_id;

  if v_nome_antigo is distinct from p_nome then
    update somos_preta_blog_posts
    set categoria = p_nome
    where categoria = v_nome_antigo;
  end if;

  return p_id;
end;
$$;

revoke all on function somos_preta_blog_salvar_categoria(uuid, text, text) from public;
grant execute on function somos_preta_blog_salvar_categoria(uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Exclui uma categoria e desvincula os posts que a usavam.
-- Deixar o texto antigo no post seria pior: ele sumiria dos filtros do site
-- sem que ninguém percebesse. Sem categoria, pelo menos, é visível na tela.
-- ----------------------------------------------------------------------------
create or replace function somos_preta_blog_excluir_categoria(p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_nome text;
begin
  if not somos_preta_is_staff() then
    raise exception 'Apenas a equipe pode gerenciar categorias';
  end if;

  select nome into v_nome from somos_preta_blog_categorias where id = p_id;
  if v_nome is null then
    return;
  end if;

  update somos_preta_blog_posts set categoria = null where categoria = v_nome;
  delete from somos_preta_blog_categorias where id = p_id;
end;
$$;

revoke all on function somos_preta_blog_excluir_categoria(uuid) from public;
grant execute on function somos_preta_blog_excluir_categoria(uuid) to authenticated;

reset check_function_bodies;

-- ============================================================================
-- FIM
-- ============================================================================
