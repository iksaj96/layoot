create policy "Layoot admin can update feedback reports"
  on public.feedback_reports
  for update
  to authenticated
  using ((select auth.jwt() ->> 'email') = 'aji@layoot.com')
  with check ((select auth.jwt() ->> 'email') = 'aji@layoot.com');

create policy "Layoot admin can delete feedback reports"
  on public.feedback_reports
  for delete
  to authenticated
  using ((select auth.jwt() ->> 'email') = 'aji@layoot.com');

grant update (pesan), delete on public.feedback_reports to authenticated;
