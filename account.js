/* ══════════════════════════════════════════════════════════════
   ACCOUNT  (account.html)
   One Supabase account for the website and the app. Sign up, log in,
   forgot password, and a small account page: name, email, membership,
   challenge, email updates, log out, delete. The full settings live
   in the app, on purpose.
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (!window.supabase || !window.ALTER_SUPABASE) return;
  var sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key);

  var $ = function (id) { return document.getElementById(id); };
  var out = $('acctOut'), inn = $('acctIn'), reset = $('acctReset'), loading = $('acctLoading');
  var form = $('acctForm'), err = $('acctErr'), btn = $('acctBtn');
  var mode = 'signup';
  var justCreated = false;
  var resetEmail = '';

  /* ── mode: signup / login ─────────────────────────────────── */
  function setMode(m) {
    mode = m === 'login' ? 'login' : 'signup';
    out.querySelectorAll('[role="tab"]').forEach(function (t) { t.classList.toggle('on', t.dataset.mode === mode); });
    out.querySelectorAll('[data-for]').forEach(function (el) { el.hidden = el.dataset.for !== mode; });
    btn.textContent = mode === 'login' ? 'Log in' : 'Create my account';
    $('a_pw').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    err.hidden = true;
    try { history.replaceState(null, '', 'account.html' + (mode === 'login' ? '?mode=login' : '?mode=signup')); } catch (e) {}
  }
  out.querySelectorAll('[role="tab"]').forEach(function (t) {
    t.addEventListener('click', function () { setMode(t.dataset.mode); });
  });
  out.querySelectorAll('[data-switch]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); setMode(a.dataset.switch); });
  });

  /* ── date of birth: DD/MM/YYYY, real date, 16 to 100 ──────── */
  var dobEl = $('a_dob');
  dobEl.addEventListener('input', function () {
    var d = dobEl.value.replace(/\D/g, '').slice(0, 8);
    if (d.length > 4) d = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    else if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2);
    dobEl.value = d;
  });
  function dobToISO(v) {
    var p = String(v || '').split('/');
    if (p.length !== 3 || p[0].length !== 2 || p[1].length !== 2 || p[2].length !== 4) return null;
    var iso = p[2] + '-' + p[1] + '-' + p[0];
    var d = new Date(iso + 'T12:00:00Z');
    if (isNaN(d)) return null;
    if (d.getUTCFullYear() !== +p[2] || d.getUTCMonth() + 1 !== +p[1] || d.getUTCDate() !== +p[0]) return null;
    if (d.getTime() > Date.now()) return null;
    return iso;
  }
  function ageFromISO(iso) {
    if (!iso) return null;
    var d = new Date(iso + 'T12:00:00'), now = new Date();
    var y = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) y -= 1;
    return y >= 16 && y <= 100 ? y : null;
  }

  /* ── Klaviyo: same list and welcome flow as the app ───────── */
  function subscribeKlaviyo(email, first, last) {
    var kl = window.ALTER_KLAVIYO;
    if (!kl || !kl.company_id || !kl.list_id) return;
    try {
      fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(kl.company_id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'revision': '2024-10-15' },
        body: JSON.stringify({ data: { type: 'subscription', attributes: {
          custom_source: 'ALTER YOU website account',
          profile: { data: { type: 'profile', attributes: {
            email: email, first_name: first || '', last_name: last || '',
            properties: { source: 'website' }
          } } }
        }, relationships: { list: { data: { type: 'list', id: kl.list_id } } } } })
      }).catch(function () {});
    } catch (e) {}
  }

  function friendly(e) {
    var m = String((e && e.message) || '');
    if (/invalid login|invalid_credentials/i.test(m)) return 'Email or password is incorrect.';
    if (/already registered|already been registered|already exists/i.test(m)) return 'There is already an account with that email. Try logging in.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first. Check your inbox.';
    if (/too many|rate limit/i.test(m)) return 'Too many tries. Give it a minute and try again.';
    if (/network|fetch/i.test(m)) return 'No connection. Check your internet and try again.';
    if (/password/i.test(m) && /6|short|weak/i.test(m)) return 'Use at least 6 characters for your password.';
    return m || 'Something went wrong. Please try again.';
  }
  function showErr(el, msg) { el.textContent = msg; el.hidden = false; }

  /* ── create account / log in ──────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true;
    var f = new FormData(form);
    var email = String(f.get('email') || '').trim().toLowerCase();
    var pw = String(f.get('password') || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr(err, "That doesn't look like an email address.");
    if (pw.length < 6) return showErr(err, 'Use at least 6 characters for your password.');

    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'One moment';
    var done = function () { btn.disabled = false; btn.textContent = label; };

    if (mode === 'login') {
      sb.auth.signInWithPassword({ email: email, password: pw }).then(function (res) {
        if (res.error) throw res.error;
        if (window.track) window.track('Login', { source: 'website' });
      }).catch(function (e2) { showErr(err, friendly(e2)); done(); });
      return;
    }

    var name = String(f.get('name') || '').trim();
    var surname = String(f.get('surname') || '').trim();
    var iso = dobToISO(f.get('dob'));
    if (!name) { done(); return showErr(err, 'Add your first name.'); }
    if (!iso) { done(); return showErr(err, 'Enter your date of birth as DD / MM / YYYY.'); }
    if (!ageFromISO(iso)) { done(); return showErr(err, 'You need to be 16 or over to use ALTER YOU.'); }
    if (!f.get('agree')) { done(); return showErr(err, 'Please agree to the Terms and Privacy Policy to continue.'); }
    var marketing = !!f.get('marketing');

    sb.auth.signUp({
      email: email, password: pw,
      options: { data: { name: name, last_name: surname, dob: iso, units: 'metric', marketing: marketing } }
    }).then(function (res) {
      if (res.error) throw res.error;
      if (marketing) subscribeKlaviyo(email, name, surname);
      if (window.track) window.track('Signup', { source: 'website-account' });
      justCreated = true;
      if (!res.data || !res.data.session) {
        /* email confirmation is on in Supabase: no session yet */
        form.hidden = true;
        var p = document.createElement('p');
        p.className = 'acct-lede';
        p.innerHTML = '<b>Check your email.</b> We sent a link to ' + escapeHtml(email) + '. Tap it and your account is ready.';
        out.appendChild(p);
        done();
      }
    }).catch(function (e2) { showErr(err, friendly(e2)); done(); });
  });

  /* ── forgot password ──────────────────────────────────────── */
  $('acctForgot').addEventListener('click', function (e) {
    e.preventDefault();
    err.hidden = true;
    var email = String($('a_email').value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showErr(err, 'Type your email above first, then tap Forgot your password.');
    sb.auth.resetPasswordForEmail(email, { redirectTo: 'https://alteryouapp.com/account.html?mode=reset' }).then(function (res) {
      if (res.error) throw res.error;
      /* the reset email carries a code (the same email the app uses), so ask for it here */
      resetEmail = email; recovering = true;
      $('r_codeWrap').hidden = false;
      $('resetLede').textContent = 'We\u2019ve emailed a code to ' + email + '. Type it below with your new password. Check your junk folder if it isn\u2019t there in a few minutes.';
      $('resetLede').hidden = false;
      show(reset);
    }).catch(function (e2) { err.classList.remove('ok'); showErr(err, friendly(e2)); });
  });

  /* ── new password (from the reset email) ──────────────────── */
  $('resetForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var rerr = $('resetErr'), rbtn = $('resetBtn');
    rerr.hidden = true;
    var pw = $('r_pw').value || '';
    var withCode = !$('r_codeWrap').hidden;
    var code = String($('r_code').value || '').replace(/\D/g, '');
    if (withCode && code.length < 6) return showErr(rerr, 'Type the code from the email.');
    if (pw.length < 6) return showErr(rerr, 'Use at least 6 characters.');
    rbtn.disabled = true;
    var step = withCode
      ? sb.auth.verifyOtp({ email: resetEmail, token: code, type: 'recovery' }).then(function (r) {
          if (r.error) throw new Error('That code is wrong or has expired. Check the newest email, or go back and request a new one.');
        })
      : Promise.resolve();
    step.then(function () { return sb.auth.updateUser({ password: pw }); }).then(function (res) {
      if (res.error) throw res.error;
      recovering = false;
      try { history.replaceState(null, '', 'account.html'); } catch (e2) {}
      render(res.data.user);
    }).catch(function (e2) { showErr(rerr, friendly(e2)); rbtn.disabled = false; });
  });

  /* ── signed-in page ───────────────────────────────────────── */
  function show(which) {
    loading.hidden = true;
    out.hidden = which !== out; inn.hidden = which !== inn; reset.hidden = which !== reset;
    window.scrollTo(0, 0);
  }

  function render(user) {
    var md = user.user_metadata || {};
    var first = md.name || md.full_name || '';
    $('acctHello').innerHTML = first ? 'Hi ' + escapeHtml(first) + ', <em>this is your account</em>' : 'Your account';
    $('acctName').textContent = [first, md.last_name || ''].join(' ').trim() || '—';
    $('acctEmail').textContent = user.email || '';
    $('acctPlan').textContent = 'Checking';
    $('acctChallenge').textContent = 'Checking';
    $('acctMarketing').checked = !!md.marketing;
    $('acctReady').hidden = !justCreated;
    $('acctHello').hidden = justCreated;

    /* app link follows the launch switch the rest of the site uses */
    var live = window.alterIsLive && window.alterIsLive();
    var a = $('acctAppBtn');
    if (live && window.ALTER_APP_STORE) { a.href = window.ALTER_APP_STORE; a.textContent = 'Download the app'; }
    else { a.href = 'pricing.html'; a.textContent = 'Get the app'; }

    sb.from('profiles_alter').select('name,premium,onboarded').eq('id', user.id).maybeSingle().then(function (res) {
      var p = (res && res.data) || null;
      if (p && p.name && !first) $('acctName').textContent = p.name;
      $('acctPlan').textContent = p && p.premium
        ? 'Member'
        : 'Not a member yet. Start your 3-day free trial in the app.';
    }, function () { $('acctPlan').textContent = 'Not a member yet'; });

    sb.from('challenge_entries').select('challenge_id, challenges(title, starts_on)').eq('user_id', user.id).then(function (res) {
      var rows = (res && res.data) || [];
      if (!rows.length) { $('acctChallenge').textContent = 'Not joined yet. Join in the app.'; return; }
      var names = rows.map(function (r) {
        var c = r.challenges || {};
        return (c.title || 'Challenge') + (c.starts_on ? ' (starts ' + niceDate(c.starts_on) + ')' : '');
      });
      $('acctChallenge').textContent = names.join(', ');
    }, function () { $('acctChallenge').textContent = 'See the app.'; });

    show(inn);
  }

  function niceDate(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* email updates toggle: on subscribes, off is honoured by the
     unsubscribe page (Klaviyo has no public opt-out call) */
  $('acctMarketing').addEventListener('change', function () {
    var on = this.checked;
    sb.auth.getUser().then(function (res) {
      var u = res.data && res.data.user; if (!u) return;
      var md = u.user_metadata || {};
      sb.auth.updateUser({ data: { marketing: on } }).catch(function () {});
      if (on) subscribeKlaviyo(u.email, md.name || '', md.last_name || '');
      else {
        /* the unsubscribe page reads the address wrapped the same way the email footer links do */
        var wrapped = btoa(u.email || '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        window.location.href = 'unsubscribe.html?u=' + wrapped;
      }
    });
  });

  $('acctLogout').addEventListener('click', function () {
    sb.auth.signOut().then(function () { window.location.href = 'index.html?out=1'; });
  });

  /* two taps to delete, no browser dialogs */
  var delArmed = false;
  $('acctDelete').addEventListener('click', function () {
    var d = $('acctDelete'), ierr = $('acctInErr');
    ierr.hidden = true;
    if (!delArmed) { delArmed = true; d.textContent = 'Tap again to delete for good'; d.classList.add('armed'); return; }
    d.disabled = true; d.textContent = 'Deleting';
    sb.rpc('delete_own_account').then(function (res) {
      if (res.error) throw res.error;
      return sb.auth.signOut();
    }).then(function () { window.location.href = 'index.html?deleted=1'; })
      .catch(function (e) { showErr(ierr, friendly(e)); d.disabled = false; d.textContent = 'Delete my account'; delArmed = false; d.classList.remove('armed'); });
  });

  /* ── start ────────────────────────────────────────────────── */
  var recovering = /[?&]mode=reset/.test(location.search) || /type=recovery/.test(location.hash);
  var q = (location.search.match(/[?&]mode=(\w+)/) || [])[1];
  setMode(q === 'login' ? 'login' : 'signup');
  /* an expired or already used email link comes back with the reason in the hash */
  var hashErr = (location.hash.match(/error_description=([^&]+)/) || [])[1];
  if (hashErr) {
    recovering = false;
    setMode('login');
    showErr(err, 'That link has expired or was already used. Log in, or request a new reset link below.');
    try { history.replaceState(null, '', 'account.html?mode=login'); } catch (e) {}
  }

  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'PASSWORD_RECOVERY') { recovering = true; show(reset); return; }
    if (session && session.user) {
      if (recovering) { show(reset); return; }
      render(session.user);
    } else if (event !== 'INITIAL_SESSION' || !recovering) {
      show(out);
    }
  });
  sb.auth.getSession().then(function (res) {
    var s = res.data && res.data.session;
    if (s && s.user) { if (recovering) show(reset); else render(s.user); }
    else show(out);
  });
})();
