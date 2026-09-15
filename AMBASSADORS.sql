-- ALTER YOU · ambassador extras
-- Run this in Supabase → SQL Editor if the admin tells you Instagram and
-- payout email were not saved, or if "Mark paid" says it cannot find a column.
-- Safe to run more than once.

-- 1. Contact details on the ambassador themselves
alter table public.ambassadors add column if not exists instagram     text;
alter table public.ambassadors add column if not exists payout_email  text;

-- 2. Somewhere to record that you have actually paid a commission
alter table public.referrals   add column if not exists paid_out      boolean not null default false;
alter table public.referrals   add column if not exists paid_out_at   timestamptz;

-- keep a timestamp whenever a row is marked paid, so you can see when
create or replace function public.stamp_paid_out()
returns trigger language plpgsql as $$
begin
  if new.paid_out and not coalesce(old.paid_out, false) then
    new.paid_out_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_stamp_paid_out on public.referrals;
create trigger trg_stamp_paid_out
  before update on public.referrals
  for each row execute function public.stamp_paid_out();

-- 3. The earnings view only counts what you still owe, so anything marked
--    paid drops out of the "owed" column automatically.
--    If your ambassador_earnings view does not already filter on paid_out,
--    add "and not r.paid_out" to the owed calculation inside it.

-- Check it worked
select column_name from information_schema.columns
 where table_name = 'ambassadors' and column_name in ('instagram','payout_email');
select column_name from information_schema.columns
 where table_name = 'referrals'   and column_name in ('paid_out','paid_out_at');
