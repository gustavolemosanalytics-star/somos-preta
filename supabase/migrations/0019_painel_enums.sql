-- ============================================================================
-- Somos Preta — Painel: valores de enum novos
--
-- Arquivo separado de propósito, e precisa rodar ANTES de 0020.
-- Postgres aceita ALTER TYPE ... ADD VALUE dentro de transação, mas proíbe USAR
-- o valor novo na mesma transação ("unsafe use of new value"). O SQL Editor roda
-- cada arquivo como UMA transação, então os dois valores abaixo ficam sozinhos
-- aqui e só podem ser usados a partir do próximo run. Mesmo cuidado de
-- 0012_tarefas_auditoria_ux.sql e 0018_blog_editorial.sql.
--
-- ATENÇÃO à ordem de implantação: os mapas Record<Status, …> do TypeScript
-- quebram em runtime quando aparece um status que eles não conhecem. Suba o
-- código tolerante ANTES de rodar este arquivo.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

-- Campanha "Em aprovação": o enum só tinha rascunho/planejamento/ativa/
-- concluida/cancelada, e o card do mock mostra esse estado explicitamente.
alter type somos_preta_campanha_status add value if not exists 'em_aprovacao';

-- Tarefa "Em revisão": é a quarta coluna do board. Diferente de
-- 'aguardando_aprovacao' (parado, esperando alguém decidir) — aqui alguém está
-- ativamente revisando, e o board já tem uma coluna para o caso do "parado".
alter type somos_preta_tarefa_status add value if not exists 'em_revisao';

-- ============================================================================
-- FIM
-- ============================================================================
