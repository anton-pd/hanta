-- 0002_refresh_view.sql — RPC for refreshing the daily totals view from PostgREST.
-- Run in Supabase SQL editor on top of 0001_init.sql.

create or replace function refresh_daily_country_totals()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view daily_country_totals;
end;
$$;

revoke all on function refresh_daily_country_totals() from public;
grant execute on function refresh_daily_country_totals() to service_role;
