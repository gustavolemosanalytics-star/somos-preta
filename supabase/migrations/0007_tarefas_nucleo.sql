-- ============================================================================
-- Somos Preta — Tarefas: núcleo estrutural (Milestone 1)
-- Responsabilidade (TAR-01), checkbox de conclusão (TAR-02), autoria de
-- alteração (TAR-03), histórico/timeline (TAR-04), status operacionais
-- (TAR-09), prazo com início/horário (TAR-11).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

-- ============================================================================
-- STATUS DE TAREFA (TAR-09)
-- O enum somos_preta_tarefa_status hoje é usado tanto em somos_preta_tarefas
-- quanto em somos_preta_campanha_influencers (status do creator na campanha,
-- que reaproveitou o tipo por conveniência e não tem relação com o fluxo de
-- tarefas). Para expandir os status de tarefa sem carregar esse enum
-- "estranho" na tabela de campanha↔influencer, renomeamos o tipo atual
-- (mantendo seus 4 valores intactos onde já é usado) e criamos um novo
-- somos_preta_tarefa_status com os 8 status operacionais pedidos.
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'somos_preta_creator_campanha_status') then
    alter type somos_preta_tarefa_status rename to somos_preta_creator_campanha_status;

    create type somos_preta_tarefa_status as enum (
      'backlog', 'a_fazer', 'em_andamento', 'aguardando_terceiro',
      'aguardando_aprovacao', 'bloqueada', 'concluida', 'cancelada'
    );

    alter table somos_preta_tarefas alter column status drop default;
    alter table somos_preta_tarefas
      alter column status type somos_preta_tarefa_status
      using (
        case status::text
          when 'pendente' then 'a_fazer'
          else status::text
        end
      )::somos_preta_tarefa_status;
    alter table somos_preta_tarefas alter column status set default 'backlog';
  end if;
end $$;

-- ============================================================================
-- RESPONSABILIDADE (TAR-01) + PRAZO (TAR-11)
-- somos_preta_tarefas.responsavel já existe e cobre "Responsável principal".
-- Faltam solicitante e a granularidade de início/horário do prazo.
-- ============================================================================
alter table somos_preta_tarefas
  add column if not exists solicitante_id uuid references somos_preta_profiles(id) on delete set null,
  add column if not exists data_inicio date,
  add column if not exists horario time;

update somos_preta_tarefas set solicitante_id = created_by where solicitante_id is null;

-- Colaboradores (TAR-01): participantes da execução, além do responsável principal.
create table if not exists somos_preta_tarefa_colaboradores (
  id          uuid primary key default gen_random_uuid(),
  tarefa_id   uuid not null references somos_preta_tarefas(id) on delete cascade,
  profile_id  uuid not null references somos_preta_profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (tarefa_id, profile_id)
);
create index if not exists idx_somos_preta_tarefa_colaboradores_tarefa on somos_preta_tarefa_colaboradores(tarefa_id);

alter table somos_preta_tarefa_colaboradores enable row level security;
drop policy if exists "staff_all_tarefa_colaboradores" on somos_preta_tarefa_colaboradores;
create policy "staff_all_tarefa_colaboradores" on somos_preta_tarefa_colaboradores for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

-- ============================================================================
-- HISTÓRICO / AUDITORIA (TAR-03 + TAR-04)
-- Tabela append-only: sem policy de insert/update/delete para `authenticated`,
-- só o trigger (security definer, roda como owner e ignora RLS — mesmo padrão
-- de somos_preta_guard_role_change na migration 0003) grava eventos. Isso
-- torna o histórico impossível de burlar pelo client.
-- ============================================================================
do $$ begin
  create type somos_preta_tarefa_evento_tipo as enum (
    'criacao', 'status', 'prioridade', 'prazo', 'responsavel', 'solicitante',
    'colaborador_adicionado', 'colaborador_removido', 'conclusao', 'reabertura'
  );
exception when duplicate_object then null; end $$;

create table if not exists somos_preta_tarefa_eventos (
  id             uuid primary key default gen_random_uuid(),
  tarefa_id      uuid not null references somos_preta_tarefas(id) on delete cascade,
  tipo           somos_preta_tarefa_evento_tipo not null,
  autor_id       uuid references somos_preta_profiles(id) on delete set null,
  valor_anterior text,
  valor_novo     text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_somos_preta_tarefa_eventos_tarefa on somos_preta_tarefa_eventos(tarefa_id, created_at);

alter table somos_preta_tarefa_eventos enable row level security;
drop policy if exists "staff_read_tarefa_eventos" on somos_preta_tarefa_eventos;
create policy "staff_read_tarefa_eventos" on somos_preta_tarefa_eventos for select to authenticated
  using (somos_preta_is_staff());

-- Registra criação e mudança de status/prioridade/prazo/responsável/solicitante.
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
        case
          when new.status = 'concluida' then 'conclusao'
          when old.status = 'concluida' then 'reabertura'
          else 'status'
        end,
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

drop trigger if exists trg_somos_preta_tarefa_eventos on somos_preta_tarefas;
create trigger trg_somos_preta_tarefa_eventos
  after insert or update on somos_preta_tarefas
  for each row execute function somos_preta_tarefa_registrar_evento();

-- Registra entrada/saída de colaboradores.
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
    insert into somos_preta_tarefa_eventos (tarefa_id, tipo, autor_id, valor_anterior)
    values (old.tarefa_id, 'colaborador_removido', auth.uid(), old.profile_id::text);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_somos_preta_tarefa_colaborador_evento on somos_preta_tarefa_colaboradores;
create trigger trg_somos_preta_tarefa_colaborador_evento
  after insert or delete on somos_preta_tarefa_colaboradores
  for each row execute function somos_preta_tarefa_colaborador_evento();

-- ============================================================================
-- FIM — Milestone 1
-- ============================================================================
