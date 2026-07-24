-- ============================================================================
-- Somos Preta — Hub de Creators
-- Schema inicial · todas as tabelas com prefixo somos_preta_
-- Hierarquia principal: cliente > campanhas > tarefas
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

-- Extensões -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
do $$ begin
  create type somos_preta_role as enum ('admin', 'gestor', 'analista', 'creator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_influencer_status as enum ('ativo', 'inativo', 'negociando', 'bloqueado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_campanha_status as enum ('rascunho', 'planejamento', 'ativa', 'concluida', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_tarefa_status as enum ('pendente', 'em_andamento', 'concluida', 'bloqueada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_tarefa_prioridade as enum ('baixa', 'media', 'alta', 'urgente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_contrato_status as enum ('pendente', 'assinado', 'expirado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type somos_preta_blog_status as enum ('rascunho', 'publicado');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- PERFIS  (liga-se a auth.users do Supabase Auth)
-- ============================================================================
create table if not exists somos_preta_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text,
  email       text,
  avatar_url  text,
  role        somos_preta_role not null default 'creator',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Cria o perfil automaticamente quando um usuário se registra
create or replace function somos_preta_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into somos_preta_profiles (id, nome, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists somos_preta_on_auth_user_created on auth.users;
create trigger somos_preta_on_auth_user_created
  after insert on auth.users
  for each row execute function somos_preta_handle_new_user();

-- Helper: o usuário atual faz parte da equipe interna (staff)?
-- security definer -> roda como owner e ignora RLS (evita recursão nas policies).
create or replace function somos_preta_is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from somos_preta_profiles
    where id = auth.uid() and role in ('admin', 'gestor', 'analista')
  );
$$;

-- ============================================================================
-- CLIENTES  (topo da hierarquia)
-- ============================================================================
create table if not exists somos_preta_clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  empresa     text,
  email       text,
  telefone    text,
  logo_url    text,
  segmento    text,
  cidade      text,
  estado      text,
  observacoes text,
  created_by  uuid references somos_preta_profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================================
-- INFLUENCERS / CREATORS
-- ============================================================================
create table if not exists somos_preta_influencers (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text,
  telefone      text,
  username      text,
  instagram     text,
  tiktok        text,
  youtube       text,
  twitter       text,
  avatar_url    text,
  bio           text,
  followers     integer default 0,
  engagement    numeric(6,2) default 0,
  avg_likes     integer default 0,
  avg_comments  integer default 0,
  avg_shares    integer default 0,
  growth_rate   numeric(6,2) default 0,
  nicho         text[] default '{}',
  estado        text,
  cidade        text,
  status        somos_preta_influencer_status not null default 'ativo',
  cache_value   numeric(12,2),
  audience_data jsonb,        -- { ageRanges, genderSplit, topCities }
  portfolio     jsonb,
  tags          text[] default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_somos_preta_influencers_estado on somos_preta_influencers(estado);
create index if not exists idx_somos_preta_influencers_status on somos_preta_influencers(status);

-- ============================================================================
-- CAMPANHAS  (cliente > campanhas)
-- ============================================================================
create table if not exists somos_preta_campanhas (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references somos_preta_clientes(id) on delete cascade,
  nome        text not null,
  briefing    text,
  objetivo    text,
  budget      numeric(12,2) default 0,
  data_inicio date,
  data_fim    date,
  status      somos_preta_campanha_status not null default 'rascunho',
  share_token text unique default replace(gen_random_uuid()::text, '-', ''),
  created_by  uuid references somos_preta_profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_somos_preta_campanhas_cliente on somos_preta_campanhas(cliente_id);
create index if not exists idx_somos_preta_campanhas_status on somos_preta_campanhas(status);

-- Influencers vinculados a uma campanha (join)
create table if not exists somos_preta_campanha_influencers (
  id            uuid primary key default gen_random_uuid(),
  campanha_id   uuid not null references somos_preta_campanhas(id) on delete cascade,
  influencer_id uuid not null references somos_preta_influencers(id) on delete cascade,
  deliverables  jsonb,
  pagamento     numeric(12,2) default 0,
  status        somos_preta_tarefa_status not null default 'pendente',
  geo_percent   numeric(6,2),
  top_cities    text[],
  status_bia    text,
  created_at    timestamptz not null default now(),
  unique (campanha_id, influencer_id)
);
create index if not exists idx_somos_preta_camp_inf_campanha on somos_preta_campanha_influencers(campanha_id);

-- ============================================================================
-- TAREFAS  (campanhas > tarefas)
-- ============================================================================
create table if not exists somos_preta_tarefas (
  id           uuid primary key default gen_random_uuid(),
  campanha_id  uuid not null references somos_preta_campanhas(id) on delete cascade,
  titulo       text not null,
  descricao    text,
  status       somos_preta_tarefa_status not null default 'pendente',
  prioridade   somos_preta_tarefa_prioridade not null default 'media',
  responsavel  uuid references somos_preta_profiles(id) on delete set null,
  influencer_id uuid references somos_preta_influencers(id) on delete set null,
  data_entrega date,
  concluida_em timestamptz,
  ordem        integer default 0,
  created_by   uuid references somos_preta_profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_somos_preta_tarefas_campanha on somos_preta_tarefas(campanha_id);
create index if not exists idx_somos_preta_tarefas_status on somos_preta_tarefas(status);
create index if not exists idx_somos_preta_tarefas_responsavel on somos_preta_tarefas(responsavel);

-- ============================================================================
-- CONTRATOS
-- ============================================================================
create table if not exists somos_preta_contratos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  conteudo      text,
  influencer_id uuid references somos_preta_influencers(id) on delete set null,
  campanha_id   uuid references somos_preta_campanhas(id) on delete set null,
  status        somos_preta_contrato_status not null default 'pendente',
  pdf_url       text,
  pdf_name      text,
  assinado_em   timestamptz,
  expira_em     timestamptz,
  versao        integer default 1,
  created_by    uuid references somos_preta_profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================================
-- MENSAGENS  (chat interno estilo WhatsApp)
-- ============================================================================
create table if not exists somos_preta_mensagens (
  id            uuid primary key default gen_random_uuid(),
  contato_nome  text not null,
  contato_avatar text,
  influencer_id uuid references somos_preta_influencers(id) on delete set null,
  conteudo      text not null,
  origem        text not null default 'contato', -- 'contato' | 'eu'
  lida          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_somos_preta_mensagens_contato on somos_preta_mensagens(contato_nome);

-- ============================================================================
-- MÍDIA KITS  (criação vai para dentro do hub; mostra quem cadastrou)
-- ============================================================================
create table if not exists somos_preta_midia_kits (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  nome           text not null,
  email          text,
  telefone       text,
  whatsapp       text,
  bio            text,
  avatar_url     text,
  cover_url      text,
  cidade         text,
  estado         text,
  nichos         text[] default '{}',
  tema           text default 'terracota',
  redes          jsonb,        -- { instagram: {handle, followers}, tiktok: {...}, ... }
  portfolio      jsonb,        -- [{ titulo, imagem, descricao, link }]
  pacotes        jsonb,        -- [{ nome, preco, descricao, itens[] }]
  publicado      boolean not null default true,
  cadastrado_por uuid references somos_preta_profiles(id) on delete set null,
  influencer_id  uuid references somos_preta_influencers(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================================
-- BLOG  (área dentro do hub)
-- ============================================================================
create table if not exists somos_preta_blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  titulo       text not null,
  resumo       text,
  conteudo     text,
  cover_url    text,
  categoria    text,
  tags         text[] default '{}',
  status       somos_preta_blog_status not null default 'rascunho',
  autor_id     uuid references somos_preta_profiles(id) on delete set null,
  publicado_em timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_somos_preta_blog_status on somos_preta_blog_posts(status);

-- ============================================================================
-- CREATORS conectados via Facebook/Instagram OAuth
-- ============================================================================
create table if not exists somos_preta_creators (
  id                 uuid primary key default gen_random_uuid(),
  nome               text,
  email              text,
  facebook_id        text,
  instagram_id       text unique,
  instagram_username text,
  followers          integer default 0,
  media_count        integer default 0,
  profile_pic        text,
  bio                text,
  access_token       text,
  created_at         timestamptz not null default now()
);

-- ============================================================================
-- updated_at automático
-- ============================================================================
create or replace function somos_preta_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array[
    'somos_preta_profiles','somos_preta_clientes','somos_preta_influencers',
    'somos_preta_campanhas','somos_preta_tarefas','somos_preta_contratos',
    'somos_preta_midia_kits','somos_preta_blog_posts'
  ] loop
    execute format('drop trigger if exists trg_touch_%1$s on %1$s', t);
    execute format('create trigger trg_touch_%1$s before update on %1$s
                    for each row execute function somos_preta_touch_updated_at()', t);
  end loop;
end $$;

-- ============================================================================
-- ROW LEVEL SECURITY
--   • Usuários autenticados (equipe): acesso total ao hub.
--   • Público (anon): leitura de blog publicado, mídia kits publicados,
--     influencers e portal do cliente (campanhas por link).
-- ============================================================================
-- Habilita RLS em todas as tabelas
do $$
declare t text;
begin
  foreach t in array array[
    'somos_preta_profiles','somos_preta_clientes','somos_preta_influencers',
    'somos_preta_campanhas','somos_preta_campanha_influencers','somos_preta_tarefas',
    'somos_preta_contratos','somos_preta_mensagens','somos_preta_midia_kits',
    'somos_preta_blog_posts','somos_preta_creators'
  ] loop
    execute format('alter table %s enable row level security', t);
  end loop;
end $$;

-- Tabelas internas do hub: acesso total APENAS para a equipe (staff)
do $$
declare t text;
begin
  foreach t in array array[
    'somos_preta_clientes','somos_preta_campanhas','somos_preta_campanha_influencers',
    'somos_preta_tarefas','somos_preta_contratos','somos_preta_mensagens','somos_preta_creators'
  ] loop
    execute format('drop policy if exists "staff_all_%1$s" on %1$s', t);
    execute format('create policy "staff_all_%1$s" on %1$s for all to authenticated
                    using (somos_preta_is_staff()) with check (somos_preta_is_staff())', t);
  end loop;
end $$;

-- PROFILES: equipe vê/gerencia todos; cada usuário vê/edita o próprio perfil
drop policy if exists "staff_all_profiles" on somos_preta_profiles;
create policy "staff_all_profiles" on somos_preta_profiles for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());
drop policy if exists "self_profile" on somos_preta_profiles;
create policy "self_profile" on somos_preta_profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- INFLUENCERS: equipe gerencia; leitura pública (diretório)
drop policy if exists "staff_all_influencers" on somos_preta_influencers;
create policy "staff_all_influencers" on somos_preta_influencers for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());
drop policy if exists "public_read_influencers" on somos_preta_influencers;
create policy "public_read_influencers" on somos_preta_influencers for select using (true);

-- MÍDIA KITS: equipe gerencia tudo; o creator gerencia SÓ o próprio; público lê publicados
drop policy if exists "staff_all_midia_kits" on somos_preta_midia_kits;
create policy "staff_all_midia_kits" on somos_preta_midia_kits for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());
drop policy if exists "creator_own_midia_kits" on somos_preta_midia_kits;
create policy "creator_own_midia_kits" on somos_preta_midia_kits for all to authenticated
  using (cadastrado_por = auth.uid()) with check (cadastrado_por = auth.uid());
drop policy if exists "public_read_midia_kits" on somos_preta_midia_kits;
create policy "public_read_midia_kits" on somos_preta_midia_kits for select using (publicado = true);

-- BLOG: equipe gerencia; leitura pública dos posts publicados
drop policy if exists "staff_all_blog" on somos_preta_blog_posts;
create policy "staff_all_blog" on somos_preta_blog_posts for all to authenticated
  using (somos_preta_is_staff()) with check (somos_preta_is_staff());
drop policy if exists "public_read_blog" on somos_preta_blog_posts;
create policy "public_read_blog" on somos_preta_blog_posts for select using (status = 'publicado');

-- PORTAL DO CLIENTE (público via link): leitura das campanhas e vínculos
drop policy if exists "portal_read_campanhas" on somos_preta_campanhas;
create policy "portal_read_campanhas" on somos_preta_campanhas for select to anon using (true);
drop policy if exists "portal_read_camp_inf" on somos_preta_campanha_influencers;
create policy "portal_read_camp_inf" on somos_preta_campanha_influencers for select to anon using (true);

-- ============================================================================
-- FIM
-- ============================================================================
