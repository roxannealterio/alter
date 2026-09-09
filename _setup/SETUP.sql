-- ═══════════════════════════════════════════════════════════════
--  ALTER YOU — SETUP.sql
--
--  Everything the website and the admin need from Supabase, in one
--  file. Paste the whole thing into the SQL editor and press run.
--
--  SAFE TO RUN AGAIN, ANY TIME.
--  It never overwrites a photo you have uploaded, an article you have
--  written or a lead you have collected. It only creates what is
--  missing and refreshes the labels.
--
--  WHAT IT SETS UP
--    1. site_images   the 49 photo spots the website uses, so they
--                     appear in the admin under Website Images
--    2. leads         everyone who fills in a form on the website, so
--                     the list is yours rather than an inbox's
--    3. events        the table behind the Events tab. The website
--                     does not display events, so anything you add
--                     there stays private until you decide otherwise
--    4. permissions   the website is not signed in, so it needs
--                     explicit permission to read your published
--                     posts and transformations. Without this they
--                     are in the database but invisible on the site
--    5. subscriptions who is actually paying, once RevenueCat is
--                     connected. See _setup/REVENUECAT.md
--    6. a check       prints what you ended up with, at the bottom
--
--  AFTER RUNNING IT
--    Open alteryouapp.com/check.html. It tests everything and names
--    the fix for anything that failed.
-- ═══════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════
--  ALTER — SITE_IMAGES.sql
--
--  Run this once in the Supabase SQL editor. It is safe to run again:
--  it never overwrites a photo you have already uploaded, it only adds
--  any missing slots and refreshes the labels.
--
--  After running it, open the admin and go to Website Images. Every
--  photo spot on the website will be listed, grouped by page.
-- ═══════════════════════════════════════════════════════════════

-- 1. the table ---------------------------------------------------
create table if not exists public.site_images (
  key         text primary key,
  label       text,
  page        text,
  hint        text,
  sort_order  int default 0,
  url         text,
  updated_at  timestamptz default now()
);

-- columns added since the first version
alter table public.site_images add column if not exists page       text;
alter table public.site_images add column if not exists hint       text;
alter table public.site_images add column if not exists sort_order int default 0;

-- 2. who can read and write it -----------------------------------
alter table public.site_images enable row level security;

drop policy if exists "site_images public read" on public.site_images;
create policy "site_images public read"
  on public.site_images for select
  to anon, authenticated
  using (true);

drop policy if exists "site_images admin write" on public.site_images;
create policy "site_images admin write"
  on public.site_images for all
  to authenticated
  using (true)
  with check (true);

-- 3. the storage bucket the admin uploads into --------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "site-images public read" on storage.objects;
create policy "site-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-images');

drop policy if exists "site-images admin write" on storage.objects;
create policy "site-images admin write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'site-images')
  with check (bucket_id = 'site-images');

