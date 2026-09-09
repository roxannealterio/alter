/* ══════════════════════════════════════════════════════════════
   ALTER — site script. Loaded on every page. Every block checks
   that the thing it drives is actually on the page first, so one
   missing section never stops the rest working.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── nav + announcement bar ────────────────────────────────── */
  var burger = document.querySelector('.burger');
  var links = document.getElementById('links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var barX = document.querySelector('.bar .x');
  if (barX) {
    barX.addEventListener('click', function () {
      var bar = barX.closest('.bar');
      if (bar) bar.remove();
    });
  }

  /* ── reveal on scroll ──────────────────────────────────────── */
  var targets = document.querySelectorAll('[data-reveal],[data-reveal-group]');
  if (targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ── stat rail: dots on a phone, count up once seen ────────── */
  var rail = document.querySelector('.stats');
  var railDots = document.querySelector('.stats-sec .dots');
  if (rail && railDots) {
    var stats = rail.querySelectorAll('.stat');
    stats.forEach(function (_, i) {
      var b = document.createElement('button');
      b.className = i === 0 ? 'on' : '';
      b.setAttribute('aria-label', 'Show stat ' + (i + 1));
      b.onclick = function () { rail.scrollTo({ left: rail.clientWidth * i, behavior: 'smooth' }); };
      railDots.appendChild(b);
    });
    rail.addEventListener('scroll', function () {
      var i = Math.round(rail.scrollLeft / rail.clientWidth);
      railDots.querySelectorAll('button').forEach(function (d, n) { d.classList.toggle('on', n === i); });
    }, { passive: true });

    if (!reduce) {
      var counted = false;
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting || counted) return;
          counted = true;
          rail.querySelectorAll('.stat b').forEach(function (el) {
            var m = el.textContent.trim().match(/([^0-9]*)([0-9,]+)(.*)/);
            if (!m) return;
            var pre = m[1], target = parseInt(m[2].replace(/,/g, ''), 10), post = m[3];
            if (!target) return;
            var start = null;
            (function tick(ts) {
              if (!start) start = ts || 0;
              var p = Math.min(((ts || 0) - start) / 1100, 1);
              var eased = 1 - Math.pow(1 - p, 3);
              el.textContent = pre + Math.floor(eased * target).toLocaleString() + post;
              if (p < 1) requestAnimationFrame(tick);
              else el.textContent = pre + target.toLocaleString() + post;
            })();
          });
        });
      }, { threshold: 0.4 });
      so.observe(rail);
    }
  }

  /* ── swipe carousels ───────────────────────────────────────── */
  document.querySelectorAll('.swipe').forEach(function (swipe) {
    var track = swipe.querySelector('.track');
    var dots = document.querySelector('[data-dots="' + swipe.id + '"]');
    var slides = swipe.querySelectorAll('.slide');
    if (!slides.length || !track) return;

    function step() {
      var gap = parseFloat(getComputedStyle(track).gap) || 14;
      return slides[0].offsetWidth + gap;
    }
    if (dots) {
      slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = i === 0 ? 'on' : '';
        d.setAttribute('aria-label', 'Go to ' + (i + 1));
        d.onclick = function () { swipe.scrollTo({ left: step() * i, behavior: 'smooth' }); };
        dots.appendChild(d);
      });
      swipe.addEventListener('scroll', function () {
        var i = Math.round(swipe.scrollLeft / step());
        dots.querySelectorAll('button').forEach(function (d, n) { d.classList.toggle('on', n === i); });
      }, { passive: true });
    }
  });

  document.querySelectorAll('[data-swipe]').forEach(function (btn) {
    btn.onclick = function () {
      var swipe = document.getElementById(btn.dataset.swipe);
      if (!swipe) return;
      var s = swipe.querySelector('.slide');
      var track = swipe.querySelector('.track');
      var gap = parseFloat(getComputedStyle(track).gap) || 14;
      swipe.scrollBy({ left: (s.offsetWidth + gap) * Number(btn.dataset.dir), behavior: 'smooth' });
    };
  });

  /* A photo that is missing leaves a clean empty panel: no broken icon,
     and no alt text spilling across the card. */
  document.querySelectorAll('.slide.tf img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.removeAttribute('src');
      img.removeAttribute('alt');
      img.classList.add('missing');
    });
  });

  /* ── modal ─────────────────────────────────────────────────── */
  var opener = null;
  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    opener = document.activeElement;
    m.hidden = false;
    document.body.classList.add('locked');
    var x = m.querySelector('.promo-x');
    if (x) x.focus();
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    document.body.classList.remove('locked');
    if (opener && opener.focus) opener.focus();
  }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openModal(o.getAttribute('data-open')); return; }
    var c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); closeModal(c.getAttribute('data-close')); }
  });
  /* A link from another page arrives as #launchpop or #waitpop, so the
     modal opens on landing rather than the person seeing nothing
     happen after they pressed a button on the previous page. */
  (function () {
    var id = (location.hash || '').replace('#', '');
    if (!id) return;
    var m = document.getElementById(id);
    if (m && m.classList.contains('promo')) {
      setTimeout(function () { openModal(id); }, 60);
    }
  })();

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.promo:not([hidden])').forEach(function (m) { closeModal(m.id); });
  });
  window.ALTER = { openModal: openModal, closeModal: closeModal };
})();

