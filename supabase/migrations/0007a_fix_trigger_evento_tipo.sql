-- ============================================================================
-- Fix: trigger de auditoria de tarefas falhava ao concluir/reabrir
-- Erro real: 42804 "column tipo is of type somos_preta_tarefa_evento_tipo
-- but expression is of type text" — um CASE dentro do INSERT VALUES sem
-- cast explícito resolve para `text`, e o Postgres não faz cast implícito
-- de text para enum nesse contexto (só faz para "unknown"/literal solto).
-- Corrige aplicando o cast ao resultado do CASE inteiro.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar). Só recria a
-- função — nenhuma tabela/dado é alterado.
-- ============================================================================
create or replace function somos_preta_tarefa_registrar_evento()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_novo)
    values (new.id, 'criacao', coalesce(actor, new.created_by), new.titulo);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (
        new.id,
        (case
          when new.status = 'concluida' then 'conclusao'
          when old.status = 'concluida' then 'reabertura'
          else 'status'
        end)::somos_preta_tarefa_evento_tipo,
        actor, old.status::text, new.status::text
      );
    end if;

    if new.prioridade is distinct from old.prioridade then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'prioridade', actor, old.prioridade::text, new.prioridade::text);
    end if;

    if new.data_entrega is distinct from old.data_entrega then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'prazo', actor, old.data_entrega::text, new.data_entrega::text);
    end if;

    if new.responsavel is distinct from old.responsavel then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'responsavel', actor, old.responsavel::text, new.responsavel::text);
    end if;

    if new.solicitante_id is distinct from old.solicitante_id then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'solicitante', actor, old.solicitante_id::text, new.solicitante_id::text);
    end if;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- FIM
-- ============================================================================
