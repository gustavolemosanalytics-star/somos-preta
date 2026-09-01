-- ============================================================================
-- Somos Preta — Recria a view pública de Media Kits
-- Achado em teste: a view somos_preta_midia_kits_publicos (definida em
-- 0001_somos_preta_init.sql) não existe de fato neste banco — o PostgREST
-- não a encontra (PGRST205). A página pública /kit/[slug] depende dela.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

create or replace view somos_preta_midia_kits_publicos as
  select id, slug, nome, whatsapp, bio, avatar_url, cover_url,
         cidade, estado, nichos, tema, redes, portfolio, pacotes,
         publicado, influencer_id, created_at
  from somos_preta_midia_kits
  where publicado = true;

grant select on somos_preta_midia_kits_publicos to anon, authenticated;

-- ============================================================================
-- FIM
-- ============================================================================
