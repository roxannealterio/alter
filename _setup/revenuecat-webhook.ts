// ═══════════════════════════════════════════════════════════════
//  RevenueCat webhook, for ALTER YOU
//
//  Deploy this as a Supabase Edge Function named "revenuecat", then
//  point RevenueCat's webhook at it. Setup is in REVENUECAT.md.
//
//  RevenueCat sends an event every time somebody starts a trial,
//  converts, renews, cancels or lapses. This keeps one row per person
//  in the subscriptions table with their latest state, so the admin
//  dashboard can show who is actually paying.
//
//  It answers 200 to everything it understands, including events it
//  chooses to ignore, because RevenueCat retries anything that is not
//  a 2xx and there is no sense in it retrying something we have
//  deliberately skipped.
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AUTH    = Deno.env.get('REVENUECAT_AUTH') ?? '';
const URL_    = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

/* How each RevenueCat event maps to a status you would actually use.
   Anything not listed here is ignored rather than guessed at. */
const STATUS: Record<string, string> = {
  INITIAL_PURCHASE:     'active',
  TRIAL_STARTED:        'trial',
  RENEWAL:              'active',
  PRODUCT_CHANGE:       'active',
  UNCANCELLATION:       'active',
  NON_RENEWING_PURCHASE:'active',
  CANCELLATION:         'cancelled',   // still has access until it expires
  EXPIRATION:           'lapsed',
  BILLING_ISSUE:        'billing_issue',
  SUBSCRIPTION_PAUSED:  'cancelled'
};

const ms = (v: unknown) =>
  typeof v === 'number' && v > 0 ? new Date(v).toISOString() : null;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Send a POST', { status: 405 });
  }

  // RevenueCat sends whatever you put in its Authorization field
  if (!AUTH || req.headers.get('authorization') !== AUTH) {
    return new Response('Not authorised', { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Could not read that', { status: 400 });
  }

  const e = body?.event;
  if (!e?.type) return new Response('ok, nothing to do', { status: 200 });

  const status = STATUS[e.type];
  if (!status) {
    // a real event, just not one that changes anything we track
    return new Response(`ok, ignoring ${e.type}`, { status: 200 });
  }

  const row = {
    app_user_id:   String(e.app_user_id ?? e.original_app_user_id ?? ''),
    email:         e.subscriber_attributes?.$email?.value ?? null,
    status,
    product_id:    e.product_id ?? null,
    store:         (e.store ?? '').toLowerCase() || null,
    price_cents:   typeof e.price === 'number' ? Math.round(e.price * 100) : null,
    currency:      e.currency ?? 'AUD',
    trial_ends_at: e.type === 'TRIAL_STARTED' ? ms(e.expiration_at_ms) : null,
    renews_at:     ms(e.expiration_at_ms),
    cancelled_at:  status === 'cancelled' ? new Date().toISOString() : null,
    updated_at:    new Date().toISOString()
  };

  if (!row.app_user_id) {
    return new Response('ok, no user on that event', { status: 200 });
  }

  const sb = createClient(URL_, SERVICE, { auth: { persistSession: false } });

  /* one row per person, replaced each time their state changes, so the
     table stays the current picture rather than a growing log */
  const { error } = await sb
    .from('subscriptions')
    .upsert(row, { onConflict: 'app_user_id' });

  if (error) {
    // a 500 makes RevenueCat retry, which is what we want for a real failure
    console.error('subscriptions upsert failed', error);
    return new Response('could not save', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
