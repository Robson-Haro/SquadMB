create table if not exists public.vacancies (id bigint primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.squad_entries (id uuid primary key, owner text not null, squad int not null check (squad between 1 and 3), job_code text default '', job_title text default '', created_at timestamptz not null default now());
create table if not exists public.candidates (id uuid primary key, entry_id uuid not null references public.squad_entries(id) on delete cascade, name text default '', status text not null default 'Entrevista Gestor', position int not null default 0, updated_at timestamptz not null default now());
alter table public.vacancies enable row level security; alter table public.squad_entries enable row level security; alter table public.candidates enable row level security;
create policy "shared vacancies" on public.vacancies for all using (true) with check (true);
create policy "shared entries" on public.squad_entries for all using (true) with check (true);
create policy "shared candidates" on public.candidates for all using (true) with check (true);
alter publication supabase_realtime add table public.vacancies, public.squad_entries, public.candidates;