/* ══════════════════════════════════════════════════════════════
   THE WAITLIST POPUP, ON EVERY PAGE THAT NEEDS ONE
   While there is no App Store link, every download button opens the
   waitlist. The homepage and Summer Shred carry the popup in their
   markup so it still works with no JavaScript. The rest of the site
   gets it added here, so nobody is thrown onto another page just to
   put their name down.

   This runs before the form handling further down, which is what
   wires the new form up like any other.
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (document.getElementById('waitpop')) return;
  if (!document.querySelector('[data-appstore]')) return;
  if ((window.ALTER_APP_STORE || '').trim()) return;   /* app is out, no popup needed */

  var d = document.createElement('div');
  d.className = 'promo';
  d.id = 'waitpop';
  d.hidden = true;
  d.innerHTML =
    '<div class="promo-bg" data-close="waitpop"></div>' +
    '<div class="promo-box" role="dialog" aria-modal="true" aria-labelledby="waitpop-t">' +
      '<button class="promo-x" type="button" data-close="waitpop" aria-label="Close"></button>' +
      '<div class="promo-flag">Launching soon</div>' +
      '<h3 id="waitpop-t">Be the first<em>to know</em></h3>' +
      '<p class="promo-lede">Leave your name and the link comes straight to you the ' +
        'morning it drops, before anyone else gets it.</p>' +
      '<form id="wait-form" data-source="waitlist" action="https://formspree.io/f/mrenbwpz" method="POST" class="pop-form">' +
        '<input type="hidden" name="_subject" value="App waitlist">' +
        '<p class="hidden"><label>Skip this: <input name="_gotcha" tabindex="-1"></label></p>' +
        '<label class="sr-only" for="w_name">First name</label>' +
        '<input id="w_name" name="name" type="text" placeholder="First name" autocomplete="given-name" required>' +
        '<label class="sr-only" for="w_email">Email</label>' +
        '<input id="w_email" name="email" type="email" placeholder="Email" autocomplete="email" required>' +
        '<label class="consent"><input type="checkbox" name="consent" value="yes">' +
          '<span>Also email me about ALTER YOU and anything free I\u2019m running. ' +
          'One click to stop at any time.</span></label>' +
        '<button type="submit" class="promo-cta" data-track="Waitlist submit">Put me on the list</button>' +
        '<p class="launch-err" hidden>Something went wrong. Please try again, or email info@alteryouapp.com.</p>' +
      '</form>' +
      '<p class="promo-fine">No cost, no catch. I\u2019ll email you when it opens.</p>' +
      '<div class="launch-thanks" hidden>' +
        '<div class="thanks-tick" aria-hidden="true"></div>' +
        '<p><b>You\u2019re on the list.</b></p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(d);
})();

/* ══════════════════════════════════════════════════════════════
   Photos from the admin. Every image slot on the site is a .ph with
   a data-img key. The photo is inserted into the slot, so anything
   sitting on top of it (pills, names, captions) survives.
   ══════════════════════════════════════════════════════════════ */
window.ALTER_SUPABASE = {
  url: 'https://ghubvckcfcclzhbaafjh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodWJ2Y2tjZmNjbHpoYmFhZmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5OTU3NTEsImV4cCI6MjA5OTU3MTc1MX0.O3P4jfXbBSBKpiKX8De8DiN36aLmZpjiZof9TORto68'
};

(function () {
  if (!window.supabase) return;
  var slots = document.querySelectorAll('[data-img]');
  if (!slots.length) return;
  var sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key);

  sb.from('site_images').select('key,url').then(function (res) {
    var by = {};
    (res.data || []).forEach(function (r) { by[r.key] = r.url; });
    slots.forEach(function (el) {
      var url = by[el.getAttribute('data-img')];
      if (!url) return;
      /* Some slots ship with a photo already in them, so the site looks
         finished before anything is uploaded. If there is one, its src is
         swapped rather than a second image being stacked on top, which
         means an upload in the admin overrides the shipped file. */
      var img = el.querySelector('img');
      if (img) {
        img.src = url;
        if (el.getAttribute('data-alt')) img.alt = el.getAttribute('data-alt');
      } else {
        img = document.createElement('img');
        img.src = url;
        img.alt = el.getAttribute('data-alt') || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        el.insertBefore(img, el.firstChild);
      }
      el.classList.add('has-photo');
    });
  }).catch(function () {});

  /* Transformations, if this page has the carousel.
     The photos already in the page are the fallback. Database rows only
     replace them once we know the first image actually loads, so a dead
     link in the admin can never leave the section empty. */
  var track = document.querySelector('#tf-swipe .track');
  if (track) {
    var original = track.innerHTML;
    sb.from('transformations').select('*').eq('published', true).order('sort_order')
      .then(function (res) {
        var rows = (res.data || []).filter(function (t) { return t.image_url; });
        if (!rows.length) return;

        // check the first one before throwing the working photos away
        var probe = new Image();
        probe.onload = function () {
          track.innerHTML = rows.map(function (t) {
            var alt = (t.alt || 'Client transformation with ALTER YOU strength training')
                        .replace(/"/g, '&quot;');
            return '<figure class="slide tf"><img src="' + t.image_url + '" alt="' + alt
                 + '" width="900" height="1125" loading="lazy" decoding="async"></figure>';
          }).join('');
          // any individual photo that fails still leaves a clean panel
          track.querySelectorAll('img').forEach(function (img) {
            img.addEventListener('error', function () {
              img.removeAttribute('src'); img.removeAttribute('alt');
            });
          });
        };
        probe.onerror = function () {
          // the admin photos are unreachable, so keep the ones in the page
          track.innerHTML = original;
        };
        probe.src = rows[0].image_url;
      })
      .catch(function () {});
  }
})();

/* ══════════════════════════════════════════════════════════════
   ANALYTICS
   Cookieless by design, so there is no consent banner and nothing
   here contradicts the privacy policy. Set your provider below and
   it loads itself. Leave it as 'none' and nothing is sent anywhere.

   ROXY: pick one and fill in the blank.
     plausible  -> plausible.io, about $9/mo, events included
     umami      -> cloud.umami.is, free tier, events included
     cloudflare -> free, page views only, no events
   ══════════════════════════════════════════════════════════════ */
window.ALTER_ANALYTICS = {
  provider: 'none',              // 'plausible' | 'umami' | 'cloudflare' | 'none'
  domain:   'alteryouapp.com',   // plausible: the site you added
  websiteId: '',                 // umami: the website ID from your dashboard
  umamiHost: 'https://cloud.umami.is',
  token:    '',                  // cloudflare: the beacon token
  honourDoNotTrack: false        // true respects DNT, at the cost of undercounting
};

