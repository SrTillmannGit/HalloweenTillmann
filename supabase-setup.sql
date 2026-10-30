-- Rode isto no Supabase: SQL Editor > New query > Run.
-- Cria a tabela dos relatos e o bucket público das fotos, liberando
-- envio e leitura para qualquer pessoa que escanear o QR code.

create table if not exists public.avistamentos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  apelido text check (char_length(apelido) <= 40),
  local text check (char_length(local) <= 60),
  relato text check (char_length(relato) <= 280),
  foto_url text not null
);

alter table public.avistamentos enable row level security;

create policy "qualquer um le" on public.avistamentos
  for select to anon using (true);
create policy "qualquer um envia" on public.avistamentos
  for insert to anon with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avistamentos', 'avistamentos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "qualquer um sobe foto" on storage.objects
  for insert to anon with check (bucket_id = 'avistamentos');
create policy "qualquer um ve foto" on storage.objects
  for select to anon using (bucket_id = 'avistamentos');