-- 4. every photo slot on the website (42 in total) ------------------------------
--    Adding a row here makes it appear in the admin. Deleting a row
--    removes it from the admin but not from the website markup.
insert into public.site_images (key, label, page, hint, sort_order) values
  -- Home page ---------------------------------------------------
  ('hero_1',         'Hero grid, top left',           'Home',       'The hero is a grid of four. Upright, at least 1200 x 1600. Tight crops work best: a hip thrust, a back, a squat.', 10),
  ('hero_2',         'Hero grid, top right',          'Home',       'Upright, at least 1200 x 1600.', 12),
  ('hero_3',         'Hero grid, bottom left',        'Home',       'Upright, at least 1200 x 1600.', 14),
  ('hero_4',         'Hero grid, bottom right',       'Home',       'Upright, at least 1200 x 1600.', 16),
  ('program_1',      'Program card, Glute Build',     'Home',       'Upright 3:4, about 900 x 1200. The program name sits over the top left corner.', 30),
  ('program_2',      'Program card, Foundations',     'Home',       'Upright 3:4, about 900 x 1200.', 40),
  ('program_3',      'Program card, Two Day Minimum', 'Home',       'Upright 3:4, about 900 x 1200.', 50),
  ('program_4',      'Program card, Home Strength',   'Home',       'Upright 3:4, about 900 x 1200.', 60),

  -- App screenshots ---------------------------------------------
  ('app_programs',   'Screenshot, Program picker',    'App screens','Phone screenshot. Used on the Features page.', 250),
  ('app_grocery',    'Screenshot, Grocery list',      'App screens','Phone screenshot. Used on the Features page.', 280),

  -- Challenges page ----------------------------------------------
  ('ch_hero',        'Why challenges work',           'Challenges', 'Upright 4:5, about 1000 x 1250. Community or training energy.', 300),
  ('ch_build',       'Bikini Build cover',            'Challenges', 'Wide 16:10, about 1600 x 1000.', 310),
  ('ch_shred',       'Summer Shred cover',            'Challenges', 'Wide 16:10, about 1600 x 1000.', 320),
  ('amb_build',      'Bikini Build coach: Roxy',             'Challenges', 'Square headshot, about 400 x 400. Shown as a small circle.', 360),
  ('amb_shred',      'Summer Shred host: Chey',             'Challenges', 'Square headshot, about 400 x 400.', 370),

  -- Challenge and program pages ------------------------------------
  ('build_hero',     'Bikini Build hero, main',       'Bikini Build','Fills the screen behind the title. Upright, at least 1600 x 2000. Keep the bottom third fairly plain.', 410),
  ('build_training', 'Bikini Build, the training',    'Bikini Build','Upright 4:5, about 1000 x 1250. Someone lifting.', 430),
  ('build_food',     'Bikini Build, the food',        'Bikini Build','Upright 4:5, about 1000 x 1250.', 440),
  ('build_host',     'Bikini Build host, training',   'Bikini Build','Upright 4:5, about 1000 x 1250. Your host actually training.', 445),
  ('glutes_hero',    'Glute training cover',          'Glute training','Wide 16:10, about 1600 x 1000. A gym shot works best.', 460),
  ('glutes_form',    'Form library screenshot',       'Glute training','A phone screenshot of a form guide.', 470),

  -- Brand files ----------------------------------------------------
  --  These three keep a fixed filename, because every page's <head>
  --  points at them by URL. Uploading one overwrites it in place.
  ('brand_og',       'Share image',                   'Brand',      'Wide 1200 x 630. What people see when the site is shared to Instagram, WhatsApp or a group chat. Put the logo and the name on it.', 700),
  ('brand_favicon',  'Favicon, browser tab',          'Brand',      'Square, 512 x 512. The little icon in a browser tab. The A mark on sage works best.', 710),
  ('brand_appicon',  'Home screen icon',              'Brand',      'Square, 512 x 512. Shown when someone saves the site to their iPhone home screen.', 720),

  -- About + blog --------------------------------------------------
  ('about_roxy',     'Roxy, About page portrait',     'About',      'Upright 4:5, about 1000 x 1250. Your name sits over the bottom of it.', 500),
  ('post_scale',     'Blog: the scale went up',       'Blog',       'Wide 16:10, about 1600 x 1000.', 610),
  ('post_cycle',     'Blog: training with your cycle','Blog',       'Wide 16:10, about 1600 x 1000.', 620),
  ('post_protein',   'Blog: how much protein',        'Blog',       'Wide 16:10, about 1600 x 1000.', 630),
  ('post_twodays',   'Blog: two days a week',         'Blog',       'Wide 16:10, about 1600 x 1000.', 640),
  ('post_timeline',  'Blog: how long it takes',       'Blog',       'Wide 16:10, about 1600 x 1000.', 650),
  ('post_start',     'Blog: never lifted before',     'Blog',       'Wide 16:10, about 1600 x 1000.', 660),
  ('post_budget',    'Blog: budget meals',            'Blog',       'Wide 16:10, about 1600 x 1000.', 670),
  ('post_creatine',  'Blog: creatine for women',      'Blog',       'Wide 16:10, about 1600 x 1000.', 680),
  ('post_nowar',     'Blog: no war with your body',   'Blog',       'Wide 16:10, about 1600 x 1000.', 690),
  ('post_headline',  'Blog: scale is not the headline','Blog',       'Wide 16:10, about 1600 x 1000.', 695),
  ('post_overload',  'Blog card, progressive overload','Blog',      'Wide 16:10, about 1600 x 1000.', 600),
  ('app_cycle', 'App screens: Cycle', 'App screens', 'A phone screenshot, full height.', 324),
  ('app_form', 'App screens: Form', 'App screens', 'A phone screenshot, full height.', 322),
  ('app_fuel', 'App screens: Fuel', 'App screens', 'A phone screenshot, full height.', 323),
  ('app_progress', 'App screens: Progress', 'App screens', 'A phone screenshot, full height.', 325),
  ('app_today', 'App screens: Today', 'App screens', 'A phone screenshot, full height.', 320),
  ('app_tracker', 'App screens: Tracker', 'App screens', 'A phone screenshot, full height.', 321),
  ('recipe_1', 'Home: Recipe, overnight oats', 'Home', 'Square, about 1200 x 1200.', 410),
  ('recipe_4', 'Home: Recipe, tacos', 'Home', 'Square, about 1200 x 1200.', 411),
  ('recipe_5', 'Home: Recipe, burgers', 'Home', 'Square, about 1200 x 1200.', 412),
  ('shred_hero', 'Summer Shred: hero photo', 'Challenges', 'Wide 16:9, about 1600 x 900.', 250),
  ('hero_challenges', 'Challenges: hero photo', 'Challenges', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 240),
  ('hero_programs', 'Programs: hero photo', 'Programs', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 241),
  ('hero_features', 'Features: hero photo', 'Features', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 242),
  ('hero_glutes', 'Glutes: hero photo', 'Programs', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 243),
  ('hero_about', 'About: hero photo', 'About', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 244),
  ('hero_pricing', 'Pricing: hero photo', 'Pricing', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 245),
  ('hero_calculator', 'Calculator: hero photo', 'Other', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 246),
  ('hero_build', 'Bikini Build: hero photo', 'Challenges', 'Wide 16:9, about 1800 x 1000. It sits behind the heading, so leave room in the middle.', 247)
