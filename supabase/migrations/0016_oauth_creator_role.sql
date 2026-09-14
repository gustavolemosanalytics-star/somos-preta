-- ============================================================================
-- Login social do criador: atribuição de papel
-- ============================================================================
-- O papel vem de raw_user_meta_data->>'role_hint', que o cadastro por e-mail
-- envia em signUp(). O fluxo OAuth não tem esse canal: o Google devolve só
-- nome, e-mail e avatar, então quem entrava pelo Google virava 'pendente' e
-- caía em /app/sem-acesso, sem conseguir chegar na própria área.
--
-- Esta função deixa o usuário recém-criado assumir o papel de creator após o
-- callback. É deliberadamente estreita:
--   - age apenas sobre auth.uid(), nunca sobre outro usuário;
--   - só promove a partir de 'pendente', então não rebaixa nem escala um
--     admin/gestor/analista que por acaso entre pela mesma tela;
--   - é idempotente: chamar de novo em quem já é creator não faz nada.
-- ============================================================================

create or replace function somos_preta_assumir_papel_creator()
returns somos_preta_role
language plpgsql
security definer
set search_path = public
as $$
declare
  papel somos_preta_role;
begin
  if auth.uid() is null then
    raise exception 'sem sessão';
  end if;

  update somos_preta_profiles
     set role = 'creator'::somos_preta_role,
         updated_at = now()
   where id = auth.uid()
     and role = 'pendente'::somos_preta_role;

  select role into papel from somos_preta_profiles where id = auth.uid();
  return papel;
end;
$$;

revoke all on function somos_preta_assumir_papel_creator() from public;
grant execute on function somos_preta_assumir_papel_creator() to authenticated;
