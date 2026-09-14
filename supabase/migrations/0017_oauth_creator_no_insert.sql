-- ============================================================================
-- Correção: papel do criador vindo do login social
-- ============================================================================
-- A 0016 tentava promover o papel por UPDATE depois do callback. Não funciona:
-- somos_preta_guard_role (0003) é BEFORE UPDATE em somos_preta_profiles e
-- levanta exceção sempre que `role` muda e auth.uid() não é admin. SECURITY
-- DEFINER troca o dono da execução, mas NÃO troca auth.uid() — ela continua
-- lendo o JWT de quem chamou. Ou seja: a RPC falhava exatamente no caso para o
-- qual foi escrita, e o usuário terminava em /app/sem-acesso.
--
-- Além disso, promover a partir de 'pendente' era amplo demais: esse papel
-- também marca quem aguarda aprovação e quem um admin REBAIXOU para revogar
-- acesso. Qualquer um dos dois poderia se repromover sozinho chamando a RPC.
--
-- A decisão passa para o INSERT, dentro de somos_preta_handle_new_user, que
-- roda em auth.users e por isso não encosta no guard. Por rodar só na criação
-- do usuário, este caminho não consegue repromover ninguém que já exista.
-- ============================================================================

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
    case
      -- Cadastro por e-mail na área do criador: o formulário envia role_hint.
      when new.raw_user_meta_data->>'role_hint' = 'creator' then 'creator'::somos_preta_role
      -- Login social: o OAuth não tem como carregar role_hint, e o Google só é
      -- oferecido nas telas do criador. Se um dia o painel interno ganhar login
      -- social, esta condição precisa distinguir a origem.
      when new.raw_app_meta_data->>'provider' = 'google' then 'creator'::somos_preta_role
      else 'pendente'::somos_preta_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

reset check_function_bodies;

-- A RPC da 0016 sai: não funcionava e o grant a `authenticated` era uma porta
-- aberta para auto-promoção caso o guard fosse afrouxado no futuro.
drop function if exists somos_preta_assumir_papel_creator();