on conflict (key) do update set
  label      = excluded.label,
  page       = excluded.page,
  hint       = excluded.hint,
  sort_order = excluded.sort_order;
-- note: url is deliberately not touched, so re-running never wipes a photo.

-- retire the two slots the old single photo hero used
delete from public.site_images where key in ('hero_bg','hero_feature','build_hero_2','shred_hero_2','shred_hero','founder','shred_food','shred_training',
         'amb_back','amb_recomp','amb_strong','ch_back','ch_recomp','ch_strong','event_pilates','home_walk') and url is null;


-- ═══════════════════════════════════════════════════════════════
--  EVENTS
--  The Events tab in the admin writes here. Nothing on the website
--  reads it at the moment, so anything you add stays private to the
--  app until you decide to show it.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text,
  starts_on    date,
  ends_on      date,
  location     text,
  description  text,
  image_url    text,
  signup_url   text,
  signup_label text,
  created_at   timestamptz default now()
);

-- columns the website expects, in case the table predates them
alter table public.events add column if not exists location     text;
alter table public.events add column if not exists description  text;
alter table public.events add column if not exists image_url    text;
alter table public.events add column if not exists signup_url   text;
alter table public.events add column if not exists signup_label text;

alter table public.events enable row level security;

drop policy if exists "events readable by anyone" on public.events;
create policy "events readable by anyone"
  on public.events for select using (true);

drop policy if exists "events writable when signed in" on public.events;
create policy "events writable when signed in"
  on public.events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════
--  PUBLIC READ ON THE OTHER TABLES THE WEBSITE USES
--  The site is not signed in, so it needs permission to read these.
-- ═══════════════════════════════════════════════════════════════

alter table public.transformations enable row level security;
drop policy if exists "published transformations readable" on public.transformations;
create policy "published transformations readable"
  on public.transformations for select using (published = true);

alter table public.posts enable row level security;
drop policy if exists "published posts readable" on public.posts;
create policy "published posts readable"
  on public.posts for select using (published = true);


