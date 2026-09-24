-- ============================================================================
-- Somos Preta — Métricas do Media Kit
--
-- O painel do criador mostra visualizações da página, cliques no botão de
-- contato e downloads do PDF. Nada disso era medido: os três números não
-- existiam em lugar nenhum do banco.
--
-- Uma tabela só para os três, e não três tabelas, porque eles são a MESMA
-- coisa — um acontecimento datado na página de um kit — e separá-los faria
-- toda leitura do painel virar três consultas para somar no cliente.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) A tabela
-- ----------------------------------------------------------------------------
create table if not exists somos_preta_midia_kit_eventos (
  id         uuid primary key default gen_random_uuid(),
  kit_id     uuid not null references somos_preta_midia_kits(id) on delete cascade,
  tipo       text not null check (tipo in ('visualizacao', 'clique_contato', 'download_pdf')),
  created_at timestamptz not null default now()
);

-- A consulta do painel é sempre "deste kit, deste tipo, nos últimos N dias".
-- O índice segue essa ordem para o Postgres não varrer a tabela inteira quando
-- ela crescer.
create index if not exists idx_midia_kit_eventos_leitura
  on somos_preta_midia_kit_eventos (kit_id, tipo, created_at desc);


-- ----------------------------------------------------------------------------
-- 2) Quem pode escrever: ninguém, diretamente
-- ----------------------------------------------------------------------------
-- Visitante anônimo precisa conseguir registrar uma visualização, mas dar
-- INSERT ao papel anon significaria deixar qualquer pessoa escrever qualquer
-- linha em nome de qualquer kit. A escrita passa só pela função abaixo, que é
-- security definer e valida o que recebe.

alter table somos_preta_midia_kit_eventos enable row level security;

drop policy if exists "criador_le_eventos_do_proprio_kit" on somos_preta_midia_kit_eventos;
create policy "criador_le_eventos_do_proprio_kit"
  on somos_preta_midia_kit_eventos for select to authenticated
  using (
    kit_id in (
      select id from somos_preta_midia_kits where cadastrado_por = auth.uid()
    )
  );

drop policy if exists "staff_le_eventos" on somos_preta_midia_kit_eventos;
create policy "staff_le_eventos"
  on somos_preta_midia_kit_eventos for select to authenticated
  using (somos_preta_is_staff());


-- ----------------------------------------------------------------------------
-- 3) O registrador
-- ----------------------------------------------------------------------------
-- Recebe o SLUG, não o id: o slug é o que a página pública conhece, e resolver
-- por ele aqui dentro impede que alguém registre evento num kit que não está
-- publicado — a linha simplesmente não é encontrada e a função sai calada.
--
-- Cala-se de propósito em vez de devolver erro: métrica que falha não pode
-- quebrar a página pública de ninguém.

create or replace function somos_preta_registrar_evento_kit(p_slug text, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  alvo uuid;
begin
  if p_tipo not in ('visualizacao', 'clique_contato', 'download_pdf') then
    return;
  end if;

  select id into alvo
  from somos_preta_midia_kits
  where slug = p_slug and publicado = true
  limit 1;

  if alvo is null then
    return;
  end if;

  insert into somos_preta_midia_kit_eventos (kit_id, tipo) values (alvo, p_tipo);
end;
$$;

grant execute on function somos_preta_registrar_evento_kit(text, text) to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4) O leitor
-- ----------------------------------------------------------------------------
-- Devolve os números que o painel mostra, já comparados com o período
-- anterior, numa consulta só. Fazer isso no cliente exigiria trazer todas as
-- linhas de evento para a tela — que é exatamente o que não se deve fazer com
-- uma tabela que só cresce.
--
-- `p_dias` é a janela recente. A comparação olha a janela imediatamente
-- anterior, do mesmo tamanho, para "+24% em 30 dias" significar alguma coisa.

create or replace function somos_preta_midia_kit_metricas(p_kit_id uuid, p_dias integer default 30)
returns table (
  visualizacoes        bigint,
  cliques_contato      bigint,
  downloads_pdf        bigint,
  visualizacoes_antes  bigint,
  cliques_antes        bigint,
  downloads_antes      bigint
)
language sql
stable
security invoker
as $$
  with recorte as (
    select
      now() - make_interval(days => p_dias)     as inicio,
      now() - make_interval(days => p_dias * 2) as inicio_antes
  )
  select
    count(*) filter (where e.tipo = 'visualizacao'   and e.created_at >= r.inicio),
    count(*) filter (where e.tipo = 'clique_contato' and e.created_at >= r.inicio),
    count(*) filter (where e.tipo = 'download_pdf'   and e.created_at >= r.inicio),
    count(*) filter (where e.tipo = 'visualizacao'   and e.created_at >= r.inicio_antes and e.created_at < r.inicio),
    count(*) filter (where e.tipo = 'clique_contato' and e.created_at >= r.inicio_antes and e.created_at < r.inicio),
    count(*) filter (where e.tipo = 'download_pdf'   and e.created_at >= r.inicio_antes and e.created_at < r.inicio)
  from recorte r
  left join somos_preta_midia_kit_eventos e on e.kit_id = p_kit_id;
$$;

grant execute on function somos_preta_midia_kit_metricas(uuid, integer) to authenticated;


-- ============================================================================
-- Conferência rápida (opcional):
--   select tipo, count(*) from somos_preta_midia_kit_eventos group by tipo;
--   select * from somos_preta_midia_kit_metricas('<uuid-do-kit>', 30);
-- ============================================================================
-- FIM
-- ============================================================================
