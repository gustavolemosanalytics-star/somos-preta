-- ============================================================================
-- Somos Preta — Instagram conectado pela própria criadora (login)
--
-- A coleta por @ sai (era contra as regras da Meta e só via dado público).
-- Entra o login: a criadora autoriza o app da Somos Preta com a conta dela e
-- nós guardamos o token para atualizar os números todo dia — agora com
-- alcance, visualizações, salvamentos, compartilhamentos e demografia da
-- audiência, que nenhuma consulta por @ entrega.
--
-- Depende da 0024 (coletas, metricas_instagram, aparencia).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) Conexões: uma por criadora
-- ----------------------------------------------------------------------------
-- O token vai CIFRADO (AES-256-GCM, chave fora do banco — ver
-- src/lib/instagram/cofre.ts). E mesmo cifrado ninguém lê esta tabela pela
-- API: RLS ligada e NENHUMA política. Só o service_role (rotas do servidor)
-- enxerga. A criadora vê o estado da conexão pelas telas, que o servidor monta.

create table if not exists somos_preta_instagram_conexoes (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null unique references somos_preta_profiles(id) on delete cascade,
  kit_id             uuid references somos_preta_midia_kits(id) on delete set null,
  influencer_id      uuid references somos_preta_influencers(id) on delete set null,
  ig_user_id         text not null unique,
  username           text,
  -- Ids do lado da Meta, para casar os callbacks de exclusão de dados.
  meta_user_id       text,
  client_business_id text,
  token_cifrado      text not null,
  token_expira_em    timestamptz,
  status             text not null default 'ativa' check (status in ('ativa', 'revogada', 'erro')),
  ultimo_erro        text,
  conectado_em       timestamptz not null default now(),
  ultima_coleta_em   timestamptz,
  updated_at         timestamptz not null default now()
);

create index if not exists idx_somos_preta_instagram_conexoes_coleta
  on somos_preta_instagram_conexoes (ultima_coleta_em asc nulls first);
create index if not exists idx_somos_preta_instagram_conexoes_meta_user
  on somos_preta_instagram_conexoes (meta_user_id);

alter table somos_preta_instagram_conexoes enable row level security;
-- (sem políticas de propósito)


-- ----------------------------------------------------------------------------
-- 2) Histórico de coletas: o que só o login traz
-- ----------------------------------------------------------------------------
alter table somos_preta_instagram_coletas add column if not exists alcance_30d          bigint;
alter table somos_preta_instagram_coletas add column if not exists visualizacoes_30d    bigint;
alter table somos_preta_instagram_coletas add column if not exists contas_engajadas_30d bigint;
alter table somos_preta_instagram_coletas add column if not exists interacoes_30d       bigint;
alter table somos_preta_instagram_coletas add column if not exists insights            jsonb;
alter table somos_preta_instagram_coletas add column if not exists audiencia           jsonb;
alter table somos_preta_instagram_coletas add column if not exists stories             jsonb;

-- A fonte agora é a conta conectada. Os valores antigos seguem aceitos para
-- não quebrar linha que porventura exista de antes desta migration.
alter table somos_preta_instagram_coletas drop constraint if exists somos_preta_instagram_coletas_fonte_check;
alter table somos_preta_instagram_coletas
  add constraint somos_preta_instagram_coletas_fonte_check
  check (fonte in ('instagram', 'meta', 'consulta_publica'));


-- ============================================================================
-- Conferência rápida (opcional):
--   select username, status, conectado_em, ultima_coleta_em
--     from somos_preta_instagram_conexoes order by conectado_em desc;
-- ============================================================================
-- FIM
-- ============================================================================
