-- ============================================================================
-- Somos Preta — Papel 'pendente' (sem acesso) + cadastro por fluxo
--
--   • Quem cria conta pelo /app (interno) entra como 'pendente' -> SEM acesso a
--     nada, até um admin liberar e definir o papel na tela de Usuários.
--   • Quem cria conta pelo /criador (fluxo do creator) entra como 'creator'.
--
-- O fluxo é identificado pelo metadata 'role_hint' enviado no cadastro
-- (role_hint='creator' -> creator; caso contrário -> pendente).
--
-- Seguro rodar mais de uma vez. Supabase Dashboard > SQL Editor > cole > Run.
-- Obs.: se o editor reclamar de "unsafe use of new value", rode a 1ª linha
--       (alter type ... add value) sozinha primeiro e depois o resto.
-- ============================================================================

alter type somos_preta_role add value if not exists 'pendente';

-- evita a validação do corpo referenciar o novo valor no mesmo run
set check_function_bodies = off;

create or replace function somos_preta_handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into somos_preta_profiles (id, nome, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    case when new.raw_user_meta_data->>'role_hint' = 'creator'
         then 'creator'::somos_preta_role
         else 'pendente'::somos_preta_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

reset check_function_bodies;