(function () {
  var cfg = window.ALTER_ANALYTICS || {};
  var queue = [];

  /* track(name, props) works the same whichever provider is set, and does
     nothing at all when none is. Never pass anything personal into props. */
  window.track = function (name, props) {
    try {
      if (window.plausible) return window.plausible(name, props ? { props: props } : undefined);
      if (window.umami && window.umami.track) return window.umami.track(name, props);
      queue.push([name, props]);
    } catch (e) {}
  };

  if (cfg.provider === 'none' || !cfg.provider) return;
  if (cfg.honourDoNotTrack && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) return;

  var s = document.createElement('script');
  s.defer = true;

  if (cfg.provider === 'plausible') {
    s.src = 'https://plausible.io/js/script.outbound-links.js';
    s.setAttribute('data-domain', cfg.domain);
    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  } else if (cfg.provider === 'umami') {
    s.src = (cfg.umamiHost || 'https://cloud.umami.is') + '/script.js';
    s.setAttribute('data-website-id', cfg.websiteId);
  } else if (cfg.provider === 'cloudflare') {
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', '{"token":"' + cfg.token + '"}');
  } else {
    return;
  }

  s.onload = function () {
    queue.splice(0).forEach(function (a) { window.track(a[0], a[1]); });
  };
  document.head.appendChild(s);
})();

/* ── what gets measured ────────────────────────────────────────
   Any element carrying data-track="name" reports a click, so you can
   tag something new in the HTML without touching this file. The rest
   below are the moments worth knowing about on this site.
   ─────────────────────────────────────────────────────────── */
(function () {
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) window.track(el.getAttribute('data-track'), { page: location.pathname });
  });

  /* Did anyone actually reach the price? */
  var plans = document.querySelector('.plans');
  if (plans && 'IntersectionObserver' in window) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen) {
          seen = true;
          window.track('Saw pricing', { page: location.pathname });
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(plans);
  }

  /* Which questions people open tells you what the site failed to answer. */
  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      var q = d.querySelector('summary');
      window.track('Opened FAQ', { question: q ? q.textContent.trim().slice(0, 60) : '' });
    });
  });

  /* Did the transformations carousel hold anyone's attention? */
  var tf = document.getElementById('tf-swipe');
  if (tf) {
    var swiped = false;
    tf.addEventListener('scroll', function () {
      if (swiped) return;
      swiped = true;
      window.track('Swiped transformations');
    }, { passive: true });
  }
})();

/* ── forms: the lead list ──────────────────────────────────────
   Every form on the site writes into the leads table, so the list is
   yours in the admin rather than sitting in an inbox. Formspree still
   gets a copy, so a database problem never loses an entry.

   Consent is stored separately from the signup. Under the Spam Act
   you may email someone about the thing they asked about; anything
   broader needs them to have ticked the box, so the two are not
   treated as the same thing.
   ─────────────────────────────────────────────────────────── */
(function () {
  if (!window.fetch) return;

  var sb = null;
  if (window.supabase && window.ALTER_SUPABASE) {
    try { sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key); }
    catch (e) { sb = null; }
  }

  function save(form) {
    if (!sb) return Promise.resolve();
    var f = new FormData(form);
    var row = {
      name:        (f.get('name')  || '').toString().trim() || null,
      email:       (f.get('email') || '').toString().trim().toLowerCase() || null,
      phone:       (f.get('phone') || '').toString().trim() || null,
      source:      form.dataset.source || 'website',
      days:        (f.get('days')  || '').toString() || null,
      where_train: (f.get('where') || '').toString() || null,
      consent:     !!f.get('consent')
    };
    if (!row.email) return Promise.resolve();
    /* a repeat signup from the same person on the same form is not an
       error, it just means they filled it in twice */
    return sb.from('leads').insert(row).then(null, function () {});
  }

  ['join-form', 'launch-form', 'wait-form', 'build-form'].forEach(function (id) {
    var form = document.getElementById(id);
    if (!form) return;
    /* the challenge form and the event popup name their parts differently,
       so both spellings are accepted rather than one of them silently
       failing to confirm */
    var box  = form.closest('.join') || form.closest('.promo-in')
            || form.closest('.promo') || form.parentNode;
    var pick = function (a, b) { return box.querySelector(a) || box.querySelector(b); };
    var err  = pick('.join-err',   '.launch-err');
    var done = pick('.join-done',  '.launch-thanks');
    var fine = pick('.join-fine',  '.promo-fine');
    var btn  = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (err) err.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = 'One moment'; }

      /* the list first, the email copy second. If the copy fails the
         entry is still saved, which is the way round that matters. */
      save(form)
        .then(function () {
          return fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' }
          });
        })
        .then(function (res) {
          if (res && !res.ok) throw new Error('bad response');
          form.hidden = true;
          if (fine) fine.hidden = true;
          if (done) done.hidden = false;
          if (window.track) window.track('Signup', { source: form.dataset.source || 'website' });
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          if (err) err.hidden = false;
        });
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   BRAND FILES FROM THE ADMIN
   The favicon and the iPhone home-screen icon are swapped live from
   the site_images table, so they can be changed without touching the
   server. The social share image cannot be done this way: Facebook,
   WhatsApp and Instagram read the raw HTML and never run JavaScript,
   so og:image has to be a real URL in the page. It points at a fixed
   address in Supabase storage, which the admin overwrites in place.
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (!window.supabase) return;
  var sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key);
  sb.from('site_images').select('key,url')
    .in('key', ['brand_favicon', 'brand_appicon'])
    .then(function (res) {
      (res.data || []).forEach(function (r) {
        if (!r.url) return;
        var el = document.getElementById(r.key === 'brand_favicon' ? 'fav' : 'appicon');
        if (el) el.href = r.url;
      });
    })
    .catch(function () {});
})();

/* ══════════════════════════════════════════════════════════════
   PROGRAM FINDER
   Three questions, then a recommendation. The matching mirrors how
   the app decides: equipment rules out first, then experience, then
   goal. Nobody is ever told there is nothing for them.
   ══════════════════════════════════════════════════════════════ */
