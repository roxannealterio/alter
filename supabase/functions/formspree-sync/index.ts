// ALTER YOU · pull everyone out of Formspree and into the database
//
// Formspree has every signup you have ever had. The database only has the
// ones where the website's own write happened to succeed. This reads the
// Formspree list and fills in the gaps.
//
// Run it once and it backfills everything. Leave it on a schedule and it
// keeps the two in step, so a signup can never be lost again.
//
// SET UP
//   supabase secrets set FORMSPREE_API_KEY=your-key-from-formspree
//   supabase secrets set FORMSPREE_FORM_ID=mrenbwpz
//   supabase functions deploy formspree-sync
//
// RUN IT
//   From the Supabase dashboard, Edge Functions, Invoke.
//   Or on a schedule, see the README.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  try {
    const key    = Deno.env.get('FORMSPREE_API_KEY')
    const formId = Deno.env.get('FORMSPREE_FORM_ID')
    if (!key || !formId) {
      return json({ error: 'FORMSPREE_API_KEY and FORMSPREE_FORM_ID both need setting' }, 500)
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Who is already in the table, so the same person is not added twice
    const { data: existing } = await sb.from('leads').select('id,email')
    const have = new Map<string, string>()
    ;(existing ?? []).forEach((l: { id: string; email: string | null }) => {
      if (l.email) have.set(l.email.toLowerCase(), l.id)
    })

    let added = 0, updated = 0, skipped = 0
    let page = 1
    const perPage = 100

    // Formspree pages its submissions, so keep asking until a page comes
    // back short. Capped so a runaway loop cannot spin forever.
    while (page <= 50) {
      const res = await fetch(
        `https://formspree.io/api/0/forms/${formId}/submissions?page=${page}&per_page=${perPage}`,
        { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } },
      )
      if (!res.ok) {
        return json({ error: `Formspree said ${res.status}`, detail: await res.text() }, 502)
      }

      const body = await res.json()
      const rows: Record<string, unknown>[] =
        body?.submissions ?? body?.data ?? (Array.isArray(body) ? body : [])
      if (!rows.length) break

      for (const sub of rows) {
        // Each submission is a bag of whatever the form inputs were called
        const flat = { ...(sub ?? {}), ...((sub?.data ?? {}) as Record<string, unknown>) }
        const get = (...names: string[]) => {
          for (const n of names) {
            for (const k of Object.keys(flat)) {
              if (k.toLowerCase().replace(/[^a-z]/g, '') === n) {
                const v = flat[k]
                if (v != null && String(v).trim() !== '') return String(v).trim()
              }
            }
          }
          return null
        }

        const email = (get('email', 'emailaddress', 'youremail') || '').toLowerCase()
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { skipped++; continue }

        const yes = (v: string | null) => !!v && /^(y|yes|true|1|on|checked)$/i.test(v)
        const row: Record<string, unknown> = {
          name:        get('name', 'firstname', 'fullname'),
          email,
          phone:       get('phone', 'mobile'),
          source:      get('source', 'subject', 'form') || 'formspree',
          days:        get('days', 'daysperweek'),
          where_train: get('where', 'wheretrain'),
          consent:     yes(get('consent', 'marketing', 'optin')),
        }
        // keep the date they actually signed up, not the date of this sync
        const when = get('date', 'submittedat', 'createdat')
        if (when) {
          const d = new Date(when)
          if (!isNaN(+d)) row.created_at = d.toISOString()
        }

        const id = have.get(email)
        if (id) {
          // fill in blanks without wiping anything already there
          const patch: Record<string, unknown> = {}
          for (const [k, v] of Object.entries(row)) {
            if (v != null && v !== '' && !['email', 'created_at'].includes(k)) patch[k] = v
          }
          if (Object.keys(patch).length) {
            await sb.from('leads').update(patch).eq('id', id)
            updated++
          }
        } else {
          const { error } = await sb.from('leads').insert({ ...row, status: 'new' })
          if (error) { skipped++ } else { added++; have.set(email, 'new') }
        }
      }

      if (rows.length < perPage) break
      page++
    }

    return json({ added, updated, skipped, pages: page })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  })
}
