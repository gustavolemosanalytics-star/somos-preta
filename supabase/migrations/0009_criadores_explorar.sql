-- ============================================================================
-- Somos Preta — Criadores: unificação e descoberta (Milestone 3)
-- Novos campos para filtros/listagem (CRI-03, CRI-04) e favoritos (CRI-15).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

alter table somos_preta_influencers
  add column if not exists genero text,
  add column if not exists views_medias integer default 0;

-- ============================================================================
-- FAVORITOS (CRI-15) — por usuário, sem precisar associar a campanha/lista
-- ============================================================================
create table if not exists somos_preta_favoritos (
  id            uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references somos_preta_influencers(id) on delete cascade,
  profile_id    uuid not null references somos_preta_profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (influencer_id, profile_id)
);
create index if not exists idx_somos_preta_favoritos_profile on somos_preta_favoritos(profile_id);

alter table somos_preta_favoritos enable row level security;
drop policy if exists "staff_all_favoritos" on somos_preta_favoritos;
create policy "staff_all_favoritos" on somos_preta_favoritos for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

-- ============================================================================
-- FIM — Milestone 3
-- ============================================================================
