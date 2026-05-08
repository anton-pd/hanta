-- 0003_unextracted_sources.sql — single-query view of sources awaiting extraction.
-- Avoids the URL-length blowup of `IN (200 ids)` from PostgREST.

create or replace view unextracted_sources as
select s.id, s.url, s.title, s.body, s.published_at, s.source_type
from sources s
where not exists (
  select 1 from extractions e where e.source_id = s.id
);

grant select on unextracted_sources to service_role, anon, authenticated;
