PULLING YOUR FORMSPREE LIST INTO THE DATABASE
=============================================

Formspree has every signup you have ever had. The database only has the
ones where the website's own write happened to work. This reads Formspree
and fills in the gaps, including everyone from before.

SET IT UP
  1. In Formspree, the HTTP API setting you just switched on gives you a
     key. Copy it.

  2. In a terminal, in your site folder:

       supabase secrets set FORMSPREE_API_KEY=paste-the-key-here
       supabase secrets set FORMSPREE_FORM_ID=mrenbwpz
       supabase functions deploy formspree-sync

     The key goes into Supabase, never into a web page, so nobody can read
     it out of your site.

  3. Run it once from the Supabase dashboard: Edge Functions,
     formspree-sync, Invoke.

     It answers with something like {"added":12,"updated":3,"skipped":0}.

  4. Check the admin Leads tab. Everyone should be there, with the date
     they actually signed up rather than today.

KEEP IT IN STEP
  To have it run by itself every hour, in the SQL editor:

    select cron.schedule(
      'formspree-hourly', '0 * * * *',
      $$select net.http_post(
          url := 'https://ghubvckcfcclzhbaafjh.supabase.co/functions/v1/formspree-sync',
          headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
        )$$
    );

  That needs the pg_cron and pg_net extensions turned on, under
  Database then Extensions.

WORTH KNOWING
  Running it twice is safe. Anyone already there is updated, not
  duplicated, matched on email address.

  It never overwrites a filled in field with a blank one.

  If Formspree answers 401, the key is wrong. If it answers 403, the HTTP
  API is not enabled on that form or not included in your plan.
