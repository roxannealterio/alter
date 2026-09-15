-- Paste the results of this back and I can tell you exactly what is wrong.

-- 1. Are there any photo slots at all, and do any have a photo in them?
select count(*) as slots, count(url) as with_a_photo from public.site_images;

-- 2. The ones I hardcoded. Are they even registered?
select key, case when url is null then 'no photo uploaded' else 'has a photo' end
from public.site_images
where key in ('hero_1','hero_2','program_1','recipe_1','app_today','ch_shred')
order by key;

-- 3. Is row level security on, and is there a policy letting a visitor read?
select c.relname as table,
       c.relrowsecurity as rls_on,
       coalesce(string_agg(p.policyname, ', '), 'NO POLICIES') as policies
from pg_class c
left join pg_policies p on p.tablename = c.relname and p.schemaname = 'public'
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('site_images','transformations','leads','posts','challenges')
group by c.relname, c.relrowsecurity
order by c.relname;

-- 4. Is the storage bucket public? An upload works but the link is dead if not.
select id, public from storage.buckets where id = 'site-images';
