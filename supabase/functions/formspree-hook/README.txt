CONNECTING FORMSPREE TO YOUR DATABASE
=====================================

What this does
  Right now Formspree emails you when someone signs up, and the website
  separately tries to write them into the database. Two paths, and only
  one of them was working. This makes Formspree itself write into the
  database, so a signup cannot be lost even if the website's own attempt
  fails.

SET IT UP
  1. Pick a long random word and set it as the secret:

       supabase secrets set FORMSPREE_SECRET=pick-something-long-and-random

  2. Deploy:

       supabase functions deploy formspree-hook --no-verify-jwt

     The --no-verify-jwt matters. Formspree is not logged in as anyone, so
     the function has to accept an anonymous request. The secret word in
     the URL is what keeps it private instead.

  3. Copy the function URL from the Supabase dashboard. It looks like:

       https://ghubvckcfcclzhbaafjh.supabase.co/functions/v1/formspree-hook

     Add your secret on the end:

       https://ghubvckcfcclzhbaafjh.supabase.co/functions/v1/formspree-hook?k=pick-something-long-and-random

  4. In Formspree: your form, then Settings, then Integrations or Plugins,
     and add a Webhook pointing at that URL.

  5. Submit the form on the website once, and check:

       select name, email, source, created_at from public.leads
       order by created_at desc limit 3;

WORTH KNOWING
  Webhooks are a paid Formspree feature. If your plan does not include
  them, the Import CSV button on the Leads tab does the same job by hand,
  and the website's own direct write covers new signups once the days and
  where_train columns exist.

  Someone who fills in two different forms updates their existing row
  rather than creating a second one.

  This only catches submissions from the moment you switch it on. For the
  ones already in Formspree, export a CSV and use Import CSV in the admin.
