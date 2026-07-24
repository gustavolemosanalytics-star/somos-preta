-- ============================================================================
-- Somos Preta — Correção de segurança do RLS
-- Fecha leituras públicas amplas que a chave publishable poderia explorar:
--   • campanhas (orçamentos) e campanha_influencers (pagamentos)
--   • influencers (email/telefone / PII)
--
-- Seguro rodar mesmo que 0001 já tenha sido aplicado (idempotente).
-- Supabase Dashboard > SQL Editor > cole > Run.
-- ============================================================================

-- 1) INFLUENCERS: remove leitura pública (mantém só acesso da equipe)
drop policy if exists "public_read_influencers" on somos_preta_influencers;

-- 2) CAMPANHAS / VÍNCULOS: remove leitura pública direta das tabelas
drop policy if exists "portal_read_campanhas" on somos_preta_campanhas;
drop policy if exists "portal_read_camp_inf" on somos_preta_campanha_influencers;

-- 3) Portal do cliente por token: função controlada que devolve APENAS
--    a campanha correspondente ao share_token (nunca a tabela inteira).
create or replace function somos_preta_portal_campanha(p_token text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'campanha', to_jsonb(c),
    'influencers', coalesce((
      select jsonb_agg(jsonb_build_object('vinculo', to_jsonb(ci), 'influencer', to_jsonb(i)))
      from somos_preta_campanha_influencers ci
      join somos_preta_influencers i on i.id = ci.influencer_id
      where ci.campanha_id = c.id
    ), '[]'::jsonb)
  )
  from somos_preta_campanhas c
  where c.share_token = p_token;
$$;
grant execute on function somos_preta_portal_campanha(text) to anon, authenticated;

-- ============================================================================
-- Conferência rápida (opcional): liste as policies ativas depois de rodar
--   select tablename, policyname, roles, cmd
--   from pg_policies where schemaname = 'public' and tablename like 'somos_preta_%'
--   order by tablename, policyname;
-- ============================================================================