(function () {
  var box = document.querySelector('.finder');
  if (!box) return;

  var steps = box.querySelectorAll('.finder-step');
  var bars = box.querySelectorAll('.finder-bar i');
  var answers = {};

  function show(n) {
    steps.forEach(function (s) { s.classList.toggle('on', +s.dataset.step === n); });
    bars.forEach(function (b, i) { b.classList.toggle('on', i < Math.min(n, 3)); });
    if (n > 1) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  var PROGRAMS = {
    bodyweight: ['Bodyweight Base',
      'No equipment needed. You will build real strength with your own body weight first, which is exactly where everyone should start.'],
    home: ['Home Strength',
      'Built around a pair of dumbbells. Every session works, and you never need to book a squat rack.'],
    foundations: ['Foundations',
      'Three full body sessions a week, six movements, done properly. This is where you learn the lifts before you load them.'],
    twoday: ['Two Day Minimum',
      'A real two day program, not a cut down version of a bigger one. Two sessions you actually do beat four you keep meaning to start.'],
    glute: ['Glute Build',
      'Lower body led, built around hip thrusts, RDLs and split squats. This is the one that changes the shape of your legs and glutes.'],
    lean: ['Define and Sculpt',
      'Full body, higher volume, and it keeps the weight on the bar while your calories come down. You lose fat and keep what is underneath.'],
    strength: ['Strength Block',
      'Fewer reps, heavier bar, longer rests. The number you lift goes up and everything else follows it.']
  };

  function decide(a) {
    // equipment first, because it rules options out entirely
    if (a.kit === 'none') return PROGRAMS.bodyweight;
    if (a.kit === 'db' && a.goal !== 'start') return PROGRAMS.home;
    if (a.goal === 'start') return PROGRAMS.foundations;
    if (a.days === '2') return PROGRAMS.twoday;
    if (a.goal === 'build') return PROGRAMS.glute;
    if (a.goal === 'lean') return PROGRAMS.lean;
    return PROGRAMS.strength;
  }

  box.addEventListener('click', function (e) {
    var opt = e.target.closest('.finder-opts button');
    if (opt) {
      answers[opt.dataset.k] = opt.dataset.v;
      var step = +opt.closest('.finder-step').dataset.step;
      if (step < 3) return show(step + 1);

      var pick = decide(answers);
      document.getElementById('finder-name').textContent = pick[0];
      document.getElementById('finder-why').textContent = pick[1];
      show(4);
      if (window.track) window.track('Finder result', { program: pick[0] });
      return;
    }
    var back = e.target.closest('.finder-back');
    if (back) {
      var s = +back.closest('.finder-step').dataset.step;
      if (s === 4) { answers = {}; show(1); } else { show(s - 1); }
    }
  });
})();

/* ── find your program tab ─────────────────────────────────────
   Hides while the finder is on screen, since pointing at something
   you are already looking at is just noise. Dismissing it lasts for
   the rest of the visit.
   ─────────────────────────────────────────────────────────── */
(function () {
  var tab = document.getElementById('finderTab');
  if (!tab) return;

  var gone = false;
  try { gone = sessionStorage.getItem('alter_finder_tab') === 'off'; } catch (e) {}
  if (gone) { tab.hidden = true; return; }

  tab.querySelector('.x').addEventListener('click', function () {
    tab.hidden = true;
    try { sessionStorage.setItem('alter_finder_tab', 'off'); } catch (e) {}
  });

  /* The tab slides out of the way over anything that runs to the edge of
     the screen. Over the finder because pointing at something you are
     already looking at is noise, and over a rail of photos because a tab
     sitting on top of somebody's body is not acceptable.

     A rail with no photos in it, like the program cards before their
     shots go in, is not a reason to hide. On the homepage that was
     leaving the tab away for most of the page. */
  var clearOf = ['.hero', '#finder', '#tf-swipe'].reduce(function (list, sel) {
    return list.concat([].slice.call(document.querySelectorAll(sel)));
  }, []);
  [].slice.call(document.querySelectorAll('.rail')).forEach(function (r) {
    if (r.querySelector('img')) clearOf.push(r);
  });

  if (clearOf.length) {
    if ('IntersectionObserver' in window) {
      /* a set of what is currently on screen, not a counter. The first
         callback reports every observed element at once, so counting up
         and down cancels the ones that matter out. */
      var showing = [];
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var i = showing.indexOf(e.target);
          if (e.isIntersecting && i < 0) showing.push(e.target);
          if (!e.isIntersecting && i >= 0) showing.splice(i, 1);
        });
        tab.classList.toggle('away', showing.length > 0);
      }, { threshold: 0.2 });
      clearOf.forEach(function (el) { io.observe(el); });
    } else {
      tab.hidden = true;
    }
  }
})();

/* ── sticky join bar ───────────────────────────────────────────
   Hidden over the hero, because the hero already has a call to
   action and the bar would just cover the photograph. It slides up
   once the hero has scrolled past, and on pages with no hero it is
   shown straight away.
   ─────────────────────────────────────────────────────────── */
(function () {
  var bar = document.querySelector('.sticky');
  if (!bar) return;

  var hero = document.querySelector('.hero');
  if (!hero || !('IntersectionObserver' in window)) {
    bar.classList.add('up');
    return;
  }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      // e.isIntersecting is true while any part of the hero is on screen
      bar.classList.toggle('up', !e.isIntersecting);
    });
  }, { threshold: 0 }).observe(hero);
})();

/* One nudge on the finder tab, a moment after the hero has gone by,
   so people notice it once without it fidgeting all the way down. */
(function () {
  var tab = document.getElementById('finderTab');
  if (!tab || tab.hidden) return;
  var done = false;
  window.addEventListener('scroll', function () {
    if (done || window.scrollY < 600) return;
    done = true;
    tab.classList.add('nudge');
    setTimeout(function () { tab.classList.remove('nudge'); }, 1600);
  }, { passive: true });
})();

