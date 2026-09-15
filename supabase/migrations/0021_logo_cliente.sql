-- ============================================================================
-- Somos Preta — Logo do cliente
--
-- A coluna somos_preta_clientes.logo_url existe desde 0001 e a tela já a
-- desenha na tabela, no painel de detalhe e como reserva da capa da campanha —
-- mas não havia por onde preencher: nem campo no formulário, nem lugar para
-- guardar o arquivo.
--
-- O bucket é PÚBLICO de propósito. Logo de marca aparece dentro de <img>, e
-- <img> não carrega sessão: num bucket privado a imagem só apareceria por URL
-- assinada, que expira — o logo sumiria da tela sozinho depois de um tempo.
-- O bucket 'clientes' (0020), esse sim privado, continua sendo o lugar de
-- contrato e documento, que não podem ser públicos.
--
-- Como aplicar: Supabase Dashboard > SQL Editor > cole este arquivo > Run.
-- É idempotente (pode rodar mais de uma vez sem quebrar).
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clientes-logos',
  'clientes-logos',
  true,
  2097152, -- 2MB: é logo, não peça de campanha
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Leitura livre: é o que faz a <img> funcionar sem sessão.
drop policy if exists "clientes_logos_public_read" on storage.objects;
create policy "clientes_logos_public_read" on storage.objects
  for select using (bucket_id = 'clientes-logos');

-- Escrita só para a equipe.
drop policy if exists "clientes_logos_staff_write" on storage.objects;
create policy "clientes_logos_staff_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'clientes-logos' and somos_preta_is_staff())
  with check (bucket_id = 'clientes-logos' and somos_preta_is_staff());

-- ============================================================================
-- FIM
-- ============================================================================
