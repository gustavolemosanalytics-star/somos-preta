-- ============================================================================
-- Somos Preta — Fonte do criador (app x interna) + sync mídia kit -> criadores
--
--   • fonte = 'interna'  -> import da planilha / cadastro manual pela equipe (default)
--   • fonte = 'app'      -> o creator se cadastrou e criou o mídia kit no app
--
-- Quando um creator cria/edita o mídia kit, um gatilho reflete os dados na tabela
-- de criadores (somos_preta_influencers) com fonte 'app', dedup por @ do Instagram.
--
-- Seguro rodar mais de uma vez. Supabase Dashboard > SQL Editor > cole > Run.
-- ============================================================================

do $$ begin
  create type somos_preta_fonte as enum ('app', 'interna');
exception when duplicate_object then null; end $$;

alter table somos_preta_influencers
  add column if not exists fonte somos_preta_fonte not null default 'interna';

-- Reflete o mídia kit do creator na base de criadores (fonte 'app')
create or replace function somos_preta_sync_influencer_from_kit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  inf_id  uuid;
  redes   jsonb;
  ig      text;
  handle  text;
begin
  redes  := coalesce(new.redes, '{}'::jsonb);
  ig     := nullif(redes->>'instagram', '');
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
      tiktok    = nullif(redes->>'tiktok', ''),
      youtube   = nullif(redes->>'youtube', ''),
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
      new.nome, handle, ig,
      nullif(redes->>'tiktok', ''), nullif(redes->>'youtube', ''),
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
