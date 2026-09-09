# Analytics setup

Everything is already wired in. You just pick a provider and paste one value
into `alter.js`. Until you do, nothing is sent anywhere and the site behaves
exactly as it does now.

## Why not Google Analytics

Two reasons, and they both matter for you specifically.

Your privacy policy says the site uses no tracking cookies and no third-party
advertising networks, and your About page says nobody here is paid to keep you.
Google Analytics sets cookies, is owned by an advertising company, and would
make both of those statements untrue.

It would also mean a consent banner. Cookieless analytics does not, because
there is nothing to consent to.

## Pick one

| | Cost | Custom events | Notes |
|---|---|---|---|
| **Plausible** | ~$9/mo | yes | Easiest to read. What I would choose. |
| **Umami Cloud** | free | yes | Free tier covers 100k events/mo. Slightly clunkier. |
| **Cloudflare** | free | **no** | Page views only. You lose every event below. |

Cloudflare is free but reports page views only, so you would not learn which
button people press. For a launch, the events are the point.

## Switch it on

Open `alter.js` and find this near the bottom:

```js
window.ALTER_ANALYTICS = {
  provider: 'none',
  ...
};
```

**Plausible:** sign up, add `alteryouapp.com` as a site, then set

```js
provider: 'plausible',
domain: 'alteryouapp.com',
```

**Umami:** sign up at cloud.umami.is, add the site, copy the Website ID, then

```js
provider: 'umami',
websiteId: 'paste-the-id-here',
```

**Cloudflare:** add the site under Web Analytics, copy the beacon token, then

```js
provider: 'cloudflare',
token: 'paste-the-token-here',
```

Save, upload `alter.js`, and open the site. Your dashboard should show a visit
within a minute.

## What you will be able to see

Page views on all twelve pages, plus these events:

| Event | Tells you |
|---|---|
| `App Store click` | How many people actually try to download. The number that matters. |
| `Hero CTA` | Whether the Bikini Build button is doing its job. |
| `Hero secondary` | People who want to know more before committing. |
| `Saw pricing` | How many get far enough down to see the price at all. |
| `Start trial, monthly` / `Start trial, annual` | Which plan people reach for. |
| `Sticky bar` | Whether the mobile bar earns its space, or just covers content. |
| `Join, after transformations` | Whether the photos convert. |
| `Swiped transformations` | Whether anyone engages past the first photo. |
| `Opened FAQ` | Records the question. The most-opened one is what your site failed to answer. |
| `Event bar click` / `Event register submit` | The launch event funnel, click through to signup. |

## The two numbers to watch

**Saw pricing vs App Store click.** If lots of people see the price and few
click, the objection is the price or what they get for it. If few people even
reach the pricing section, the problem is higher up the page.

**Most-opened FAQ.** Whatever question people open most is the thing your
homepage should have answered already. Move that answer up the page.

## Tagging something new

Add `data-track="Some name"` to any link or button in the HTML and it is
counted. No JavaScript to edit.

```html
<a class="btn" href="build.html" data-track="Challenge page from footer">Bikini Build</a>
```

## Two things to be careful about

**Never put anything personal in an event.** No names, no email addresses, no
form contents. The FAQ event records the question text, which is fine because
it is text you wrote. Everything else records only the action and the page.

**Privacy policy clause 16 has been updated** to describe cookieless analytics
accurately. Do not switch analytics on with the old wording live, because it
says the site does not do this.
