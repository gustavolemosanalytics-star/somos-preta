-- ============================================================================
-- Somos Preta — Tarefas: ações do cartão (TAR-18)
-- Tags e arquivamento — duplicar e mover não precisam de coluna nova
-- (duplicar é um insert client-side; mover só troca campanha_id).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

alter table somos_preta_tarefas
  add column if not exists tags text[] not null default '{}',
  add column if not exists arquivada boolean not null default false;

create index if not exists idx_somos_preta_tarefas_arquivada on somos_preta_tarefas(arquivada);

-- ============================================================================
-- FIM
-- ============================================================================
