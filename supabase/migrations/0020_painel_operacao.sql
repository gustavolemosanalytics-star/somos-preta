-- ============================================================================
-- Somos Preta — Painel: o que as telas de Clientes, Campanhas, Tarefas e
-- Dashboard precisam para dizer a verdade
--
-- Rodar DEPOIS de 0019_painel_enums.sql (os dois valores de enum de lá não
-- podem nascer no mesmo run em que são usados).
--
-- O que entra e por quê:
--   • cliente ganha status, responsável e pessoa de contato — hoje a tela conta
--     "clientes ativos" sobre uma tabela que não sabe quem está ativo, e mostra
--     um "responsável" que na verdade é quem cadastrou;
--   • campanha ganha etapa (o funil Briefing→Relatório, que é ORTOGONAL ao
--     status administrativo), responsável, prioridade, os três momentos do
--     orçamento e a data em que o status mudou;
--   • áreas viram tabela — é o único item das telas sem nenhum correspondente
--     no banco, e é ela que colore os blocos do calendário;
--   • um feed de atividade de verdade: somos_preta_tarefa_eventos não serve
--     porque tarefa_id é NOT NULL, e o painel precisa registrar campanha,
--     cliente, contrato e criador também;
--   • notas, arquivos e favoritos de cliente, que são as abas do painel de
--     detalhe e não existem em lugar nenhum.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