/* ══════════════════════════════════════════════════════════════
   MACRO CALCULATOR
   Mifflin St Jeor, the same equation the app uses, with the same
   hard floor underneath. The floor matters more than anything else
   here: a public calculator that can hand a woman a dangerously low
   number would undo the reason the app exists.
   ══════════════════════════════════════════════════════════════ */
(function () {
  var form = document.getElementById('calc-form');
  if (!form) return;

  /* ── keeping her numbers ──────────────────────────────────────
     Saved on her own device. No email, no address to hand over, and
     they are still on screen next time she opens the page.
     ───────────────────────────────────────────────────────────── */
  var KEY = 'alter_macros';
  var savedNote = document.getElementById('calcSaved');

  function asText(m) {
    return 'My ALTER YOU numbers\n\n'
      + 'Calories  ' + m.kcal + '\n'
      + 'Protein   ' + m.pro + 'g\n'
      + 'Carbs     ' + m.carb + 'g\n'
      + 'Fat       ' + m.fat + 'g\n\n'
      + 'Goal: ' + m.goal + '\n'
      + 'alteryouapp.com';
  }

  function remember(m) {
    try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {}
    if (savedNote) savedNote.hidden = false;
  }

  function recall() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  /* Put last time's answers and numbers back, together. Restoring the
     numbers on their own left results sitting above an empty form,
     which looked like the page had answered a question nobody asked. */
  (function () {
    var m = recall();
    if (!m || !m.in) return;
    var out = document.getElementById('calc-out');
    if (!out) return;

    function set(id, val) {
      var el = document.getElementById(id);
      if (el && val !== undefined && val !== null && val !== '') el.value = val;
    }
    set('c_age', m.in.age);
    set('c_ht',  m.in.ht);
    set('c_wt',  m.in.wt);
    set('c_act', m.in.act);
    set('c_goal', m.in.goal);

    document.getElementById('c_kcal').textContent = m.kcal;
    document.getElementById('c_pro').textContent  = m.pro + 'g';
    document.getElementById('c_carb').textContent = m.carb + 'g';
    document.getElementById('c_fat').textContent  = m.fat + 'g';
    out.hidden = false;
    if (savedNote) savedNote.hidden = false;
  })();

  var copyBtn = document.getElementById('calcCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var m = recall();
      if (!m) return;
      var label = copyBtn.textContent;
      function done() {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = label; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(asText(m)).then(done, function () {});
      } else {
        /* older browsers still get something they can copy by hand */
        window.prompt('Copy your numbers', asText(m));
      }
    });
  }

  var out = document.getElementById('calc-out');
  var err = form.querySelector('.calc-err');
  var FLOOR = 1400;          // hard minimum, matching the app

  function val(id) { return parseFloat(document.getElementById(id).value); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var age = val('c_age'), ht = val('c_ht'), wt = val('c_wt');
    var act = parseFloat(document.getElementById('c_act').value);
    var goal = document.getElementById('c_goal').value;

    if (!age || !ht || !wt || age < 16 || age > 90 || ht < 120 || wt < 35) {
      err.hidden = false; out.hidden = true; return;
    }
    err.hidden = true;

    // Mifflin St Jeor, female
    var bmr = (10 * wt) + (6.25 * ht) - (5 * age) - 161;
    var tdee = bmr * act;
    var kcal = goal === 'cut' ? tdee - 400 : goal === 'build' ? tdee + 250 : tdee;

    var floored = false;
    if (kcal < FLOOR) { kcal = FLOOR; floored = true; }
    kcal = Math.round(kcal / 10) * 10;

    // protein 1.8g/kg, fat 25% of calories, carbs fill the rest
    var pro = Math.round(wt * 1.8);
    var fat = Math.round((kcal * 0.25) / 9);
    var carb = Math.round((kcal - (pro * 4) - (fat * 9)) / 4);
    if (carb < 50) { carb = 50; }

    document.getElementById('c_kcal').textContent = kcal;
    document.getElementById('c_pro').textContent  = pro + 'g';
    document.getElementById('c_carb').textContent = carb + 'g';
    document.getElementById('c_fat').textContent  = fat + 'g';

    /* Kept on her device rather than emailed. She gets her numbers back
       when she returns, with nothing to sign up for and nothing to lose
       in a spam folder. */
    remember({
      kcal: kcal, pro: pro, carb: carb, fat: fat,
      goal: goal === 'cut' ? 'Lose fat' : goal === 'build' ? 'Build muscle' : 'Maintain',
      /* the answers too, so the form and the numbers always agree */
      in: { age: age, ht: ht, wt: wt, act: act, goal: goal }
    });

    var floorNote = document.getElementById('c_floor');
    if (floored) {
      floorNote.textContent = 'Your numbers came out under ' + FLOOR + ', so I\u2019ve set it '
        + 'at ' + FLOOR + '. Going lower won\u2019t get you there faster, it just costs you '
        + 'the muscle you\u2019re trying to keep.';
      floorNote.hidden = false;
    } else {
      floorNote.hidden = true;
    }

    out.hidden = false;
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.track) window.track('Calculator result', { goal: goal });
  });
})();

