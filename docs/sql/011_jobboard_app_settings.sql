-- LB-010: jobboard.app_settings (S4, S5) — feature flags without visitor auth0_sub.
-- Apply on instance ai-scrapper after 001–010. Flip whatsapp_copy_enabled without redeploying copy.

create table if not exists jobboard.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table jobboard.app_settings enable row level security;
alter table jobboard.app_settings force row level security;

revoke all on table jobboard.app_settings from public, anon, authenticated;

grant select, insert, update on table jobboard.app_settings to jobboard_app;
grant select, insert, update, delete on table jobboard.app_settings to service_role;

drop policy if exists app_settings_jobboard_app on jobboard.app_settings;
create policy app_settings_jobboard_app
  on jobboard.app_settings
  for select
  to jobboard_app
  using (true);

drop policy if exists app_settings_jobboard_app_write on jobboard.app_settings;
create policy app_settings_jobboard_app_write
  on jobboard.app_settings
  for all
  to jobboard_app
  using (true)
  with check (true);

drop policy if exists app_settings_service_role on jobboard.app_settings;
create policy app_settings_service_role
  on jobboard.app_settings
  for all
  to service_role
  using (true)
  with check (true);

insert into jobboard.app_settings (key, value)
values ('whatsapp_copy_enabled', 'false'::jsonb)
on conflict (key) do nothing;
