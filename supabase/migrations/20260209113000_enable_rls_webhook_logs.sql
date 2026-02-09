alter table webhook_logs enable row level security;

create policy "Service role can manage webhook logs"
  on webhook_logs
  for all
  to service_role
  using (true)
  with check (true);