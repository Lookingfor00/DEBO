-- DEBO Route Handlers use JOBBOARD_SECRET_KEY (server-only). v1 value is the
-- instance service_role JWT; PostgREST runs as role service_role, which needs
-- schema/table grants. RLS is still bypassed by service_role; Next filters
-- auth0_sub in code (S5). Do not put this key in NEXT_PUBLIC_*.
-- Apply on instance ai-scrapper after 001–004.

grant usage on schema jobboard to service_role;

grant select, insert, delete on table jobboard.favorites to service_role;
grant select, insert, update on table jobboard.wallets to service_role;
grant select on table jobboard.payment_methods to service_role;
grant select on table jobboard.payment_events to service_role;
