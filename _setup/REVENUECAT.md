# Connecting RevenueCat to the dashboard

Your admin already reads live data from the app: members, sessions
completed, active users, challenge entries, progress photos. Those are
real numbers straight out of the database the app writes to.

The one thing it cannot see is **who is actually paying**, because App
Store billing runs through RevenueCat, not your database. This connects
the two. It takes about ten minutes and you only do it once.

---

## 1. Create the table

Already done, if you have run `_setup/SETUP.sql`. It creates
`subscriptions`.

## 2. Add the webhook function to Supabase

In Supabase, go to **Edge Functions**, then **Deploy a new function**.
Name it `revenuecat`. Paste in the contents of
`_setup/revenuecat-webhook.ts`, then deploy.

## 3. Add two secrets

Still in Supabase, under **Edge Functions → Manage secrets**, add:

    REVENUECAT_AUTH   a password you invent, any long random string
    SERVICE_ROLE_KEY  Settings → API → service_role key

The service role key bypasses the row security rules, which is what lets
the webhook write. Never put that key in the website or the app, only
here.

## 4. Point RevenueCat at it

In RevenueCat, open your project, then **Integrations → Webhooks**.

    URL              https://YOUR-PROJECT.supabase.co/functions/v1/revenuecat
    Authorization    the REVENUECAT_AUTH value you invented above

Your project URL is in Supabase under Settings → API.

## 5. Check it

RevenueCat has a **Send test event** button. Press it, then open the
admin dashboard. A row appears in `subscriptions` and the paying cards
fill in.

---

## What you get on the dashboard

    Paying          people on an active paid subscription
    On trial        in their three days, not yet charged
    Cancelled       cancelled but still inside the period they paid for
    Monthly value   a rough recurring figure from the active plans

The monthly value is indicative, not accounting. It does not know about
refunds, Apple's cut, or currency conversion. Use RevenueCat for
anything that has to be exact.

## If you never do this

Nothing breaks. The dashboard shows everything else and simply leaves
the paying numbers out rather than guessing at them.
