# Asset Checklist

Every image and video the site is currently waiting on.

**Nothing here blocks launch.** Any missing file renders a designed placeholder panel that keeps the layout correct and names the asset it is standing in for. Drop the real file in and it takes over.

Folder-level notes also live in a `README.md` inside each `public/` directory.

---

## Priority 1 — highest visual impact

| # | Asset | Path | Spec | Powers |
|---|---|---|---|---|
| 1 | **Primary portrait of Ric** | `public/images/ric-mathis/portrait.jpg` | 4:5 vertical, ≥1200×1500 | Homepage "The Creator", `/about` |
| 2 | **Social sharing image** | `public/images/brand/og-default.jpg` | **1200×630** exactly | Every link preview on social, Slack, iMessage |
| 3 | **Showreel** | `public/videos/showreel.mp4` | H.264, ≤10 MB, 1080p | "Press play on the future" |
| 4 | **Showreel poster** | `public/videos/showreel-poster.jpg` | 16:9, 1920×1080 | Prevents layout shift before play |
| 5 | **Showreel captions** | `public/videos/showreel.vtt` | WebVTT | **Accessibility requirement** |
| 6 | **Project posters ×7** | `public/images/projects/<slug>/poster.jpg` | 4:5 portrait, ≥1000×1250 | Portfolio grid |

**Slugs for #6:** `heartbeat`, `running-for-my-life`, `black-friday`, `b1-the-movie`, `bolegs`, `building-freedom`, `the-widowmaker`

After adding a poster, set `poster: "/images/projects/<slug>/poster.jpg"` on that project in `src/data/projects.ts`.

---

## Priority 2 — completes the main pages

| # | Asset | Path | Spec |
|---|---|---|---|
| 7 | Hero background reel | `public/videos/hero-reel.mp4` | 10–20s loop, muted, no audio track |
| 8 | Hero poster frame | `public/images/brand/hero-poster.jpg` | 1920×1080 |
| 9 | Project hero images ×7 | `public/images/projects/<slug>/hero.jpg` | 21:9 ultrawide, ≥2000px |
| 10 | Photography gallery — 12 images | `public/images/photography/` | See file names below |
| 11 | Speaking photograph | `public/images/speaking/keynote.jpg` | 4:3, Ric on stage |
| 12 | Ric Mathis Ai logo | `public/logos/rma-monogram.svg` | Replaces the interim mark |
| 13 | Favicon | `src/app/favicon.ico` | 32×32 and 16×16 |

**Photography file names** (must match `src/data/photography.ts`):

```
portrait-01.jpg        portrait-02.jpg
drone-atlanta-01.jpg   drone-atlanta-02.jpg
documentary-01.jpg     culture-01.jpg
culture-02.jpg         bts-01.jpg
editorial-01.jpg       events-01.jpg
ai-01.jpg              ai-02.jpg
```

Set each entry's `orientation` to match the real image (`portrait` / `landscape` / `square`) — it controls the masonry span.

---

## Priority 3 — depth and credibility

| # | Asset | Path |
|---|---|---|
| 14 | Project stills ×3 per project | `public/images/projects/<slug>/still-1..3.jpg` (3:2) |
| 15 | Project trailers | `public/videos/<slug>-trailer.mp4` → set `trailer:` in `projects.ts` |
| 16 | Award certificates / ceremony photos | `public/images/awards/` → set `image:` in `awards.ts` |
| 17 | Press article images | `public/images/press/` → set `image:` in `press.ts` |
| 18 | Testimonial portraits | `public/images/press/` → set `portrait:` in `testimonials.ts` |
| 19 | Behind-the-scenes photography | `public/images/ric-mathis/bts-*.jpg` |
| 20 | Ric Mathis Ai wordmark | `public/logos/rma-wordmark.svg` |

---

## Downloadable documents

Two buttons on the site point at files that do not exist yet. Create the folder `public/downloads/` and add:

| File | Linked from |
|---|---|
| `mathis-multimedia-group-media-kit.pdf` | "Download Media Kit" — homepage, `/about` |
| `dr-ric-mathis-speaker-sheet.pdf` | "Download Speaker Sheet" — `/speaking` |

Paths are configured in `downloads` in `src/data/site.ts`.

---

## Export settings

| | |
|---|---|
| **Photographs** | JPEG, long edge ~2000px, quality 80. `next/image` handles responsive sizing and WebP/AVIF conversion. |
| **Posters** | JPEG, ~1600px long edge |
| **Video** | H.264 MP4, AAC audio, 1080p, target ≤10 MB. Compress before committing — large files slow every deploy. |
| **Logos** | SVG preferred. |
| **Captions** | WebVTT (`.vtt`). Auto-generate then correct by hand. |

---

## Rights and permissions

Before adding any file, confirm it can be published:

- ✅ Work created by Ric Mathis or Ric Mathis Ai
- ✅ Work you hold a licence or written release for
- ⚠️ Photographs of identifiable people at private events — check releases
- ❌ **Do not** copy or hotlink images from the current ricmathis.ai site or any third-party site without authorization
- ❌ **Do not** add third-party company logos (AI tools, festivals, publications) without an approved brand asset and written permission — these sections deliberately use text names for that reason
- ❌ **Do not** add award seals or organizational marks without permission

---

## How to verify an asset landed

1. `npm run dev`
2. Visit the page that uses it
3. If you still see a placeholder panel, check that the file path in `src/data/…` matches the actual file name **exactly** — including capitalisation and extension

The placeholder panel prints the expected path underneath it, which is usually enough to spot a typo.
