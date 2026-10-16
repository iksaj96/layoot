-- Allow the designated Layoot admin to read data displayed in /admin.
-- These policies do not grant write access to profiles or feedback reports.

drop policy if exists "Layoot admin can read all profiles" on public.profiles;
create policy "Layoot admin can read all profiles"
  on public.profiles
  for select
  to authenticated
  using ((select auth.jwt() ->> 'email') = 'aji@layoot.com');

drop policy if exists "Layoot admin can read all feedback reports"
  on public.feedback_reports;
create policy "Layoot admin can read all feedback reports"
  on public.feedback_reports
  for select
  to authenticated
  using ((select auth.jwt() ->> 'email') = 'aji@layoot.com');