-- ============================================================================
-- TIPOS NOVOS
-- ============================================================================
-- Tipos CRIADOS aqui podem ser usados aqui mesmo — a proibição do Postgres vale
-- só para valor acrescentado a enum preexistente, que é o caso da 0019.
do $$ begin
  create type somos_preta_cliente_status as enum ('prospeccao', 'ativo', 'pausado', 'encerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_campanha_etapa as enum ('briefing', 'mapeamento', 'aprovacao', 'producao', 'relatorio');
exception when duplicate_object then null; end $$;

-- Para a posição do creator dentro de uma campanha NÃO se cria tipo novo:
-- somos_preta_pipeline_etapa já existe desde 0010_criadores_listas.sql, com o
-- funil completo (mapeado → em_analise → contatado → interessado → negociacao →
-- aprovado_preta → enviado_cliente → aprovado_cliente → contratado → publicado).
-- É o mesmo conceito — um creator sendo selecionado —, e um segundo vocabulário
-- para a mesma coisa só criaria duas verdades. O enum existente ainda é o que a
-- tela de listas usa, então reusá-lo mantém as duas telas falando a mesma língua.

-- ============================================================================
-- PERFIS
-- ============================================================================
-- `role` é permissão (quem pode o quê); cargo é como a pessoa se apresenta ao
-- cliente. A tela mostra "Account Manager" embaixo do nome, e isso não cabe em
-- admin/gestor/analista.
alter table somos_preta_profiles
  add column if not exists cargo text;

-- ============================================================================
-- CLIENTES
-- ============================================================================
alter table somos_preta_clientes
  add column if not exists status              somos_preta_cliente_status not null default 'ativo',
  -- created_by (0001) é quem cadastrou e nunca é reatribuído: usá-lo como
  -- responsável passa a mentir na primeira troca de conta.
  add column if not exists responsavel_id      uuid references somos_preta_profiles(id) on delete set null,
  add column if not exists site                text,
  -- email/telefone já existiam soltos, sem dizer de quem são.
  add column if not exists contato_nome        text,
  add column if not exists contato_cargo       text,
  add column if not exists contato_avatar_url  text;

update somos_preta_clientes
set responsavel_id = created_by
where responsavel_id is null and created_by is not null;

create index if not exists idx_somos_preta_clientes_status on somos_preta_clientes (status);
create index if not exists idx_somos_preta_clientes_responsavel on somos_preta_clientes (responsavel_id);

-- ============================================================================
-- CAMPANHAS
-- ============================================================================
alter table somos_preta_campanhas
  -- Etapa é ortogonal a status: uma campanha 'ativa' pode estar em Mapeamento
  -- ou em Produção, e é a etapa que o stepper do card desenha.
  add column if not exists etapa               somos_preta_campanha_etapa not null default 'briefing',
  add column if not exists responsavel         uuid references somos_preta_profiles(id) on delete set null,
  add column if not exists prioridade          somos_preta_tarefa_prioridade not null default 'media',
  -- Três momentos do mesmo número. Com um campo só, chamar de "aprovado" um
  -- valor que ainda é estimativa é a tela mentindo — e o rótulo do card muda
  -- por campanha justamente por isso. `budget` (0001) continua, é lido em três
  -- telas; passa a ser o legado que alimenta o estimado.
  add column if not exists orcamento_estimado  numeric(12,2),
  add column if not exists orcamento_aprovado  numeric(12,2),
  add column if not exists orcamento_final     numeric(12,2),
  add column if not exists capa_url            text,
  -- `objetivo` é a meta da campanha, texto longo. A frase do card é um claim
  -- curto ("Refresca novas histórias.") e não cabe lá.
  add column if not exists tagline             text,
  -- updated_at é reescrito a cada update (trigger de 0001): corrigir uma
  -- vírgula no briefing zeraria o contador de "há mais de 7 dias aguardando".
  add column if not exists status_desde        timestamptz not null default now();

update somos_preta_campanhas
set orcamento_estimado = budget
where orcamento_estimado is null and budget is not null;

update somos_preta_campanhas
set responsavel = created_by
where responsavel is null and created_by is not null;

create index if not exists idx_somos_preta_campanhas_etapa on somos_preta_campanhas (etapa);
create index if not exists idx_somos_preta_campanhas_responsavel on somos_preta_campanhas (responsavel);

-- Carimba status_desde só quando o status muda de fato.
create or replace function somos_preta_campanha_marcar_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.status_desde = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_status_desde_campanhas on somos_preta_campanhas;
create trigger trg_status_desde_campanhas
  before update on somos_preta_campanhas
  for each row execute function somos_preta_campanha_marcar_status();

-- Funil de seleção do creator dentro da campanha.
alter table somos_preta_campanha_influencers
  add column if not exists etapa somos_preta_pipeline_etapa not null default 'mapeado';

create index if not exists idx_somos_preta_campanha_influencers_etapa
  on somos_preta_campanha_influencers (campanha_id, etapa);

-- ============================================================================
-- ÁREAS
-- ============================================================================
-- Único item das telas sem NENHUM correspondente no banco. A cor guarda o nome
-- do token da paleta (não um hex), porque é ela que pinta o bloco no calendário
-- e precisa acompanhar o tema.
create table if not exists somos_preta_areas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  slug       text not null unique,
  cor        text not null default 'neutro',
  ordem      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_somos_preta_areas_ordem on somos_preta_areas (ordem, nome);

insert into somos_preta_areas (nome, slug, cor, ordem) values
  ('Comercial',     'comercial',     'terracota', 1),
  ('Operação',      'operacao',      'sucesso',   2),
  ('Mídia',         'midia',         'info',      3),
  ('Design',        'design',        'progresso', 4),
  ('Jurídico',      'juridico',      'erro',      5),
  ('Plataforma',    'plataforma',    'atencao',   6),
  ('Creators',      'creators',      'sucesso',   7),
  ('Institucional', 'institucional', 'neutro',    8)
-- Sem árbitro: a tabela tem unique em nome E em slug, e apontar só um deixaria
-- a violação do outro derrubar a migration inteira.
on conflict do nothing;

-- ============================================================================
-- TAREFAS
-- ============================================================================
alter table somos_preta_tarefas
  add column if not exists area_id uuid references somos_preta_areas(id) on delete set null,
  -- data_entrega + horario já dão o INSTANTE do bloco na grade semanal; faltava
  -- a ALTURA dele.
  add column if not exists duracao_minutos integer not null default 60;

create index if not exists idx_somos_preta_tarefas_area on somos_preta_tarefas (area_id);

-- "Vence hoje", "próximas do prazo" e "próxima entrega da campanha" filtram
-- todos por data_entrega; os índices existentes cobriam campanha/status/responsável.
create index if not exists idx_somos_preta_tarefas_data_entrega
  on somos_preta_tarefas (data_entrega)
  where arquivada = false;

-- ============================================================================
-- ATIVIDADES (feed do painel)
-- ============================================================================
-- somos_preta_tarefa_eventos não serve: tarefa_id é NOT NULL e o enum de tipos
-- só descreve campos de tarefa. O feed do dashboard fala de campanha, cliente,
-- contrato e criador também.
create table if not exists somos_preta_atividades (
  id          uuid primary key default gen_random_uuid(),
  -- Texto livre, não enum: o feed cresce a cada tela nova e um enum obrigaria
  -- migration para cada tipo novo de linha.
  entidade    text not null,
  entidade_id uuid,
  tipo        text not null,
  autor_id    uuid references somos_preta_profiles(id) on delete set null,
  resumo      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_somos_preta_atividades_recentes
  on somos_preta_atividades (created_at desc);

create index if not exists idx_somos_preta_atividades_entidade
  on somos_preta_atividades (entidade, entidade_id, created_at desc);

-- O feed global do dashboard também alimenta a coluna "Última atividade" da
-- tabela de clientes — daí o segundo índice.
create or replace function somos_preta_registrar_atividade()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_resumo text;
  v_tipo   text;
begin
  if tg_table_name = 'somos_preta_clientes' then
    v_tipo := case when tg_op = 'INSERT' then 'cliente_criado' else 'cliente_atualizado' end;
    v_resumo := case when tg_op = 'INSERT'
      then 'Cliente cadastrado: ' || new.nome
      else 'Cliente atualizado: ' || new.nome end;
    insert into somos_preta_atividades (entidade, entidade_id, tipo, autor_id, resumo)
    values ('cliente', new.id, v_tipo, auth.uid(), v_resumo);

  elsif tg_table_name = 'somos_preta_campanhas' then
    -- Só mudança de status vira linha no feed; do contrário cada tecla digitada
    -- no briefing empurraria o feed inteiro para baixo.
    if tg_op = 'INSERT' then
      insert into somos_preta_atividades (entidade, entidade_id, tipo, autor_id, resumo)
      values ('campanha', new.id, 'campanha_criada', auth.uid(), 'Campanha criada: ' || new.nome);
    elsif new.status is distinct from old.status then
      insert into somos_preta_atividades (entidade, entidade_id, tipo, autor_id, resumo)
      values ('campanha', new.id, 'campanha_status', auth.uid(),
              'Campanha "' || new.nome || '" mudou para ' || new.status::text);
    end if;

  elsif tg_table_name = 'somos_preta_influencers' then
    if tg_op = 'INSERT' then
      insert into somos_preta_atividades (entidade, entidade_id, tipo, autor_id, resumo)
      values ('criador', new.id, 'criador_criado', auth.uid(),
              'Novo criador cadastrado: ' || coalesce(new.instagram, new.nome));
    end if;

  elsif tg_table_name = 'somos_preta_contratos' then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      insert into somos_preta_atividades (entidade, entidade_id, tipo, autor_id, resumo)
      values ('contrato', new.id, 'contrato_' || new.status::text, auth.uid(),
              'Contrato ' || new.status::text || ': ' || new.titulo);
    end if;
  end if;

  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'somos_preta_clientes', 'somos_preta_campanhas',
    'somos_preta_influencers', 'somos_preta_contratos'
  ] loop
    execute format('drop trigger if exists trg_atividade_%1$s on %1$s', t);
    execute format('create trigger trg_atividade_%1$s after insert or update on %1$s
                    for each row execute function somos_preta_registrar_atividade()', t);
  end loop;
end $$;

-- ============================================================================
-- CLIENTE: notas, arquivos e favoritos
-- ============================================================================
-- `observacoes` (0001) é UM texto do cadastro e já é a descrição longa da tela.
-- A aba "Notas" é uma lista com autor e data.
create table if not exists somos_preta_cliente_notas (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references somos_preta_clientes(id) on delete cascade,
  conteudo   text not null,
  autor_id   uuid references somos_preta_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_somos_preta_cliente_notas_cliente
  on somos_preta_cliente_notas (cliente_id, created_at desc);

-- somos_preta_tarefa_anexos tem tarefa_id NOT NULL: está preso à tarefa.
create table if not exists somos_preta_cliente_arquivos (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references somos_preta_clientes(id) on delete cascade,
  nome          text not null,
  tipo          somos_preta_tarefa_anexo_tipo not null default 'link',
  storage_path  text,
  link_externo  text,
  autor_id      uuid references somos_preta_profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_somos_preta_cliente_arquivos_cliente
  on somos_preta_cliente_arquivos (cliente_id, created_at desc);

-- somos_preta_favoritos (0009) não serve: influencer_id é NOT NULL com unique
-- sobre (influencer_id, profile_id).
create table if not exists somos_preta_cliente_favoritos (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references somos_preta_clientes(id) on delete cascade,
  profile_id uuid not null references somos_preta_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cliente_id, profile_id)
);

-- ============================================================================
-- RLS
-- ============================================================================
-- As policies staff_all de 0001 são aplicadas por um loop sobre um array FIXO
-- de tabelas: tabela nova NÃO herda nada e ficaria sem RLS.
do $$
declare t text;
begin
  foreach t in array array[
    'somos_preta_areas', 'somos_preta_atividades', 'somos_preta_cliente_notas',
    'somos_preta_cliente_arquivos', 'somos_preta_cliente_favoritos'
  ] loop
    execute format('alter table %s enable row level security', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'somos_preta_areas', 'somos_preta_cliente_notas',
    'somos_preta_cliente_arquivos', 'somos_preta_cliente_favoritos'
  ] loop
    execute format('drop policy if exists "staff_all_%1$s" on %1$s', t);
    execute format('create policy "staff_all_%1$s" on %1$s for all to authenticated
                    using (somos_preta_is_staff()) with check (somos_preta_is_staff())', t);
  end loop;
end $$;

-- Atividades é append-only pelos triggers (security definer): a equipe lê, e
-- ninguém reescreve histórico pela API.
drop policy if exists "staff_read_atividades" on somos_preta_atividades;
create policy "staff_read_atividades" on somos_preta_atividades
  for select to authenticated using (somos_preta_is_staff());

-- ============================================================================
-- MÉTRICAS
-- ============================================================================
-- O corpo de uma função `language sql` é analisado na CRIAÇÃO, e a análise
-- avalia literais de enum. Tipo criado neste mesmo arquivo — ainda por cima
-- dentro de bloco DO/EXCEPTION, que o deixa em subtransação — faz o Postgres
-- recusar o literal com "invalid input value for enum". Desligar a checagem adia
-- a análise para a primeira execução, quando o tipo já commitou. Mesmo recurso
-- de 0017_oauth_creator_no_insert.sql.
set check_function_bodies = off;
-- A listagem de tarefas precisa de subtarefas, comentários e anexos por linha.
-- Hoje a tela puxa a tabela INTEIRA de subtarefas e agrega no cliente; comentário
-- e anexo ninguém conta.
create or replace function somos_preta_tarefa_metricas()
returns table (
  tarefa_id uuid,
  subtarefas_total bigint,
  subtarefas_concluidas bigint,
  comentarios bigint,
  anexos bigint
)
language sql stable security definer set search_path = public
as $$
  select
    t.id,
    coalesce(s.total, 0),
    coalesce(s.concluidas, 0),
    coalesce(c.n, 0),
    coalesce(a.n, 0)
  from somos_preta_tarefas t
  left join (
    select tarefa_id, count(*) as total, count(*) filter (where concluida) as concluidas
    from somos_preta_subtarefas group by tarefa_id
  ) s on s.tarefa_id = t.id
  left join (
    select tarefa_id, count(*) as n from somos_preta_tarefa_comentarios group by tarefa_id
  ) c on c.tarefa_id = t.id
  left join (
    select tarefa_id, count(*) as n from somos_preta_tarefa_anexos group by tarefa_id
  ) a on a.tarefa_id = t.id
  where somos_preta_is_staff();
$$;

revoke all on function somos_preta_tarefa_metricas() from public;
grant execute on function somos_preta_tarefa_metricas() to authenticated;

-- Os quatro números do rodapé do card de campanha, mais a coluna
-- "3 campanhas / 1 ativa" da tela de clientes.
create or replace function somos_preta_campanha_metricas()
returns table (
  campanha_id uuid,
  tarefas_pendentes bigint,
  tarefas_vencidas bigint,
  proxima_entrega date,
  creators_mapeados bigint,
  creators_aprovados bigint
)
language sql stable security definer set search_path = public
as $$
  select
    c.id,
    coalesce(t.pendentes, 0),
    coalesce(t.vencidas, 0),
    t.proxima,
    coalesce(i.mapeados, 0),
    coalesce(i.aprovados, 0)
  from somos_preta_campanhas c
  left join (
    select
      campanha_id,
      count(*) filter (where status <> 'concluida' and status <> 'cancelada') as pendentes,
      count(*) filter (
        where status <> 'concluida' and status <> 'cancelada'
          and data_entrega is not null and data_entrega < current_date
      ) as vencidas,
      min(data_entrega) filter (
        where status <> 'concluida' and status <> 'cancelada'
          and data_entrega >= current_date
      ) as proxima
    from somos_preta_tarefas
    where arquivada = false
    group by campanha_id
  ) t on t.campanha_id = c.id
  left join (
    select
      campanha_id,
      count(*) as mapeados,
      -- "Aprovados" no card é todo mundo que já passou do crivo, não só quem
      -- está parado exatamente nessa etapa: quem foi contratado ou publicou
      -- obviamente também foi aprovado.
      count(*) filter (
        where etapa in ('aprovado_preta', 'enviado_cliente', 'aprovado_cliente', 'contratado', 'publicado')
      ) as aprovados
    from somos_preta_campanha_influencers group by campanha_id
  ) i on i.campanha_id = c.id
  where somos_preta_is_staff();
$$;

revoke all on function somos_preta_campanha_metricas() from public;
grant execute on function somos_preta_campanha_metricas() to authenticated;

reset check_function_bodies;

-- ============================================================================
-- STORAGE
-- ============================================================================
-- Capa de campanha e arquivos de cliente. Mesmo molde de 0013_midia_kit_storage.
insert into storage.buckets (id, name, public, file_size_limit)
values ('campanhas', 'campanhas', true, 10485760)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('clientes', 'clientes', false, 26214400)
on conflict (id) do nothing;

drop policy if exists "campanhas_public_read" on storage.objects;
create policy "campanhas_public_read" on storage.objects
  for select using (bucket_id = 'campanhas');

drop policy if exists "campanhas_staff_write" on storage.objects;
create policy "campanhas_staff_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'campanhas' and somos_preta_is_staff())
  with check (bucket_id = 'campanhas' and somos_preta_is_staff());

drop policy if exists "clientes_staff_all" on storage.objects;
create policy "clientes_staff_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'clientes' and somos_preta_is_staff())
  with check (bucket_id = 'clientes' and somos_preta_is_staff());

-- ============================================================================
-- FIM
-- ============================================================================