/* ── rails that drift ──────────────────────────────────────────
   The app screens and the transformations both scroll on their own,
   so those sections move rather than sitting still. Hovering pauses
   it, and an actual touch, drag or wheel stops it for good, because
   a carousel that keeps moving under a finger is worse than one that
   never moved at all.

   Three things fight this and all three are handled below:
     scroll-behavior:smooth  restarts a fresh animation every frame
     scroll-snap-type        yanks the rail back to the nearest card
     scrollLeft              reads back rounded to whole pixels, so a
                             third of a pixel a frame accumulates to
                             nothing unless the position is kept as a
                             float separately
   ─────────────────────────────────────────────────────────── */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function drift(rail, speed) {
    if (!rail) return;
    var done = false, paused = false, raf = null, last = null, pos = 0;

    function finish() {
      done = true;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      rail.classList.remove('drifting');
    }
    ['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach(function (e) {
      rail.addEventListener(e, finish, { passive: true });
    });
    rail.addEventListener('mouseenter', function () { paused = true; });
    rail.addEventListener('mouseleave', function () { paused = false; last = null; });

    function step(t) {
      if (done) return;
      raf = requestAnimationFrame(step);
      if (paused) { last = t; return; }
      if (last === null) { last = t; pos = rail.scrollLeft; return; }
      var dt = (t - last) / 1000; last = t;
      var max = rail.scrollWidth - rail.clientWidth;
      if (max <= 0) return;
      pos += speed * dt;
      if (pos >= max) pos = 0;
      rail.scrollLeft = pos;
    }
    function start() {
      if (done || raf !== null) return;
      rail.classList.add('drifting');
      last = null; raf = requestAnimationFrame(step);
    }
    function halt() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      rail.classList.remove('drifting');
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : halt(); });
      }, { threshold: 0.2 }).observe(rail);
    } else { start(); }
  }

  drift(document.querySelector('.rail.cols-5'), 20);   // app screens
  drift(document.querySelector('#tf-swipe'), 16);      // transformations
})();

/* ── back to top ───────────────────────────────────────────────
   Shows once you are two screens down, which is far enough that
   scrolling back by hand is a nuisance. Respects reduced motion by
   jumping rather than animating.
   ─────────────────────────────────────────────────────────── */
(function () {
  var btn = document.getElementById('toTop');
  if (!btn) return;

  var shown = false;
  function check() {
    var want = window.scrollY > window.innerHeight * 2;
    if (want !== shown) { shown = want; btn.classList.toggle('show', want); }
  }
  window.addEventListener('scroll', check, { passive: true });
  check();

  btn.addEventListener('click', function () {
    var smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  });
})();

/* ══════════════════════════════════════════════════════════════
   BLOG
   The list on blog.html and the article on post.html both come from
   the posts table. Each card carries the article's id in the link,
   so clicking one opens that article rather than always the first.
   What is already in the page is the fallback, and it is only
   replaced once rows come back.
   ══════════════════════════════════════════════════════════════ */
(function () {
  if (!window.supabase || !window.ALTER_SUPABASE) return;
  var sb = window.supabase.createClient(window.ALTER_SUPABASE.url, window.ALTER_SUPABASE.key);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function nice(d) {
    var t = new Date(d);
    return isNaN(t) ? '' : t.toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });
  }
  /* the admin's format: blank line is a paragraph, ## a heading,
     > a pull quote, **bold** inline */
  function body(text) {
    return String(text || '').split(/\n\s*\n/).map(function (b) {
      b = b.trim(); if (!b) return '';
      var safe = esc(b).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (b.indexOf('## ') === 0) return '<h2>' + safe.slice(3) + '</h2>';
      if (b.indexOf('> ')  === 0) return '<blockquote class="pull">' + safe.slice(2) + '</blockquote>';
      return '<p>' + safe.replace(/\n/g, '<br>') + '</p>';
    }).join('\n');
  }

  /* ── the list ── */
  var list = document.getElementById('postList');
  if (list) {
    var original = list.innerHTML;
    sb.from('posts').select('*').eq('published', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(function (r) {
        var rows = (r.data || []).filter(function (p) { return p.title; });
        if (!rows.length) { (window.ALTER_LIST_READY || function () {})(); return; }
        var ready = window.ALTER_LIST_READY || function () {};
        list.innerHTML = rows.map(function (p) {
          /* The cards are text only now. A post can still carry a
             cover_url for its own article page, it just is not shown
             on the list. Put `img +` back after the opening tag below
             to bring the photos back. */
          var cat = p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : '';
          return '<a class="post-card" href="post.html?id=' + encodeURIComponent(p.id) + '">'
               + '<div class="body">'
               + (cat ? '<span class="post-cat">' + esc(cat) + '</span>' : '')
               + '<h3>' + esc(p.title) + '</h3>'
               + (p.excerpt ? '<p>' + esc(p.excerpt) + '</p>' : '')
               + (p.read_time ? '<span class="post-read">' + esc(p.read_time) + '</span>' : '')
               + '</div></a>';
        }).join('');
        ready();
      })
      .catch(function () {
        list.innerHTML = original;
        (window.ALTER_LIST_READY || function () {})();
      });
  }

  /* ── one article ── */
  var bodyEl = document.getElementById('aBody');
  if (bodyEl) {
    /* post.html holds itself back inline from the first paint, so all that
       is needed here is to release it once we know which article this is */
    var reveal = window.ALTER_REVEAL || function () {};

    var id = new URLSearchParams(location.search).get('id');
    var q = sb.from('posts').select('*').eq('published', true);
    q = id ? q.eq('id', id) : q.order('featured', { ascending: false }).limit(1);
    q.then(function (r) {
      var p = (r.data || [])[0];
      if (!p || !p.title) { reveal(); return; }   // keep the article in the page
      var set = function (el, v) { var n = document.getElementById(el); if (n && v) n.textContent = v; };
      set('aTitle', p.title);
      set('aCat', p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : '');
      set('aRead', p.read_time);
      set('aDate', nice(p.created_at));
      if (p.body) bodyEl.innerHTML = body(p.body);
      var cover = document.getElementById('aCover');
      if (cover && p.cover_url) {
        cover.innerHTML = '<div class="ph has-photo"><img src="' + esc(p.cover_url) + '" alt=""></div>';
      }
      document.title = p.title + ' | ALTER YOU';
    }).then(reveal).catch(reveal);
  }
})();

/* ── programs page filters ─────────────────────────────────────
   Filtering happens in the page rather than by reloading, so it
   stays instant. Everything is in the markup, so it all still
   works and is all still indexed if the script never runs.
   ─────────────────────────────────────────────────────────── */
