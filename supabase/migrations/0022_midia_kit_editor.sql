-- ============================================================================
-- Somos Preta — Media Kit: alinha os arquivos de migration ao banco
--
-- CONTEXTO IMPORTANTE, conferido contra o banco em 19/09/2026:
-- o banco de produção está À FRENTE destes arquivos. Alguém já corrigiu lá o
-- trigger, a view e o bucket, mas as correções nunca voltaram para cá. Quem
-- recriar o ambiente a partir da pasta migrations/ hoje reconstrói os bugs.
--
-- Esta migration existe para fechar essa distância. Em produção ela é quase
-- toda no-op (por isso é idempotente); num ambiente novo é o que impede o
-- problema de renascer.
--
-- O que estava desalinhado:
--
--   1. O trigger de 0005 lê o @ com `redes->>'instagram'`, mas o editor grava
--      redes ANINHADO: { "instagram": { "handle": "maria", "followers": 1000 } }.
--      O operador ->> serializa o objeto inteiro, então o que iria parar em
--      somos_preta_influencers.instagram e .username seria a string
--        {"handle": "maria", "followers": 1000}
--      Vale igual para tiktok e youtube.
--      >> Em produção já está corrigido: o kit qa-creator-temp tem redes
--         aninhado e o influencer ligado a ele tem instagram = "nasa", limpo.
--
--   2. A view de 0014 não expõe `updated_at` e expõe `influencer_id`, que é
--      chave interna da base de criadores e não serve à vitrine. Sem
--      updated_at, o sitemap não tem lastModified.
--      >> Em produção a view já tem updated_at e já não tem influencer_id.
--
--   4. O bucket midia-kit foi criado em 0013 só com `public` e
--      `file_size_limit`: o `accept` do <input> é dica de seletor, não
--      validação, e dava para subir qualquer arquivo num bucket público.
--      >> Em produção o bucket já restringe aos quatro tipos de imagem.
--
-- E o que NÃO deu para conferir daqui (o cliente REST não lê o catálogo do
-- Postgres), por isso vai aplicado defensivamente:
--
--   3. `somos_preta_midia_kits.publicado` tem default `true` em 0001. Um
--      media kit que nasce público é armadilha: o editor se protege passando
--      publicado: false no upsert — e é o único lugar do app que insere nessa
--      tabela — mas o default do banco não devia depender disso.
--      A coluna `nichos` é `text[] default '{}'` sem NOT NULL, enquanto o tipo
--      em src/lib/db/types.ts a declara não-nula e a UI confia nisso.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) Trigger de sincronia: lê o handle de dentro do objeto
-- ----------------------------------------------------------------------------
-- Tolera as duas formas: a aninhada ({"instagram":{"handle":"x"}}), que é a
-- que o editor grava, e a plana ({"instagram":"x"}), que pode existir em
-- linhas antigas. `#>>` desce no caminho; `->>` fica de reserva.
--
-- A guarda `like '{%'` descarta o que já estiver corrompido: sem ela, uma
-- linha com JSON serializado no lugar do @ seria propagada adiante.

create or replace function somos_preta_sync_influencer_from_kit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  redes  jsonb;
  ig     text;
  tk     text;
  yt     text;
  handle text;
  inf_id uuid;