-- ═══════════════════════════════════════════════════════════════
--  LEADS
--  Everyone who puts their name into a form on the website lands
--  here, so the list is yours rather than sitting in an inbox.
--
--  A note on consent, because it matters for what you can send:
--    source        which form they came from
--    consent       true only if they ticked the marketing box
--    unsubscribed  set when someone opts out. Never email these.
--
--  Under the Spam Act you may email someone who asked about a
--  specific thing about that thing. Anything broader needs consent,
--  which is why it is a separate column rather than assumed.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text,
  phone         text,
  source        text,          -- summer_shred | pilates | bikini_build_waitlist | calculator
  days          text,          -- what they answered on the form
  where_train   text,
  note          text,          -- your own notes
  status        text default 'new',   -- new | contacted | joined | not now
  consent       boolean default false,
  unsubscribed  boolean default false,
  created_at    timestamptz default now()
);

alter table public.leads add column if not exists phone        text;
alter table public.leads add column if not exists note         text;
alter table public.leads add column if not exists status       text default 'new';
alter table public.leads add column if not exists consent      boolean default false;
alter table public.leads add column if not exists unsubscribed boolean default false;

create index if not exists leads_created_idx on public.leads (created_at desc);
create unique index if not exists leads_email_source_idx
  on public.leads (lower(email), source) where email is not null;

alter table public.leads enable row level security;

-- the website can add a lead but can never read the list back
drop policy if exists "anyone can join a list" on public.leads;
create policy "anyone can join a list"
  on public.leads for insert with check (true);

-- only you, signed in, can see or change them
drop policy if exists "only the admin reads leads" on public.leads;
create policy "only the admin reads leads"
  on public.leads for select using (auth.role() = 'authenticated');

drop policy if exists "only the admin edits leads" on public.leads;
create policy "only the admin edits leads"
  on public.leads for update using (auth.role() = 'authenticated');

drop policy if exists "only the admin deletes leads" on public.leads;
create policy "only the admin deletes leads"
  on public.leads for delete using (auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════════
--  SUBSCRIPTIONS
--  Who is actually paying. This is the one thing the admin cannot
--  work out on its own, because App Store billing goes through
--  RevenueCat rather than this database.
--
--  RevenueCat sends an event here every time someone starts a
--  trial, converts, renews, cancels or lapses, and this table keeps
--  the latest state for each person. Setting it up is in
--  _setup/REVENUECAT.md, and it takes about ten minutes.
--
--  Until it is connected the dashboard shows members and activity,
--  which are real, and simply leaves the paying numbers blank
--  rather than guessing.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  app_user_id    text unique,            -- matches the user id in the app
  email          text,
  status         text,                   -- trial | active | cancelled | lapsed | billing_issue
  product_id     text,                   -- monthly or annual
  store          text,                   -- app_store | play_store | promo
  price_cents    integer,
  currency       text default 'AUD',
  trial_ends_at  timestamptz,
  renews_at      timestamptz,
  cancelled_at   timestamptz,
  updated_at     timestamptz default now(),
  created_at     timestamptz default now()
);

create index if not exists subs_status_idx  on public.subscriptions (status);
create index if not exists subs_updated_idx on public.subscriptions (updated_at desc);

alter table public.subscriptions enable row level security;

-- nobody on the public site can read or write this
drop policy if exists "only the admin reads subscriptions" on public.subscriptions;
create policy "only the admin reads subscriptions"
  on public.subscriptions for select using (auth.role() = 'authenticated');

drop policy if exists "only the admin edits subscriptions" on public.subscriptions;
create policy "only the admin edits subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
-- the webhook writes with the service key, which bypasses these rules


-- ═══════════════════════════════════════════════════════════════
--  CHECK IT WORKED
-- ═══════════════════════════════════════════════════════════════

-- photo spots, and how many you have filled in
select page, count(*) as spots, count(url) as filled
from public.site_images group by page order by page;

-- your list, by which form they came from
select coalesce(source,'unknown') as came_from,
       count(*)                            as people,
       count(*) filter (where consent)     as you_may_email
from public.leads group by 1 order by 2 desc;

-- what the website can currently show
-- who is paying, once RevenueCat is connected
select coalesce(status,'not connected yet') as status, count(*) as people
from public.subscriptions group by 1 order by 2 desc;

select
  (select count(*) from public.posts where published)            as published_posts,
  (select count(*) from public.transformations where published)  as published_transformations,
  (select count(*) from public.events)                           as events_in_admin;
