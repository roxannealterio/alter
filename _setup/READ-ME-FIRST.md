# ALTER website — everything, ready to upload

## 1. Where each file goes

Everything sits in one folder. There are no subfolders, and no two files share
a name, so nothing can overwrite anything else.

```
alteryouapp.com/
├── index.html          ← the HOMEPAGE (hero reads "Bikini Build")
├── admin.html          ← the ADMIN (linked from every footer)
├── alter.css           ← styling for every page. Without it the site is plain text.
├── alter.js            ← behaviour for every page. Without it menus and photos fail.
├── features.html
├── challenges.html
├── pricing.html
├── about.html
├── faq.html
├── blog.html
├── post.html
├── privacy.html
├── terms.html
├── support.html
├── check.html          ← diagnostics. Open it once, then delete it.
├── sitemap.xml
└── robots.txt
```

The admin used to live at `alteryouapp.com/admin/`. It is now
`alteryouapp.com/admin.html`, and every footer links to the new address.
**Delete the old `admin/` folder** once the new one is working, so there is no
stale copy sitting there.

Files already on your site that are **not** in this bundle and should be left
alone: `favicon.png`, `icon.png`, `og-image.jpg`, the `results/` folder,
`build.html`, `shred.html`, `glutes.html`, and your old `styles.css`
(those three pages still use it).

## 2. Run the database file once

Open Supabase → SQL Editor → paste in `SITE_IMAGES.sql` → Run.

It registers all 34 photo spots, creates the `site-images` storage bucket and
sets its permissions. It is safe to run more than once: it never overwrites a
photo you have already uploaded.

## 3. Add your photos

Admin → **Website Images**. Every spot is listed, grouped by the page it appears
on, with the shape and rough size it needs. Upload one and it is live on the
site immediately — no republishing.

Start with these four, they do the most work:

| Slot | Where | What it needs |
|---|---|---|
| `hero_bg` | Home | Upright, 1600 × 2000+. Bottom third fairly plain, the headline sits there. |
| `hero_feature` | Home | Second upright photo, shown beside the first on laptops only. |
| `founder` | Home | Upright 4:5 portrait of you. |
| `about_roxy` | About | Upright 4:5. Your name sits over the bottom of it. |

Until a slot has a photo it shows a soft placeholder with the ALTER chevron.
Nothing looks broken while you fill them in.

## 4. Before you go live

### Legal pages: fill in the brackets

`privacy.html` and `terms.html` are thorough drafts written around how ALTER
actually works, in a formal clause structure. They are **not legal advice** and
have not been settled by a solicitor. Health data + a subscription + a prize
competition is exactly the combination worth paying someone to review.

Search each file for `[` and replace:

| Placeholder | Both files | What to put |
|---|---|---|
| `[Legal entity name]` | yes | Your company or trading entity |
| `[ABN]` | yes | Your ABN |
| `[registered address]` | yes | Registered business address |
| `[region]` | privacy | Supabase region, e.g. Sydney (ap-southeast-2) |
| `[countries]` | privacy | Countries your providers operate in, e.g. United States |
| `[Email provider]` | privacy | Whoever sends your transactional email |
| `[period]` | privacy | How long encrypted backups are kept, e.g. 30 days |
| `[14] days` | terms | Winner notification window |

Then delete the grey "Before this goes live" box near the top of each page.

### The rest

- [ ] Submit `sitemap.xml` in Google Search Console, and verify the domain.
- [ ] Add your App Store ID to the commented-out `apple-itunes-app` tag in every
      page's `<head>` once the app is live. That gives iPhone Safari visitors an
      "Open in the App Store" banner.
- [ ] Testimonials on the homepage are a hidden, empty section. Add three real
      quotes with a first name and suburb, delete the word `hidden` from that
      `<section>` tag, and it appears. Do not ship the placeholder text.
- [ ] Get written permission from every woman in the transformation photos.
- [ ] Confirm the timeframe captions on those photos are accurate.

## 5. Things worth knowing

**Programs count.** The site says twelve programs throughout. Your old pages
disagreed with each other (ten in two places, twelve in another). If twelve is
wrong, it is set in one place per page — search for "12 programs".

**Pricing.** $24.99/month, $169.99/year, described as $14.17 a month on the
annual plan. Your old structured data said $169.99 and $24.99, which did not
match the visible price. Fixed everywhere.

**Fonts.** DM Sans for everything, matching the app, and Instrument Serif for the
italic accent lines.
Both load from Google Fonts, already linked in every page.

**Colours.** Taken from your admin's own palette so the site and the app match:
`#45493C` olive for the dark blocks and footer, `#5A6049` for accent type,
`#8A9179` sage for rings and icons, `#F5F2EC` / `#EDE8E0` / `#DDD8CC` for the
backgrounds.

**SEO, what is already in place.** Unique title and meta description on every
page, canonical URLs, Open Graph and Twitter cards, one `h1` per page, and
structured data throughout: Organization, WebSite, SoftwareApplication with real
prices, BreadcrumbList on every inner page, FAQPage on the FAQ, AboutPage and
Person on About, Blog on the blog index, BlogPosting on the article, and Event
for the launch event. Plus `sitemap.xml` and a `robots.txt` that keeps the
admin out of search results.

**SEO, what only you can do.** Verify the domain in Google Search Console and
submit the sitemap. Add your social profiles so I can put them in the
Organization schema as `sameAs`. And write more blog posts, since that is the
only page type on the site that can grow.

**Program finder.** The three-question picker on the homepage lives in
`alter.js`, in the PROGRAM FINDER block. The seven programs it can recommend
are in the `PROGRAMS` object and the matching rules are in `decide()`. Edit
either to change what it suggests.

**Changing something everywhere.** The nav, footer, buttons, colours and type
all live in `alter.css`. Change it once and every page follows.