(function () {
  var bar = document.getElementById('progFilters');
  var list = document.getElementById('progList');
  if (!bar || !list) return;
  var none = document.getElementById('progNone');
  var cards = [].slice.call(list.querySelectorAll('.pcard'));

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('.pf');
    if (!btn) return;
    bar.querySelectorAll('.pf').forEach(function (b) { b.classList.toggle('on', b === btn); });

    var f = btn.dataset.f;
    var shown = 0;
    cards.forEach(function (c) {
      var ok = f === 'all' || (' ' + c.dataset.tags + ' ').indexOf(' ' + f + ' ') > -1;
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (none) none.hidden = shown > 0;
    if (window.track) window.track('Programs filter', { filter: f });
  });
})();

/* ── the offer bar countdown ───────────────────────────────────
   The campaign has three moments, so the bar has three states and
   moves through them on its own:

     until 19 Sept   the launch event
     19 to 27 Sept   doors closing, which is the deadline that
                     actually decides whether someone signs up
     27 to 28 Sept   starts Monday
     after           the bar removes itself

   Doing it here rather than by hand means nobody has to remember
   to change the wording on the morning of the 19th.
   ─────────────────────────────────────────────────────────── */
(function () {
  var bar = document.getElementById('offerBar');
  var out = document.getElementById('barCount');
  var lab = document.getElementById('barLabel');
  if (!bar || !out) return;

  var close = new Date(bar.dataset.doors);
  var start = new Date(bar.dataset.starts);
  var launch = bar.dataset.launch ? new Date(bar.dataset.launch) : null;
  if (isNaN(close) || isNaN(start)) return;
  if (launch && isNaN(launch)) launch = null;

  function left(ms) {
    var d = Math.floor(ms / 864e5);
    var h = Math.floor(ms / 36e5) % 24;
    var m = Math.floor(ms / 6e4) % 60;
    var s = Math.floor(ms / 1000) % 60;
    return d > 0 ? d + 'd ' + h + 'h ' + m + 'm ' + s + 's'
         : h > 0 ? h + 'h ' + m + 'm ' + s + 's'
                 : m + 'm ' + s + 's';
  }

  var cta = bar.querySelector('.bar-cta');

  function pointAtShred() {
    if (!cta) return;
    cta.removeAttribute('data-open');
    cta.setAttribute('href', 'shred.html#join');
    cta.textContent = 'Get the app';
  }

  /* Before the app is out there is nothing to download, so the bar sends
     people to the app waitlist instead. If this page carries the popup
     it opens in place, otherwise the homepage opens it on arrival from
     the hash. */
  function pointAtWaitlist() {
    if (!cta) return;
    if (document.getElementById('waitpop')) {
      cta.setAttribute('href', '#waitpop');
      cta.setAttribute('data-open', 'waitpop');
    } else {
      cta.removeAttribute('data-open');
      cta.setAttribute('href', 'index.html#waitpop');
    }
    cta.textContent = 'Join the waitlist';
  }

  function tick() {
    var now = new Date();
    if (launch && now < launch) {
      if (lab) lab.textContent = 'ALTER YOU launches';
      out.textContent = left(launch - now);
      bar.classList.remove('is-urgent');
      pointAtWaitlist();
    } else if (now < close) {
      if (lab) lab.textContent = 'Summer Shred \u00b7 save 43%';
      out.textContent = left(close - now);
      bar.classList.add('is-urgent');
      pointAtShred();
    } else if (now < start) {
      if (lab) lab.textContent = 'Summer Shred starts Monday';
      out.textContent = left(start - now);
      bar.classList.add('is-urgent');
      pointAtShred();
    } else {
      /* the challenge has started, so the bar has nothing left to say */
      bar.hidden = true;
    }
  }
  tick();
  setInterval(tick, 1000);
})();

/* ── the countdown on the challenge page ───────────────────────
   Four boxes, ticking. It counts to doors closing, then to the
   Monday, then says the challenge has started, so it never shows
   a stale deadline.
   ─────────────────────────────────────────────────────────── */
(function () {
  var box = document.getElementById('shredCount');
  if (!box) return;
  var note  = document.getElementById('shredCountNote');
  var close = new Date(box.dataset.doors);
  var start = new Date(box.dataset.starts);
  if (isNaN(close) || isNaN(start)) return;

  var cells = {};
  ['d','h','m','s'].forEach(function (k) {
    cells[k] = box.querySelector('[data-cd="' + k + '"]');
  });
  var pad = function (n) { return n < 10 ? '0' + n : String(n); };

  function put(el, v) {
    if (!el || el.textContent === v) return;
    el.textContent = v;
    /* a small nudge on change, so the thing looks alive without
       drawing the eye away from the form underneath it */
    el.classList.remove('flip');
    void el.offsetWidth;
    el.classList.add('flip');
  }

  function tick() {
    var now = new Date();
    var target = now < close ? close : start;

    if (now >= start) {
      box.hidden = true;
      if (note) note.textContent = 'Summer Shred has started';
      return;
    }
    if (now >= close && note) note.textContent = 'until we start on Monday';

    var left = target - now;
    put(cells.d, pad(Math.floor(left / 864e5)));
    put(cells.h, pad(Math.floor(left / 36e5) % 24));
    put(cells.m, pad(Math.floor(left / 6e4) % 60));
    put(cells.s, pad(Math.floor(left / 1000) % 60));
  }
  tick();
  setInterval(tick, 1000);
})();

/* ── numbers that count up ─────────────────────────────────────
   Stat numbers roll from zero the first time they come into view.
   The prefix and suffix are kept, so "600+" and "$10" still read
   correctly, and anything that is not a number is left alone.

   It runs once per number, and not at all if the person has asked
   for less motion.
   ─────────────────────────────────────────────────────────── */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;

  var targets = [].slice.call(document.querySelectorAll('.stats .stat b, .led-row b, .ct-nums b, .perk .pc'));
  if (!targets.length) return;

  targets.forEach(function (el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
    if (!m) return;                       // nothing numeric, leave it
    el.dataset.pre = m[1];
    el.dataset.num = m[2].replace(/,/g, '');
    el.dataset.post = m[3];
    el.dataset.dec = (m[2].split('.')[1] || '').length;
  });

  function fmt(el, v) {
    var d = +el.dataset.dec;
    var s = d ? v.toFixed(d) : String(Math.round(v));
    if (Math.abs(v) >= 1000) s = (+s).toLocaleString('en-AU', {
      minimumFractionDigits: d, maximumFractionDigits: d
    });
    return el.dataset.pre + s + el.dataset.post;
  }

  function run(el) {
    var end = parseFloat(el.dataset.num);
    if (isNaN(end)) return;
    var dur = 1100, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      /* eases out, so it slows into the real number rather than
         stopping dead on it */
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, end * e);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(el, end);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      if (e.target.dataset.num) run(e.target);
    });
  }, { threshold: 0.4 });

  targets.forEach(function (el) { if (el.dataset.num) io.observe(el); });
})();

