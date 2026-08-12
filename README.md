# Dr. Ric Mathis — Ric Mathis Ai

The portfolio and business website for **Dr. Ric Mathis**: filmmaker, AI creator, producer and visual storyteller, and founder of **Ric Mathis Ai** in Atlanta, Georgia.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion and Lucide icons.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

Other commands:

```bash
npm run build     # production build
npm start         # serve the production build
npm run lint      # eslint
npx tsc --noEmit  # typecheck
```

Requires **Node.js 20.9+**.

---

## Documentation

Three guides sit alongside this one — start with whichever matches your job:

| Guide | For |
|---|---|
| **[CONTENT-GUIDE.md](./CONTENT-GUIDE.md)** | Changing words, projects, awards, topics. No coding. |
| **[ASSET-CHECKLIST.md](./ASSET-CHECKLIST.md)** | Every image and video the site is waiting on. |
| **[LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md)** | What must be verified or supplied before going live. |

---

## Project structure

```
src/
├── app/                        Routes (App Router)
│   ├── layout.tsx              Root layout — fonts, nav, footer, JSON-LD
│   ├── page.tsx                Homepage
│   ├── globals.css             ★ Design system: colors, type, motion
│   ├── not-found.tsx           Custom 404
│   ├── sitemap.ts              XML sitemap (auto-generated)
│   ├── robots.ts               robots.txt
│   ├── api/inquiry/route.ts    Form endpoint
│   ├── work/                   /work and /work/[slug]
│   ├── ai-films/  photography/  ai-for-creators/
│   ├── services/  about/  awards/  speaking/  media/
│   └── contact/  privacy/  terms/
│
├── data/                       ★ ALL CONTENT LIVES HERE
│   ├── types.ts                Shared TypeScript types
│   ├── site.ts                 Brand, nav, contact, socials
│   ├── projects.ts             The portfolio
│   ├── awards.ts  services.ts  speaking.ts  testimonials.ts
│   ├── press.ts   photography.ts  tools.ts  stats.ts
│   ├── process.ts  about.ts    Bio, manifesto, AI for Creators
│
├── components/
│   ├── layout/                 Nav, Footer, Intro, PageHero, Section
│   ├── ui/                     Primitives: CTA, Frame, Reveal, Field…
│   └── sections/               Page sections composed from the above
│
└── lib/
    ├── seo.ts                  Metadata builders + JSON-LD schemas
    ├── motion.ts               Shared animation presets
    ├── ai-lab.ts               AI Lab generator logic
    ├── icons.ts                Icon name → component map
    └── use-motion-safe.ts      Reduced-motion hook
```

★ = the two files worth knowing about. `src/data/` holds every piece of content; `globals.css` holds every color and type decision.

---

## Design system

All design tokens are defined once, in the `@theme` block at the top of `src/app/globals.css`. Change a value there and the whole site re-themes.

**Color** — near-black ground, greyscale, one vivid red. The palette is sampled from the hero portrait, so the page and the photograph share one light. Every text token is contrast-checked against the ground.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `canvas` | `#0A0A0A` | Page base | — |
| `raised` | `#141414` | Raised surfaces, alternate panels | — |
| `well` | `#1A1A1A` | Cards, image wells, placeholders | — |
| `line` | `#2A2A2A` | Hairline borders, grid gaps | decorative |
| `line-strong` | `#6F6F6F` | Form control boundaries | 3.94:1 ✓ |
| `heading` | `#F5F5F5` | Headings | 18.2:1 ✓ |
| `body` | `#E4E4E4` | Body copy | 15.6:1 ✓ |
| `mute` / `mute-2` | `#B8B8B8` / `#8F8F8F` | Secondary / tertiary text | 10.0:1 / 6.1:1 ✓ |
| `accent` / `accent-deep` | `#EC1E21` / `#B0161A` | Accents, hovers | 4.5:1 ✓ |
| `on-accent` | `#0A0A0A` | Foreground for anything **on** the accent | 4.5:1 ✓ |

Used as Tailwind utilities: `bg-canvas`, `text-heading`, `text-accent`, `border-line`.

Three rules worth keeping:

- **The accent token is named `accent`, not by its colour.** It has been red, then green, then red again; a token named after a colour is a trap the moment that colour changes. Change the hex in `globals.css` and the whole site follows.
- **Never hard-code the foreground on the accent.** Use `text-on-accent`. Which of black/white wins depends on the accent's brightness — on this red black wins at 4.5:1 against white's 4.4:1 — a close call, so re-check whenever the accent moves.
- **Form control underlines use `line-strong`, not `line`.** The underline *is* the control boundary, which WCAG 1.4.11 requires to reach 3:1.

