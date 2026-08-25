-- ============================================================================
-- Fix: excluir uma tarefa que tinha colaborador falhava com 409
-- Erro real: 23503 "insert or update on table somos_preta_tarefa_eventos
-- violates foreign key constraint" — ao excluir a tarefa, o cascade em
-- somos_preta_tarefa_colaboradores dispara a trigger de auditoria, que
-- tentava gravar um evento apontando pra uma tarefa que já não existe mais
-- nesse ponto (o pai já foi removido antes dos cascades rodarem).
-- Corrige só registrando o evento "colaborador_removido" quando a tarefa
-- ainda existe (remoção manual de colaborador, não exclusão em cascata).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar). Só recria a
-- função — nenhuma tabela/dado é alterado.
-- ============================================================================
create or replace function somos_preta_tarefa_colaborador_evento()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_novo)
    values (new.tarefa_id, 'colaborador_adicionado', auth.uid(), new.profile_id::text);
    return new;
  elsif tg_op = 'DELETE' then
    if exists (select 1 from somos_preta_tarefas where id = old.tarefa_id) then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior)
      values (old.tarefa_id, 'colaborador_removido', auth.uid(), old.profile_id::text);
    end if;
    return old;
  end if;
  return null;
end;
$$;

-- ============================================================================
-- FIM
-- ============================================================================
