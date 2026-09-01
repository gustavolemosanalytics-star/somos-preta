-- ============================================================================
-- Somos Preta — Garante um único Media Kit por creator
-- Achado em teste: o editor fazia select-then-insert sem atomicidade; sob
-- corrida (StrictMode do React em dev, ou só recarregar a página rápido o
-- suficiente) isso criava múltiplas linhas de media kit para o mesmo
-- creator, e o .maybeSingle() no client passava a falhar silenciosamente
-- (erro ignorado) assim que havia mais de uma linha, piorando a cada reload.
--
-- Esta migration remove as duplicatas de teste (mantém a mais antiga por
-- cadastrado_por) e adiciona uma constraint unique para impedir recorrência
-- — o client agora faz upsert(onConflict: "cadastrado_por") em vez de
-- select-then-insert.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

delete from somos_preta_midia_kits a
using somos_preta_midia_kits b
where a.cadastrado_por is not null
  and a.cadastrado_por = b.cadastrado_por
  and a.created_at > b.created_at;

alter table somos_preta_midia_kits
  drop constraint if exists somos_preta_midia_kits_cadastrado_por_key;
alter table somos_preta_midia_kits
  add constraint somos_preta_midia_kits_cadastrado_por_key unique (cadastrado_por);

-- ============================================================================
-- FIM
-- ============================================================================
