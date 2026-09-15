-- ALTER YOU · let the website read what it is supposed to
--
-- WHY YOUR PHOTOS ARE NOT SHOWING
-- The admin reads the database as you, signed in. The website reads it as a
-- stranger, because visitors are not logged in. If row level security is on
-- and there is no policy letting a stranger read, the website gets back an
-- empty list and quietly leaves the shipped photos in place. No error, no
-- broken image, just nothing changing. That is almost always what is going on
-- when an upload shows in the admin but not on the site.
--
-- This adds read access for the handful of things the website shows in public,
-- and nothing else. Leads stay private. Members stay private.
--
-- Safe to run more than once.

-- ── Photos, and the before and after carousel ────────────────────────────
alter table public.site_images     enable row level security;
alter table public.transformations enable row level security;

drop policy if exists "anyone can read site images" on public.site_images;
create policy "anyone can read site images"
  on public.site_images for select to anon, authenticated using (true);

-- only the published ones, so a draft never appears early
drop policy if exists "anyone can read published transformations" on public.transformations;
create policy "anyone can read published transformations"
  on public.transformations for select to anon, authenticated using (published is true);

-- ── Blog and challenges, also shown on the website ───────────────────────
alter table public.posts      enable row level security;
alter table public.challenges enable row level security;

drop policy if exists "anyone can read published posts" on public.posts;
create policy "anyone can read published posts"
  on public.posts for select to anon, authenticated using (published is true);

drop policy if exists "anyone can read challenges" on public.challenges;
create policy "anyone can read challenges"
  on public.challenges for select to anon, authenticated using (true);

-- ── Forms need to write, but nobody may read the list ────────────────────
alter table public.leads enable row level security;

drop policy if exists "anyone can join the list" on public.leads;
create policy "anyone can join the list"
  on public.leads for insert to anon, authenticated with check (true);

-- deliberately no select policy for anon here. A visitor can add themselves
-- and cannot read anyone else. The admin reads it as a signed in admin below.
drop policy if exists "admins can read leads" on public.leads;
create policy "admins can read leads"
  on public.leads for all to authenticated
  using (exists (select 1 from public.profiles_alter p
                  where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles_alter p
                       where p.id = auth.uid() and p.is_admin));

-- ── Admins may change the things the admin edits ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['site_images','transformations','posts','challenges'] loop
    execute format('drop policy if exists "admins can change %1$s" on public.%1$I', t);
    execute format($f$
      create policy "admins can change %1$s" on public.%1$I
        for all to authenticated
        using (exists (select 1 from public.profiles_alter p
                        where p.id = auth.uid() and p.is_admin))
        with check (exists (select 1 from public.profiles_alter p
                             where p.id = auth.uid() and p.is_admin))
    $f$, t);
  end loop;
end $$;

-- ── Did it work ──────────────────────────────────────────────────────────
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('site_images','transformations','posts','challenges','leads')
order by tablename, policyname;
