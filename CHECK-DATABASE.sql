-- ALTER YOU · what does my database still need?
--
-- Run this one first. It changes nothing. It just tells you which tables,
-- views and storage buckets the website and admin expect, and which of them
-- are missing, so you know what is left to do rather than guessing.

with needed(name, kind, used_for) as (values
  ('leads',              'table',  'Everyone who fills in a form. The Leads tab.'),
  ('site_images',        'table',  'Every photo spot. The Website images tab.'),
  ('transformations',    'table',  'Before and after photos on the home page.'),
  ('posts',              'table',  'Blog posts.'),
  ('recipes',            'table',  'Recipes in the app.'),
  ('challenges',         'table',  'Summer Shred and Bikini Build.'),
  ('challenge_entries',  'table',  'Who has joined a challenge.'),
  ('announcements',      'table',  'In app announcements.'),
  ('events',             'table',  'Events.'),
  ('profiles_alter',     'table',  'Members, and who is an admin.'),
  ('subscriptions',      'table',  'Who is paying.'),
  ('progress',           'table',  'Member progress.'),
  ('progress_photos',    'table',  'Member progress photos.'),
  ('workouts',           'table',  'Logged workouts.'),
  ('exercises',          'table',  'Exercises.'),
  ('exercise_library',   'table',  'The exercise library.'),
  ('form_guides',        'table',  'Form guides.'),
  ('videos',             'table',  'Exercise videos.'),
  ('posts_community',    'table',  'The community feed.'),
  ('reports',            'table',  'Reported content.'),
  ('ambassadors',        'table',  'Influencers and their codes.'),
  ('referrals',          'table',  'Who each ambassador brought in.'),
  ('ambassador_earnings','view',   'Works out what you owe each ambassador.')
)
select
  n.name,
  n.kind,
  case when c.relname is null then 'MISSING' else 'ok' end as status,
  n.used_for
from needed n
left join pg_class c
  on c.relname = n.name
 and c.relnamespace = 'public'::regnamespace
 and c.relkind in ('r','v','m','p')
order by (c.relname is not null), n.name;


-- Storage buckets, checked separately because they live elsewhere
with needed(name, used_for) as (values
  ('site-images',   'Photos you upload for the website'),
  ('blog-images',   'Blog post photos'),
  ('recipe-photos', 'Recipe photos'),
  ('progress',      'Member progress photos'),
  ('videos',        'Exercise videos')
)
select
  n.name,
  case when b.id is null then 'MISSING' else 'ok' end as status,
  n.used_for
from needed n
left join storage.buckets b on b.name = n.name
order by (b.id is not null), n.name;


-- And the two columns the new Ambassadors tab needs
select
  'ambassadors.instagram'    as thing,
  case when exists (select 1 from information_schema.columns
                    where table_name='ambassadors' and column_name='instagram')
       then 'ok' else 'MISSING, run AMBASSADORS.sql' end as status
union all select
  'ambassadors.payout_email',
  case when exists (select 1 from information_schema.columns
                    where table_name='ambassadors' and column_name='payout_email')
       then 'ok' else 'MISSING, run AMBASSADORS.sql' end
union all select
  'referrals.paid_out',
  case when exists (select 1 from information_schema.columns
                    where table_name='referrals' and column_name='paid_out')
       then 'ok' else 'MISSING, run AMBASSADORS.sql' end
union all select
  'site_images rows',
  coalesce((select count(*)::text || ' photo spots registered'
            from public.site_images), 'MISSING, run SITE_IMAGES.sql');
