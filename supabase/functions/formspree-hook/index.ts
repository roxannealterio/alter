// ALTER YOU · catch every Formspree submission and put it in the database
//
// Formspree already emails you when someone signs up. This makes it also
// write them into the leads table, so the admin and the email tools see
// them without you exporting anything.
//
// It is deliberately forgiving about field names. Formspree sends whatever
// the form input was called, and the forms on the site do not all use the
// same words, so each field is looked for under several spellings.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  // A shared word in the URL, so only Formspree can write to your table.
  // Set it with: supabase secrets set FORMSPREE_SECRET=some-long-random-word
  const secret = Deno.env.get('FORMSPREE_SECRET')
  if (secret) {
    const given = new URL(req.url).searchParams.get('k')
    if (given !== secret) return new Response('No', { status: 401 })
  }

  try {
    const body = await req.json()

    // Formspree nests the answers differently depending on the plan, so
    // flatten whatever shape turns up into one plain object.
    const flat: Record<string, unknown> = {
      ...(body ?? {}),
      ...((body?.data ?? {}) as Record<string, unknown>),
      ...((body?.submission ?? {}) as Record<string, unknown>),
    }

    const get = (...names: string[]) => {
      for (const n of names) {
        for (const key of Object.keys(flat)) {
          if (key.toLowerCase().replace(/[^a-z]/g, '') === n) {
            const v = flat[key]
            if (v !== undefined && v !== null && String(v).trim() !== '') {
              return String(v).trim()
            }
          }
        }
      }
      return null
    }

    const email = (get('email', 'emailaddress', 'youremail') || '').toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      // Not a real signup. Say ok anyway, or Formspree keeps retrying.
      return json({ skipped: 'no usable email' })
    }

    const yes = (v: string | null) =>
      !!v && /^(y|yes|true|1|on|checked)$/i.test(v)

    const row = {
      name:        get('name', 'firstname', 'fullname'),
      email,
      phone:       get('phone', 'mobile', 'phonenumber'),
      source:      get('source', 'form', 'subject') || 'formspree',
      days:        get('days', 'daysperweek'),
      where_train: get('where', 'wheretrain', 'wheredoyoutrain'),
      consent:     yes(get('consent', 'marketing', 'optin', 'subscribe')),
      status:      'new',
    }

    // The service key lives in Supabase, never in a browser, so this can
    // write even though the table is closed to the public.
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Someone filling in two different forms is normal, not an error.
    const { data: already } = await sb
      .from('leads').select('id').eq('email', email).maybeSingle()

    if (already) {
      // Keep whichever details are now filled in, without wiping the old ones
      const patch: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(row)) {
        if (v !== null && v !== '' && k !== 'email' && k !== 'status') patch[k] = v
      }
      await sb.from('leads').update(patch).eq('id', already.id)
      return json({ updated: email })
    }

    const { error } = await sb.from('leads').insert(row)
    if (error) return json({ error: error.message }, 500)
    return json({ added: email })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
