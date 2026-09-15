// ALTER YOU · send a broadcast email to your leads
//
// A browser cannot do this safely. Any key it holds can be read by anyone
// who opens the page source, so the sending key lives here instead, on
// Supabase's servers, where only this function can reach it.
//
// SET IT UP ONCE
//   1. Make a Resend account and verify alteryouapp.com as a sending domain.
//      Without a verified domain your mail lands in spam.
//   2. supabase secrets set RESEND_API_KEY=re_your_key_here
//   3. supabase functions deploy send-broadcast
//
// Then the Send tab in the admin can call it.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Only an admin may send. The caller's token is checked against the
    // same is_admin flag the admin page uses, so a leaked function URL
    // on its own is not enough to send mail as you.
    const auth = req.headers.get('Authorization') || ''
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    )
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return json({ error: 'Not signed in' }, 401)

    const { data: prof } = await sb
      .from('profiles_alter').select('is_admin').eq('id', user.id).maybeSingle()
    if (!prof?.is_admin) return json({ error: 'Not an admin' }, 403)

    const { subject, body, recipients } = await req.json()
    if (!subject || !body) return json({ error: 'Subject and body are both needed' }, 400)
    if (!Array.isArray(recipients) || !recipients.length)
      return json({ error: 'No recipients' }, 400)

    const key = Deno.env.get('RESEND_API_KEY')
    if (!key) return json({ error: 'RESEND_API_KEY is not set' }, 500)

    // One at a time, with the name merged in, so each person gets their own
    // email rather than seeing everyone else's address in a shared BCC.
    let sent = 0
    const failed: string[] = []

    for (const r of recipients) {
      const first = (r.name || '').trim().split(/\s+/)[0] || 'there'
      const text = String(body).replace(/\{name\}/gi, first)
      const subj = String(subject).replace(/\{name\}/gi, first)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'ALTER YOU <hello@alteryouapp.com>',
          to: r.email,
          subject: subj,
          text,
          // Every bulk email needs a one click way out. It is the law in
          // Australia under the Spam Act, and it keeps you out of spam folders.
          headers: { 'List-Unsubscribe': '<mailto:unsubscribe@alteryouapp.com>' },
        }),
      })

      if (res.ok) sent++
      else failed.push(r.email)

      // Resend allows 10 a second on the free tier
      await new Promise((f) => setTimeout(f, 120))
    }

    return json({ sent, failed })
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