/* ── the App Store link, in one place ──────────────────────────
   Every download button and every price card carries data-appstore.
   Setting the URL below points all of them at once, rather than
   hunting through the pages for hrefs.

   Until it is set they scroll to the join form instead of going
   nowhere, so nothing on the site is a dead link.
   ─────────────────────────────────────────────────────────── */
window.ALTER_APP_STORE = '';   // <- paste the App Store link here

(function () {
  var url = (window.ALTER_APP_STORE || '').trim();
  var links = document.querySelectorAll('[data-appstore]');
  if (!links.length) return;

  var wait = document.getElementById('waitpop');

  links.forEach(function (a) {
    if (url) {
      a.href = url;
      a.setAttribute('rel', 'noopener');
      return;
    }

    /* No App Store link yet, so every download button becomes a waitlist
       button. If this page carries the popup it opens in place. If it
       does not, the homepage one opens itself from the hash on arrival.
       Either way nobody is sent to a download that does not exist. */
    if (wait) {
      a.href = '#waitpop';
      a.setAttribute('data-open', 'waitpop');
    } else {
      a.removeAttribute('data-open');
      a.href = 'index.html#waitpop';
    }
    if (/download|app store|get the app|days free/i.test(a.textContent)) {
      a.textContent = 'Join the waitlist';
    }
  });
})();

/* ── choosing a plan ───────────────────────────────────────────
   Both start unselected. Picking one lights it up and turns the
   button underneath into a real link with the choice in the
   label, so the section behaves like a choice rather than looking
   like one.

   Keyboard works too: arrows move between them, space picks.
   ─────────────────────────────────────────────────────────── */
(function () {
  var group = document.querySelector('.compare[role="radiogroup"]');
  var go = document.getElementById('planGo');
  if (!group || !go) return;

  var cards = [].slice.call(group.querySelectorAll('.cmp'));
  var LABEL = { monthly: 'Continue with monthly', annual: 'Continue with annual' };

  function select(card) {
    cards.forEach(function (c) {
      var on = c === card;
      c.classList.toggle('on', on);
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.tabIndex = on ? 0 : -1;
    });
    go.textContent = LABEL[card.dataset.plan] || 'Continue';
    go.removeAttribute('aria-disabled');
    go.classList.add('ready');
    if (window.track) window.track('Plan chosen', { plan: card.dataset.plan });
  }

  cards.forEach(function (c, i) {
    c.tabIndex = i === 0 ? 0 : -1;
    c.addEventListener('click', function () { select(c); });
    c.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); select(c); return; }
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
            : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = cards[(i + d + cards.length) % cards.length];
      next.focus(); select(next);
    });
  });

  /* nothing is picked yet, so the button says so rather than
     pretending to be ready */
  go.addEventListener('click', function (e) {
    if (go.getAttribute('aria-disabled') !== 'true') return;
    e.preventDefault();
    group.scrollIntoView({ behavior: 'smooth', block: 'center' });
    cards[0].focus();
  });
})();

/* ── a calendar reminder ───────────────────────────────────────
   An email can be missed. A calendar entry cannot, and it works
   on every phone without asking anyone for notification
   permission, which iOS does not grant a website anyway unless it
   has been added to the home screen first.

   The file is built here rather than fetched, so it works even if
   the site is being read offline.
   ─────────────────────────────────────────────────────────── */
(function () {
  var btn = document.getElementById('waitRemind');
  if (!btn) return;

  function ics() {
    var stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ALTER YOU//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:alteryou-launch-2026@alteryouapp.com',
      'DTSTAMP:' + stamp,
      'DTSTART;TZID=Australia/Brisbane:20260919T090000',
      'DTEND;TZID=Australia/Brisbane:20260919T103000',
      'SUMMARY:ALTER YOU is live',
      'DESCRIPTION:ALTER YOU is live. Summer Shred'
        + ' doors close 27 September and the twelve weeks start Monday 28'
        + ' September.',
      'URL:https://alteryouapp.com',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:ALTER YOU is live today',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  btn.addEventListener('click', function () {
    var blob = new Blob([ics()], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alter-you-launch.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    btn.textContent = 'Added to your calendar';
    btn.disabled = true;
    if (window.track) window.track('Waitlist reminder added');
  });
})();

/* ══════════════════════════════════════════════════════════════
   HOME HERO, ONE PHOTO AT A TIME
   The photos are stacked in the same grid cell and CSS fades
   whichever one carries "on". This just moves that class along.
   Nothing happens unless the hero is the .solo kind, so the four
   photo grid and the two up version are untouched.
   ══════════════════════════════════════════════════════════════ */
(function () {
  var bg = document.querySelector('.hero-bg.solo');
  if (!bg) return;

  var shots = bg.querySelectorAll('.ph');
  if (shots.length < 2) return;

  /* someone who has asked for less movement gets the first photo and
     nothing else, which is what the stylesheet already shows them */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var i = 0;
  var timer = setInterval(function () {
    shots[i].classList.remove('on');
    i = (i + 1) % shots.length;
    shots[i].classList.add('on');
  }, 2000);

  /* a background tab should not keep cycling photos nobody is looking at */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(timer);
    } else {
      timer = setInterval(function () {
        shots[i].classList.remove('on');
        i = (i + 1) % shots.length;
        shots[i].classList.add('on');
      }, 2000);
    }
  });
})();
