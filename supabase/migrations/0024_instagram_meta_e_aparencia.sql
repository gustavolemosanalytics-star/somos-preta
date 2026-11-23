-- ============================================================================
-- Somos Preta — Métricas do Instagram via Meta + personalização do Media Kit
--
-- DUAS COISAS, PORQUE A VITRINE PRECISA DAS DUAS AO MESMO TEMPO
--
-- 1. Personalização. O kit tinha uma escolha só: a cor (3 opções). Entra uma
--    coluna `aparencia` com tipografia, grafismo, abertura e ordem das seções,
--    mais `chamada` (a frase de efeito do topo) e `marcas` (com quem a criadora
--    já trabalhou). A paleta continua na coluna `tema`, que já era isso.
--
-- 2. Métricas do Instagram. A criadora digita o @ e o servidor consulta a
--    Graph API da Meta (Business Discovery) com o token da conta da Somos
--    Preta. O resultado fica em três lugares, cada um com um dono:
--
--      somos_preta_instagram_coletas  histórico: uma linha por consulta.
--                                     É daqui que sai o gráfico de
--                                     crescimento, para a criadora e para a
--                                     equipe.
--      somos_preta_midia_kits.metricas_instagram
--                                     o retrato mais recente, já calculado,
--                                     que a vitrine pública desenha.
--      somos_preta_influencers.*      seguidores, engajamento e médias, que
--                                     a lista de criadores do painel já lia
--                                     e que até hoje eram digitados à mão.
--
-- Quem escreve métrica é SÓ o servidor (service_role). A RLS deixa o criador
-- editar a própria linha de kit inteira; sem a guarda da seção 2, qualquer um
-- forjaria "verificado pela Meta" com uma chamada direta à API do Supabase.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) Colunas novas do kit
-- ----------------------------------------------------------------------------
alter table somos_preta_midia_kits add column if not exists aparencia jsonb not null default '{}'::jsonb;
alter table somos_preta_midia_kits add column if not exists chamada text;
alter table somos_preta_midia_kits add column if not exists marcas text[] not null default '{}';
alter table somos_preta_midia_kits add column if not exists metricas_instagram jsonb;


-- ----------------------------------------------------------------------------
-- 2) Guarda: métrica verificada só entra pelo servidor
-- ----------------------------------------------------------------------------
-- Quem chega pela API com JWT de usuário (authenticated) ou anônimo não muda
-- `metricas_instagram`: no INSERT ela nasce nula e no UPDATE o valor antigo é
-- mantido em silêncio — o resto do patch segue normalmente, para não quebrar
-- o salvamento do editor por causa de uma coluna que ele nem envia.
--
-- service_role (rotas do servidor) e o SQL Editor (sem JWT) passam.

create or replace function somos_preta_guard_metricas_instagram()
returns trigger
language plpgsql
as $$
declare
  papel text := coalesce(auth.jwt() ->> 'role', '');
begin
  if papel in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.metricas_instagram := null;
    else
      new.metricas_instagram := old.metricas_instagram;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists somos_preta_kit_guard_metricas on somos_preta_midia_kits;
create trigger somos_preta_kit_guard_metricas
  before insert or update on somos_preta_midia_kits
  for each row execute function somos_preta_guard_metricas_instagram();


-- ----------------------------------------------------------------------------
-- 3) View pública com as colunas novas
-- ----------------------------------------------------------------------------
-- `metricas_instagram` é tudo dado público do perfil (é o que o Business
-- Discovery devolve para qualquer conta profissional), então pode ir para a
-- vitrine. E-mail e telefone continuam de fora.

drop view if exists somos_preta_midia_kits_publicos;

create view somos_preta_midia_kits_publicos as
  select id, slug, nome, whatsapp, bio, avatar_url, cover_url,
         cidade, estado, nichos, tema, redes, portfolio, pacotes,
         publicado, created_at, updated_at,
         aparencia, chamada, marcas, metricas_instagram
  from somos_preta_midia_kits
  where publicado = true;

grant select on somos_preta_midia_kits_publicos to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 4) Base de criadores: de onde veio o número e quando
-- ----------------------------------------------------------------------------
-- `followers`, `engagement`, `avg_likes`, `avg_comments` e `growth_rate` já
-- existiam e passam a ser preenchidos pela coleta. Estas três dizem à equipe
-- se o número da tela é verificado e se está velho.

alter table somos_preta_influencers add column if not exists instagram_fonte text;
alter table somos_preta_influencers add column if not exists instagram_status text;
alter table somos_preta_influencers add column if not exists instagram_sincronizado_em timestamptz;

-- A rotina diária sempre pega "quem está há mais tempo sem atualizar".
create index if not exists idx_somos_preta_influencers_instagram_sinc
  on somos_preta_influencers (instagram_sincronizado_em asc nulls first);


-- ----------------------------------------------------------------------------
-- 5) Histórico de coletas
-- ----------------------------------------------------------------------------
create table if not exists somos_preta_instagram_coletas (
  id                     uuid primary key default gen_random_uuid(),
  influencer_id          uuid not null references somos_preta_influencers(id) on delete cascade,
  kit_id                 uuid references somos_preta_midia_kits(id) on delete set null,
  username               text not null,
  ig_user_id             text,
  fonte                  text not null check (fonte in ('meta', 'consulta_publica')),
  seguidores             integer,
  seguindo               integer,
  publicacoes            integer,
  media_curtidas         numeric(14,2),
  media_comentarios      numeric(14,2),
  media_visualizacoes    numeric(14,2),
  taxa_engajamento       numeric(8,3),
  posts_por_semana       numeric(6,2),
  publicacoes_analisadas integer not null default 0,
  formatos               jsonb,
  posts                  jsonb,
  coletado_em            timestamptz not null default now()
);

-- Toda leitura é "as coletas DESTE criador, das mais novas para as velhas".
create index if not exists idx_somos_preta_instagram_coletas_leitura
  on somos_preta_instagram_coletas (influencer_id, coletado_em desc);

alter table somos_preta_instagram_coletas enable row level security;

-- Sem política de INSERT/UPDATE/DELETE: só o service_role escreve.

drop policy if exists "staff_le_coletas_instagram" on somos_preta_instagram_coletas;
create policy "staff_le_coletas_instagram"
  on somos_preta_instagram_coletas for select to authenticated
  using (somos_preta_is_staff());

-- O criador lê o histórico do criador ligado ao PRÓPRIO kit — é o gráfico da
-- tela "Métricas" da área dele.
drop policy if exists "criador_le_proprias_coletas_instagram" on somos_preta_instagram_coletas;
create policy "criador_le_proprias_coletas_instagram"
  on somos_preta_instagram_coletas for select to authenticated
  using (
    influencer_id in (
      select influencer_id from somos_preta_midia_kits
      where cadastrado_por = auth.uid() and influencer_id is not null
    )
  );


-- ============================================================================
-- Conferência rápida (opcional):
--   select slug, tema, aparencia, metricas_instagram is not null as tem_ig
--     from somos_preta_midia_kits;
--   select username, seguidores, taxa_engajamento, coletado_em
--     from somos_preta_instagram_coletas order by coletado_em desc limit 20;
-- ============================================================================
-- FIM
-- ============================================================================
