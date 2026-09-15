-- ALTER YOU · every photo spot on the website
-- Run this once in Supabase → SQL Editor. It makes sure every image slot on
-- the site shows up in the admin under Website images, so you can change any
-- of them yourself without touching code.
--
-- Safe to run more than once. It never overwrites a photo you have uploaded,
-- it only fills in a missing label or hint.

create table if not exists public.site_images (
  key        text primary key,
  url        text,
  label      text,
  hint       text,
  page       text,
  sort_order integer default 0,
  updated_at timestamptz default now()
);

alter table public.site_images add column if not exists label      text;
alter table public.site_images add column if not exists hint       text;
alter table public.site_images add column if not exists page       text;
alter table public.site_images add column if not exists sort_order integer default 0;

insert into public.site_images (key, label, hint, page, sort_order) values
  ('app_today', 'App screen, Today', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 0),
  ('hero_1', 'Hero, first photo', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 1),
  ('hero_2', 'Hero, second photo', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 2),
  ('program_1', 'Find your fit, Glute Build', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 3),
  ('program_2', 'Find your fit, Foundations', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 4),
  ('program_3', 'Find your fit, Two Day Minimum', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 5),
  ('program_4', 'Find your fit, Home Strength', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 6),
  ('recipe_1', 'Recipe, protein overnight oats', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 7),
  ('recipe_4', 'Recipe, chipotle chicken tacos', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 8),
  ('recipe_5', 'Recipe, chicken burgers', 'A photo already ships with the site here. Uploading one replaces it.', 'Home', 9),
  ('app_cycle', 'App screen, Cycle', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 10),
  ('app_form', 'App screen, form library', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 11),
  ('app_fuel', 'App screen, Fuel', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 12),
  ('app_grocery', 'App screen, grocery list', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 13),
  ('app_programs', 'App screen, picking your program', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 14),
  ('app_progress', 'App screen, Progress', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 15),
  ('app_tracker', 'App screen, lifting heavier', 'A photo already ships with the site here. Uploading one replaces it.', 'Features', 16),
  ('hero_features', 'Features, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Features', 17),
  ('hero_pricing', 'Pricing, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Pricing', 18),
  ('hero_programs', 'Programs, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Programs', 19),
  ('glutes_form', 'Glute training, form', 'No photo yet, so this spot shows a plain background.', 'Glute training', 20),
  ('glutes_hero', 'Glute training, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Glute training', 21),
  ('hero_glutes', 'Glute training, top of page', 'No photo yet, so this spot shows a plain background.', 'Glute training', 22),
  ('ch_build', 'Bikini Build card', 'A photo already ships with the site here. Uploading one replaces it.', 'Challenges', 23),
  ('ch_shred', 'Summer Shred card', 'A photo already ships with the site here. Uploading one replaces it.', 'Challenges', 24),
  ('hero_challenges', 'Challenges, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Challenges', 25),
  ('shred_hero', 'Summer Shred, photo behind the heading', 'A photo already ships with the site here. Uploading one replaces it.', 'Summer Shred', 26),
  ('amb_build', 'Bikini Build, ambassador', 'No photo yet, so this spot shows a plain background.', 'Bikini Build', 27),
  ('build_food', 'Bikini Build, food', 'No photo yet, so this spot shows a plain background.', 'Bikini Build', 28),
  ('build_hero', 'Bikini Build, wide photo', 'A photo already ships with the site here. Uploading one replaces it.', 'Bikini Build', 29),
  ('build_host', 'Bikini Build, your photo as host', 'No photo yet, so this spot shows a plain background.', 'Bikini Build', 30),
  ('build_training', 'Bikini Build, training', 'No photo yet, so this spot shows a plain background.', 'Bikini Build', 31),
  ('hero_build', 'Bikini Build, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Bikini Build', 32),
  ('hero_about', 'About, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'About', 33),
  ('hero_calculator', 'Calculator, photo behind the heading', 'No photo yet, so this spot shows a plain background.', 'Calculator', 34),
  ('post_overload', 'Blog post, progressive overload', 'No photo yet, so this spot shows a plain background.', 'post.html', 35)
on conflict (key) do update
  set label      = coalesce(public.site_images.label, excluded.label),
      hint       = excluded.hint,
      page       = coalesce(public.site_images.page, excluded.page),
      sort_order = excluded.sort_order;

-- Slots from earlier versions that nothing on the site uses any more.
-- They only clutter the admin. Uncomment to clear them out.
-- delete from public.site_images where key in (
--   'amb_shred','brand_og','ch_hero','hero_3','hero_4','post_budget','post_creatine',
--   'post_cycle','post_headline','post_nowar','post_protein','post_scale','post_start',
--   'post_timeline','post_twodays','about_roxy'
-- ) and url is null;

select page, count(*) as spots, count(url) as have_a_photo
from public.site_images group by page order by min(sort_order);
