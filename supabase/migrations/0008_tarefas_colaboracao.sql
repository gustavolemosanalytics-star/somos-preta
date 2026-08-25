-- ============================================================================
-- Somos Preta — Tarefas: colaboração (Milestone 2)
-- Subtarefas (TAR-12), evidência de conclusão (TAR-05), comunicação e
-- @menções (TAR-06, TAR-07 — inclui só a coluna `tipo` de TAR-08, pré-
-- requisito da notificação de solicitação de revisão), notificações
-- orientadas a evento (TAR-17, sem cron: prazo próximo/atrasada continuam
-- sendo badges computados on-read, já existentes desde o Milestone 1).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

-- ============================================================================
-- STORAGE — bucket privado para anexos/evidências de tarefas
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('tarefa-anexos', 'tarefa-anexos', false, 104857600) -- 100MB
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists "staff_all_tarefa_anexos_storage" on storage.objects;
create policy "staff_all_tarefa_anexos_storage" on storage.objects for all to authenticated
  using (bucket_id = 'tarefa-anexos' and somos_preta_is_staff())
  with check (bucket_id = 'tarefa-anexos' and somos_preta_is_staff());

-- ============================================================================
-- SUBTAREFAS (TAR-12)
-- ============================================================================
create table if not exists somos_preta_subtarefas (
  id             uuid primary key default gen_random_uuid(),
  tarefa_id      uuid not null references somos_preta_tarefas(id) on delete cascade,
  titulo         text not null,
  concluida      boolean not null default false,
  responsavel_id uuid references somos_preta_profiles(id) on delete set null,
  prazo          date,
  status         somos_preta_tarefa_status not null default 'a_fazer',
  ordem          integer default 0,
  created_by     uuid references somos_preta_profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_somos_preta_subtarefas_tarefa on somos_preta_subtarefas(tarefa_id);

alter table somos_preta_subtarefas enable row level security;
drop policy if exists "staff_all_subtarefas" on somos_preta_subtarefas;
create policy "staff_all_subtarefas" on somos_preta_subtarefas for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

drop trigger if exists trg_touch_somos_preta_subtarefas on somos_preta_subtarefas;
create trigger trg_touch_somos_preta_subtarefas before update on somos_preta_subtarefas
  for each row execute function somos_preta_touch_updated_at();

-- ============================================================================
-- COMENTÁRIOS / ATUALIZAÇÕES (TAR-06) + tipo (pré-requisito de TAR-17,
-- ver nota no cabeçalho — a triagem completa por tipo é TAR-08, fora desta
-- rodada) + @MENÇÕES (TAR-07)
-- ============================================================================
do $$ begin
  create type somos_preta_tarefa_comentario_tipo as enum (
    'comentario', 'duvida', 'bloqueio', 'atualizacao', 'solicitacao_revisao'
  );
exception when duplicate_object then null; end $$;

create table if not exists somos_preta_tarefa_comentarios (
  id           uuid primary key default gen_random_uuid(),
  tarefa_id    uuid not null references somos_preta_tarefas(id) on delete cascade,
  subtarefa_id uuid references somos_preta_subtarefas(id) on delete cascade,
  autor_id     uuid references somos_preta_profiles(id) on delete set null,
  conteudo     text not null,
  tipo         somos_preta_tarefa_comentario_tipo not null default 'comentario',
  created_at   timestamptz not null default now()
);
create index if not exists idx_somos_preta_tarefa_comentarios_tarefa on somos_preta_tarefa_comentarios(tarefa_id, created_at);

alter table somos_preta_tarefa_comentarios enable row level security;
drop policy if exists "staff_all_tarefa_comentarios" on somos_preta_tarefa_comentarios;
create policy "staff_all_tarefa_comentarios" on somos_preta_tarefa_comentarios for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

create table if not exists somos_preta_tarefa_mencoes (
  id            uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references somos_preta_tarefa_comentarios(id) on delete cascade,
  profile_id    uuid not null references somos_preta_profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (comentario_id, profile_id)
);

alter table somos_preta_tarefa_mencoes enable row level security;
drop policy if exists "staff_all_tarefa_mencoes" on somos_preta_tarefa_mencoes;
create policy "staff_all_tarefa_mencoes" on somos_preta_tarefa_mencoes for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

-- ============================================================================
-- ANEXOS / EVIDÊNCIA DE CONCLUSÃO (TAR-05, TAR-15)
-- ============================================================================
do $$ begin
  create type somos_preta_tarefa_anexo_tipo as enum ('imagem', 'pdf_documento', 'video', 'link');
exception when duplicate_object then null; end $$;

create table if not exists somos_preta_tarefa_anexos (
  id            uuid primary key default gen_random_uuid(),
  tarefa_id     uuid not null references somos_preta_tarefas(id) on delete cascade,
  subtarefa_id  uuid references somos_preta_subtarefas(id) on delete cascade,
  tipo          somos_preta_tarefa_anexo_tipo not null,
  storage_path  text, -- preenchido quando tipo é arquivo (imagem/pdf_documento/video)
  link_externo  text, -- preenchido quando tipo = 'link'
  nome          text,
  observacao    text,
  is_evidencia  boolean not null default false,
  autor_id      uuid references somos_preta_profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_somos_preta_tarefa_anexos_tarefa on somos_preta_tarefa_anexos(tarefa_id);

alter table somos_preta_tarefa_anexos enable row level security;
drop policy if exists "staff_all_tarefa_anexos" on somos_preta_tarefa_anexos;
create policy "staff_all_tarefa_anexos" on somos_preta_tarefa_anexos for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());

alter table somos_preta_tarefas
  add column if not exists evidencia_obrigatoria boolean not null default false;

-- ============================================================================
-- NOTIFICAÇÕES (TAR-17 — eventos; prazo próximo/atrasada seguem como
-- badges computados on-read, já existentes desde o Milestone 1)
-- ============================================================================
do $$ begin
  create type somos_preta_notificacao_tipo as enum (
    'tarefa_atribuida', 'mencao', 'comentario', 'solicitacao_revisao', 'conclusao'
  );
exception when duplicate_object then null; end $$;

create table if not exists somos_preta_notificacoes (
  id             uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references somos_preta_profiles(id) on delete cascade,
  tipo           somos_preta_notificacao_tipo not null,
  tarefa_id      uuid references somos_preta_tarefas(id) on delete cascade,
  ator_id        uuid references somos_preta_profiles(id) on delete set null,
  lida           boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists idx_somos_preta_notificacoes_destinatario on somos_preta_notificacoes(destinatario_id, lida, created_at);

alter table somos_preta_notificacoes enable row level security;
drop policy if exists "self_read_notificacoes" on somos_preta_notificacoes;
create policy "self_read_notificacoes" on somos_preta_notificacoes for select to authenticated
  using (destinatario_id = auth.uid());
drop policy if exists "self_update_notificacoes" on somos_preta_notificacoes;
create policy "self_update_notificacoes" on somos_preta_notificacoes for update to authenticated
  using (destinatario_id = auth.uid()) with check (destinatario_id = auth.uid());
-- Sem policy de insert para `authenticated`: só os triggers (security definer) gravam.

-- Recria o trigger de auditoria da tarefa (Milestone 1) incluindo as duas
-- notificações que dependem só de colunas de somos_preta_tarefas: atribuição
-- de responsável e conclusão.
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
  end if;

  return new;
end;
$$;

-- Comentário novo -> notifica responsável + solicitante + colaboradores (exceto o autor).
create or replace function somos_preta_tarefa_comentario_notificar()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_tipo somos_preta_notificacao_tipo := (case when new.tipo = 'solicitacao_revisao' then 'solicitacao_revisao' else 'comentario' end)::somos_preta_notificacao_tipo;
begin
  insert into somos_preta_notificacoes (destinatario_id, tipo, tarefa_id, ator_id)
  select distinct d.destinatario, v_tipo, new.tarefa_id, new.autor_id
  from (
    select responsavel as destinatario from somos_preta_tarefas where id = new.tarefa_id
    union
    select solicitante_id from somos_preta_tarefas where id = new.tarefa_id
    union
    select profile_id from somos_preta_tarefa_colaboradores where tarefa_id = new.tarefa_id
  ) d
  where d.destinatario is not null and d.destinatario is distinct from new.autor_id;

  return new;
end;
$$;

drop trigger if exists trg_somos_preta_tarefa_comentario_notificar on somos_preta_tarefa_comentarios;
create trigger trg_somos_preta_tarefa_comentario_notificar
  after insert on somos_preta_tarefa_comentarios
  for each row execute function somos_preta_tarefa_comentario_notificar();

-- Menção nova -> notifica a pessoa mencionada.
create or replace function somos_preta_tarefa_mencao_notificar()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_tarefa_id uuid;
  v_autor_id uuid;
begin
  select tarefa_id, autor_id into v_tarefa_id, v_autor_id
  from somos_preta_tarefa_comentarios where id = new.comentario_id;

  if new.profile_id is distinct from v_autor_id then
    insert into somos_preta_notificacoes (destinatario_id, tipo, tarefa_id, ator_id)
    values (new.profile_id, 'mencao', v_tarefa_id, v_autor_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_somos_preta_tarefa_mencao_notificar on somos_preta_tarefa_mencoes;
create trigger trg_somos_preta_tarefa_mencao_notificar
  after insert on somos_preta_tarefa_mencoes
  for each row execute function somos_preta_tarefa_mencao_notificar();

-- ============================================================================
-- FIM — Milestone 2
-- ============================================================================
