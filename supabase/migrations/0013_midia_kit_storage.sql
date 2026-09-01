-- ============================================================================
-- Somos Preta — Storage para o Media Kit (avatar/capa do creator)
-- Bucket público (as imagens aparecem na página pública /kit/[slug]).
-- Cada creator só escreve dentro da própria pasta ({user_id}/...).
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('midia-kit', 'midia-kit', true, 10485760) -- 10MB
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists "public_read_midia_kit_storage" on storage.objects;
create policy "public_read_midia_kit_storage" on storage.objects for select to anon, authenticated
  using (bucket_id = 'midia-kit');

drop policy if exists "creator_own_midia_kit_storage" on storage.objects;
create policy "creator_own_midia_kit_storage" on storage.objects for all to authenticated
  using (bucket_id = 'midia-kit' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'midia-kit' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "staff_all_midia_kit_storage" on storage.objects;
create policy "staff_all_midia_kit_storage" on storage.objects for all to authenticated
  using (bucket_id = 'midia-kit' and somos_preta_is_staff())
  with check (bucket_id = 'midia-kit' and somos_preta_is_staff());

-- ============================================================================
-- FIM
-- ============================================================================
