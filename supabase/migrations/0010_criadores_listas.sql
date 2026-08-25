-- ============================================================================
-- Somos Preta — Criadores: listas, pipeline e ficha individual (Milestone 4)
-- CRI-12 (listas/mapeamentos) e CRI-13 (pipeline de seleção/contratação).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

do $$ begin
  create type somos_preta_pipeline_etapa as enum (
    'mapeado', 'em_analise', 'contatado', 'interessado', 'negociacao',
    'aprovado_preta', 'enviado_cliente', 'aprovado_cliente', 'contratado', 'publicado'
  );
exception when duplicate_object then null; end $$;

create table if not exists somos_preta_listas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  descricao   text,
  cliente_id  uuid references somos_preta_clientes(id) on delete set null,
  campanha_id uuid references somos_preta_campanhas(id) on delete set null,
  criado_por  uuid references somos_preta_profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table somos_preta_listas enable row level security;
drop policy if exists "staff_all_listas" on somos_preta_listas;
create policy "staff_all_listas" on somos_preta_listas for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

drop trigger if exists trg_touch_somos_preta_listas on somos_preta_listas;
create trigger trg_touch_somos_preta_listas before update on somos_preta_listas
  for each row execute function somos_preta_touch_updated_at();

create table if not exists somos_preta_lista_criadores (
  id            uuid primary key default gen_random_uuid(),
  lista_id      uuid not null references somos_preta_listas(id) on delete cascade,
  influencer_id uuid not null references somos_preta_influencers(id) on delete cascade,
  etapa         somos_preta_pipeline_etapa not null default 'mapeado',
  added_at      timestamptz not null default now(),
  unique (lista_id, influencer_id)
);
create index if not exists idx_somos_preta_lista_criadores_lista on somos_preta_lista_criadores(lista_id);

alter table somos_preta_lista_criadores enable row level security;
drop policy if exists "staff_all_lista_criadores" on somos_preta_lista_criadores;
create policy "staff_all_lista_criadores" on somos_preta_lista_criadores for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

-- ============================================================================
-- FIM — Milestone 4
-- ============================================================================
