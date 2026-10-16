-- The designs table is managed outside this repository; derive its id type
-- so the feedback foreign key always matches the deployed schema.
do $$
declare
  design_id_type text;
begin
  select format_type(column_info.atttypid, column_info.atttypmod)
    into design_id_type
  from pg_attribute as column_info
  where column_info.attrelid = 'public.designs'::regclass
    and column_info.attname = 'id'
    and not column_info.attisdropped;

  if design_id_type is null then
    raise exception 'Kolom public.designs.id tidak ditemukan.';
  end if;

  execute format(
    'create table if not exists public.feedback_reports (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      design_id %s not null references public.designs (id) on delete cascade,
      jenis text not null check (jenis in (''masalah'', ''saran'')),
      pesan text not null check (
        char_length(btrim(pesan)) between 1 and 2000
      ),
      halaman text not null check (halaman like ''/%%''),
      user_agent text not null,
      created_at timestamptz not null default now()
    )',
    design_id_type
  );
end;
$$;

create index if not exists feedback_reports_user_created_at_idx
  on public.feedback_reports (user_id, created_at desc);

alter table public.feedback_reports enable row level security;

drop policy if exists "Users can read their own feedback reports"
  on public.feedback_reports;
create policy "Users can read their own feedback reports"
  on public.feedback_reports
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Users can add their own feedback reports"
  on public.feedback_reports;
create policy "Users can add their own feedback reports"
  on public.feedback_reports
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.designs as design
      where design.id = feedback_reports.design_id
        and design.user_id = (select auth.uid())
    )
  );

grant select, insert on public.feedback_reports to authenticated;
