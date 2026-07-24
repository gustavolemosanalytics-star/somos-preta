-- ============================================================================
-- Somos Preta — Tela de Usuários (admin) + trava de escalonamento de papel
--
-- Corrige um furo: a política antiga deixava o usuário editar o PRÓPRIO perfil
-- inteiro, inclusive o campo `role` (auto-promoção a admin). Agora:
--   • só ADMIN muda papéis (na tela de usuários);
--   • o usuário edita o próprio perfil, mas NÃO o papel (trava por trigger);
--   • contexto sem login (SQL editor / service_role) continua podendo promover.
--
-- Seguro rodar mesmo que 0001/0002 já tenham sido aplicados (idempotente).
-- ============================================================================

-- Helper: o usuário atual é admin?
create or replace function somos_preta_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from somos_preta_profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Refaz as políticas de PROFILES
drop policy if exists "staff_all_profiles" on somos_preta_profiles;
drop policy if exists "self_profile" on somos_preta_profiles;
drop policy if exists "profiles_read_staff" on somos_preta_profiles;
drop policy if exists "profiles_read_self" on somos_preta_profiles;
drop policy if exists "profiles_admin_all" on somos_preta_profiles;
drop policy if exists "profiles_self_update" on somos_preta_profiles;

-- Leitura: equipe vê todos; qualquer um vê o próprio
create policy "profiles_read_staff" on somos_preta_profiles
  for select to authenticated using (somos_preta_is_staff());
create policy "profiles_read_self" on somos_preta_profiles
  for select to authenticated using (id = auth.uid());

-- Admin gerencia todos os perfis (inclui trocar papel)
create policy "profiles_admin_all" on somos_preta_profiles
  for all to authenticated using (somos_preta_is_admin()) with check (somos_preta_is_admin());

-- Usuário edita o próprio perfil (o papel fica protegido pelo trigger abaixo)
create policy "profiles_self_update" on somos_preta_profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Trava: só admin pode mudar `role`. Permite quando não há usuário autenticado
-- (SQL editor / service_role) para não travar a promoção inicial.
create or replace function somos_preta_guard_role_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not exists (
      select 1 from somos_preta_profiles where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'Apenas administradores podem alterar o papel de um usuário';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists somos_preta_guard_role on somos_preta_profiles;
create trigger somos_preta_guard_role
  before update on somos_preta_profiles
  for each row execute function somos_preta_guard_role_change();
