-- ============================================================================
-- Somos Preta — Tarefas: ampliação da auditoria (fix de UX)
-- QA reportou que o histórico não registra edição de título, descrição,
-- tags, campanha (mover), arquivamento e exigência de evidência — essas
-- colunas hoje são atualizadas silenciosamente pelo client sem gerar evento.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

alter type somos_preta_tarefa_evento_tipo add value if not exists 'titulo';
alter type somos_preta_tarefa_evento_tipo add value if not exists 'descricao';
alter type somos_preta_tarefa_evento_tipo add value if not exists 'tags';
alter type somos_preta_tarefa_evento_tipo add value if not exists 'campanha';
alter type somos_preta_tarefa_evento_tipo add value if not exists 'arquivamento';
alter type somos_preta_tarefa_evento_tipo add value if not exists 'evidencia_obrigatoria';

-- Recria o trigger de auditoria (Milestone 1 + Milestone 2) incluindo os
-- seis campos acima. Corpo idêntico ao de 0008_tarefas_colaboracao.sql,
-- só com os novos blocos `if new.X is distinct from old.X` no final.
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

      if new.status = 'concluida' and new.solicitante_id is not null and new.solicitante_id is distinct from actor then
        insert into somos_preta_notificacoes (destinatario_id, tipo, tarefa_id, ator_id)
        values (new.solicitante_id, 'conclusao', new.id, actor);
      end if;
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

      if new.responsavel is not null and new.responsavel is distinct from actor then
        insert into somos_preta_notificacoes (destinatario_id, tipo, tarefa_id, ator_id)
        values (new.responsavel, 'tarefa_atribuida', new.id, actor);
      end if;
    end if;

    if new.solicitante_id is distinct from old.solicitante_id then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'solicitante', actor, old.solicitante_id::text, new.solicitante_id::text);
    end if;

    if new.titulo is distinct from old.titulo then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'titulo', actor, old.titulo, new.titulo);
    end if;

    if new.descricao is distinct from old.descricao then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'descricao', actor, old.descricao, new.descricao);
    end if;

    if new.tags is distinct from old.tags then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'tags', actor, array_to_string(old.tags, ', '), array_to_string(new.tags, ', '));
    end if;

    if new.campanha_id is distinct from old.campanha_id then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'campanha', actor, old.campanha_id::text, new.campanha_id::text);
    end if;

    if new.arquivada is distinct from old.arquivada then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'arquivamento', actor, old.arquivada::text, new.arquivada::text);
    end if;

    if new.evidencia_obrigatoria is distinct from old.evidencia_obrigatoria then
      insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior, valor_novo)
      values (new.id, 'evidencia_obrigatoria', actor, old.evidencia_obrigatoria::text, new.evidencia_obrigatoria::text);
    end if;
  end if;

  return new;
end;
$$;

-- ============================================================================
-- FIM
-- ============================================================================