begin
  redes := coalesce(new.redes, '{}'::jsonb);

  ig := nullif(coalesce(redes #>> '{instagram,handle}', redes ->> 'instagram'), '');
  tk := nullif(coalesce(redes #>> '{tiktok,handle}',    redes ->> 'tiktok'),    '');
  yt := nullif(coalesce(redes #>> '{youtube,handle}',   redes ->> 'youtube'),   '');

  if ig like '{%' then ig := null; end if;
  if tk like '{%' then tk := null; end if;
  if yt like '{%' then yt := null; end if;

  handle := nullif(regexp_replace(coalesce(ig, ''), '^@', ''), '');

  -- já vinculado? usa esse. senão, tenta achar pelo @ (ex.: veio do import interno)
  inf_id := new.influencer_id;
  if inf_id is null and handle is not null then
    select id into inf_id
    from somos_preta_influencers
    where username is not null and lower(username) = lower(handle)
    limit 1;
  end if;

  if inf_id is not null then
    update somos_preta_influencers set
      nome      = new.nome,
      instagram = ig,
      tiktok    = tk,
      youtube   = yt,
      avatar_url= new.avatar_url,
      bio       = new.bio,
      nicho     = coalesce(new.nichos, '{}'),
      estado    = new.estado,
      cidade    = new.cidade,
      fonte     = 'app',
      updated_at= now()
    where id = inf_id;
  else
    insert into somos_preta_influencers
      (nome, username, instagram, tiktok, youtube, avatar_url, bio, nicho, estado, cidade, fonte, status)
    values (
      new.nome, handle, ig, tk, yt,
      new.avatar_url, new.bio, coalesce(new.nichos, '{}'),
      new.estado, new.cidade, 'app', 'ativo'
    )
    returning id into inf_id;
  end if;

  new.influencer_id := inf_id;
  return new;
end;
$$;

drop trigger if exists somos_preta_kit_sync_influencer on somos_preta_midia_kits;
create trigger somos_preta_kit_sync_influencer
  before insert or update on somos_preta_midia_kits
  for each row execute function somos_preta_sync_influencer_from_kit();


-- ----------------------------------------------------------------------------
-- 1b) Limpa o que o trigger antigo tenha sujado
-- ----------------------------------------------------------------------------
-- Em produção isto não casa com nenhuma linha (conferido: nenhum influencer
-- tem '{' no @). Fica para ambientes que chegaram a rodar o trigger velho.
-- Só toca em valor que começa com '{' — comprovadamente um objeto serializado,
-- não um @ de verdade — reescrevendo a partir do kit que originou a linha.

update somos_preta_influencers i set
  instagram = nullif(k.redes #>> '{instagram,handle}', ''),
  tiktok    = nullif(k.redes #>> '{tiktok,handle}', ''),
  youtube   = nullif(k.redes #>> '{youtube,handle}', ''),
  username  = coalesce(
                nullif(regexp_replace(coalesce(k.redes #>> '{instagram,handle}', ''), '^@', ''), ''),
                i.username
              ),
  updated_at = now()
from somos_preta_midia_kits k
where k.influencer_id = i.id
  and (i.instagram like '{%' or i.tiktok like '{%' or i.youtube like '{%' or i.username like '{%');

update somos_preta_influencers set
  instagram  = case when instagram like '{%' then null else instagram end,
  tiktok     = case when tiktok    like '{%' then null else tiktok    end,
  youtube    = case when youtube   like '{%' then null else youtube   end,
  username   = case when username  like '{%' then null else username  end,
  updated_at = now()
where instagram like '{%' or tiktok like '{%' or youtube like '{%' or username like '{%';


-- ----------------------------------------------------------------------------
-- 2) View pública: com updated_at, sem influencer_id
-- ----------------------------------------------------------------------------
-- `create or replace view` só acrescenta coluna no fim — não remove nem
-- reordena. Por isso o drop antes.

drop view if exists somos_preta_midia_kits_publicos;

create view somos_preta_midia_kits_publicos as
  select id, slug, nome, whatsapp, bio, avatar_url, cover_url,
         cidade, estado, nichos, tema, redes, portfolio, pacotes,
         publicado, created_at, updated_at
  from somos_preta_midia_kits
  where publicado = true;

grant select on somos_preta_midia_kits_publicos to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3) Rascunho por default e nichos sem null
-- ----------------------------------------------------------------------------
-- O editor é o único lugar do app que insere nesta tabela e sempre passa
-- publicado: false, então mudar o default não altera nada no produto — só
-- tira a armadilha de quem inserir por SQL ou por um import futuro.

alter table somos_preta_midia_kits alter column publicado set default false;

update somos_preta_midia_kits set nichos = '{}' where nichos is null;
alter table somos_preta_midia_kits alter column nichos set default '{}';
alter table somos_preta_midia_kits alter column nichos set not null;


-- ----------------------------------------------------------------------------
-- 4) Bucket midia-kit: só imagem entra
-- ----------------------------------------------------------------------------
-- SVG fica FORA de propósito: é um documento XML que o navegador executa, e o
-- bucket é público — um SVG com <script> servido do nosso domínio é XSS.

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'midia-kit';


-- ----------------------------------------------------------------------------
-- 5) Criadores-fantasma deixados pelo editor antigo — LIMPEZA OPCIONAL
-- ----------------------------------------------------------------------------
-- O editor antigo rodava o upsert do kit em TODA montagem da tela. O upsert
-- vira `insert ... on conflict do nothing`, e no Postgres o gatilho BEFORE
-- INSERT dispara ANTES de o conflito ser resolvido: a linha do kit era
-- descartada, mas o efeito do gatilho ficava. Como a linha proposta não leva
-- influencer_id, cada F5 cadastrava um criador NOVO.
--
-- Conferido em 19/09/2026: 12 linhas com fonte='app' para 2 media kits, 11
-- delas sem username. O editor já foi corrigido (só escreve quando o kit não
-- existe), então a sujeira parou de crescer.
--
-- O SELECT abaixo mostra o que sobrou. O DELETE está COMENTADO de propósito:
-- apagar linha da base de criadores é decisão de quem cuida do produto, não
-- de uma migration. Rode o select, confira a lista e descomente se concordar.
--
--   select i.id, i.nome, i.username, i.created_at
--   from somos_preta_influencers i
--   where i.fonte = 'app'
--     and i.username is null
--     and i.instagram is null
--     and not exists (select 1 from somos_preta_midia_kits k where k.influencer_id = i.id)
--     and not exists (select 1 from somos_preta_campanha_influencers c where c.influencer_id = i.id)
--   order by i.created_at;
--
--   delete from somos_preta_influencers i
--   where i.fonte = 'app'
--     and i.username is null
--     and i.instagram is null
--     and not exists (select 1 from somos_preta_midia_kits k where k.influencer_id = i.id)
--     and not exists (select 1 from somos_preta_campanha_influencers c where c.influencer_id = i.id);


-- ============================================================================
-- Conferência rápida (opcional):
--   select slug, publicado, updated_at from somos_preta_midia_kits_publicos;
--   select nome, username, instagram from somos_preta_influencers where fonte = 'app';
-- ============================================================================
-- FIM
-- ============================================================================