To re-theme, change the values in the `@theme` block of `globals.css` — no component changes needed. If you change the accent, re-check its contrast and which foreground wins on top of it.

**Type** — four families, one job each, all self-hosted by `next/font` (no external requests):

| Utility | Family | Use |
|---|---|---|
| `font-title` | Bebas Neue | Oversized cinematic statements |
| `font-display` | Space Grotesk | Headings, labels, UI |
| `font-sans` | Inter | Body copy |
| `font-editorial` | Cormorant Garamond | Pull quotes |

**Cinematic devices** are CSS utility classes in `globals.css`: `.grain`, `.rec-dot`, `.viewfinder`, `.scanline`, `.rule-track`, `.slow-zoom`, `.marquee-track`, `.ecg-line`, `.tabular`.

---

## Forms

All three forms (contact, workshop registration, speaking booking) POST to `/api/inquiry`, which validates the submission and forwards it to whatever service you configure.

Set **one** environment variable:

```bash
INQUIRY_WEBHOOK_URL=https://formspree.io/f/XXXXXXXX
```

Any endpoint accepting a JSON POST works — Formspree, Zapier, Make, n8n, a Google Apps Script, or your own API.

**Before you set it,** the forms still work and validate, but respond with a plain "not connected to a delivery service yet" message and offer a direct email link. Nothing is silently dropped, and nothing is posted to an endpoint that does not exist.

The endpoint also carries a honeypot field that silently discards bot submissions.

---

## Accessibility

Built in, not bolted on:

- Skip-to-content link, one `<h1>` per page, semantic heading order
- Visible red focus ring on every interactive element (never removed)
- Portfolio, media and gallery filters are labelled button groups with `aria-pressed`, and result counts are announced in live regions
- The photo lightbox is a modal dialog: Escape closes, arrow keys navigate, focus returns to the thumbnail that opened it
- Mobile menu closes on Escape and on navigation, and locks body scroll
- All form controls have real `<label>`s; errors are announced politely
- `prefers-reduced-motion` is respected globally in CSS **and** per-component via `useMotionSafe()` — the intro sequence is skipped entirely, and all decorative motion stands down
- Video player keeps the native `<video>` element, with a captions track slot

---

## Performance

- Static generation for every page; project pages pre-rendered via `generateStaticParams`
- `next/image` everywhere through the `Frame` component, with explicit `sizes` and lazy loading below the fold
- Self-hosted fonts with `display: swap`
- Motion is transform/opacity based; marquees use `will-change` and pause on hover
- Aspect-ratio containers on all media, so there is no layout shift while images load

---

## Deploying to Vercel

1. Push the repository to GitHub, GitLab or Bitbucket.
2. In Vercel, **Add New → Project** and import the repository.
3. Framework preset is detected automatically (Next.js). No build settings to change.
4. Add environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SITE_URL` — the production URL, e.g. `https://ricmathis.ai`
   - `INQUIRY_WEBHOOK_URL` — your form delivery endpoint
   
   Add them to **Production**, **Preview** and **Development**.
5. **Deploy.**
6. Under **Settings → Domains**, add `ricmathis.ai` and follow the DNS instructions.
7. After the domain is live, confirm `NEXT_PUBLIC_SITE_URL` matches it exactly, then redeploy so canonical URLs and the sitemap resolve correctly.
8. Submit `https://ricmathis.ai/sitemap.xml` to Google Search Console.

Deploying elsewhere: the app is a standard Next.js 16 build (`npm run build`, `npm start`) and runs anywhere Node 20.9+ is available.

---

## Connecting a CMS later

The data layer was built to be replaced. Every file in `src/data/` exports plain typed objects, and no component imports content from anywhere else.

To move to Sanity, Contentful, Strapi or similar:

1. Keep the types in `src/data/types.ts` as the contract.
2. Replace the exported constants with async functions that fetch and return the same shapes.
3. Make the consuming page components `async` and `await` them.

No component markup needs to change.

---

## Content honesty

A deliberate constraint runs through this build: **the site does not invent facts about Ric's career.**

- Unverified statistics render `[ADD VERIFIED NUMBER]` rather than a plausible figure — see `src/data/stats.ts`
- Testimonials ship as visible "awaiting copy" panels; no quote is written on a collaborator's behalf — see `src/data/testimonials.ts`
- Awards with an unconfirmed year or issuing body show a placeholder in that slot
- Organizations are listed with the actual relationship and an explicit note that association is not endorsement
- Third-party tools are named as text only, framed as tools in a workflow rather than sponsors

Fill these in as the real information arrives. `LAUNCH-CHECKLIST.md` tracks every one.
