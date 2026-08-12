# Content Guide

How to change what the website says, without touching design or code structure.

Everything lives in **`src/data/`**. Each file is a list of items in plain, readable form. Edit the text between the quote marks, save, and the change appears everywhere that content is used.

> **The one rule:** keep the punctuation. Every entry needs its commas, quote marks and curly braces exactly where they are. If something breaks, the terminal running `npm run dev` will tell you which file and line.

---

## Where each thing lives

| To change… | Edit this file |
|---|---|
| Company name, titles, taglines, email, social links, navigation | `src/data/site.ts` |
| Projects — the portfolio | `src/data/projects.ts` |
| Awards and recognitions | `src/data/awards.ts` |
| Services offered | `src/data/services.ts` |
| Speaking topics, audiences, past events | `src/data/speaking.ts` |
| Testimonials | `src/data/testimonials.ts` |
| Press articles and affiliations | `src/data/press.ts` |
| Photography gallery | `src/data/photography.ts` |
| AI tools in the marquee | `src/data/tools.ts` |
| Career statistics | `src/data/stats.ts` |
| The six-step process | `src/data/process.ts` |
| Biography, manifesto, AI for Creators program | `src/data/about.ts` |
| Privacy policy text | `src/app/privacy/page.tsx` |
| Terms of service text | `src/app/terms/page.tsx` |
| Colors and fonts | `src/app/globals.css` |

---

## Common tasks

### Change the email address or location

`src/data/site.ts` → the `contact` block:

```ts
contact: {
  email: "hello@ricmathis.ai",      // ← change these
  press: "press@ricmathis.ai",
  speaking: "speaking@ricmathis.ai",
  location: "Atlanta, Georgia",
},
```

### Update social media links

Same file, the `socials` list. Each entry has a `label`, a `href` (the URL) and a `handle`. Delete a whole `{ … },` line to remove a platform.

### Add a project

Open `src/data/projects.ts` and copy an existing block. The fields:

| Field | What it does |
|---|---|
| `slug` | The web address: `heartbeat` → `/work/heartbeat`. Lowercase, hyphens, no spaces. |
| `title` | Displayed name |
| `categoryLabel` | The free-text line under the title |
| `categories` | Filter buckets. Must be from the allowed list (your editor will suggest them) |
| `year` | Any text — a year, a range, or a placeholder |
| `status` | One of: `Released`, `In Production`, `In Development`, `Immersive Experience`, `Coming Soon` |
| `logline` | One sentence. Used on cards and in search results. |
| `synopsis` | A list — each string becomes its own paragraph |
| `directorsStatement` | Optional. A first-person note from Ric. |
| `visualDirection` | Optional list of art-direction notes |
| `poster` | Image path, e.g. `"/images/projects/heartbeat/poster.jpg"` |
| `trailer` | Video path, e.g. `"/videos/heartbeat-trailer.mp4"` |
| `credits` | List of `{ role, name }` pairs |
| `press` | List of `{ outlet, title, href }`. Leave off `href` and it shows unlinked. |
| `featured` | `true` puts it on the homepage |

A new project automatically appears on `/work`, in the relevant filters, in the sitemap, and gets its own page with SEO metadata. Nothing else to do.

### Reorder projects

Move the whole block up or down in the list. The order in the file is the order on screen.

### Publish a testimonial

In `src/data/testimonials.ts`, replace the placeholder fields with the real quote, name, position and organization — then change `verified: false` to `verified: true`.

Until `verified` is `true`, the site shows a designed "awaiting copy" panel instead. **Never write a testimonial on someone's behalf.**

### Publish a career statistic

In `src/data/stats.ts`, a figure that has not been confirmed looks like this:

```ts
{
  value: null,
  placeholder: PLACEHOLDER.number,
  label: "Films and Documentaries Produced",
},
```

Replace it with the verified number and delete the placeholder line:

```ts
{
  value: 42,
  label: "Films and Documentaries Produced",
},
```

The counter then animates on scroll. Add `suffix: "+"` for an approximate figure.

### Add a speaking topic

`src/data/speaking.ts` → `speakingTopics`. Each needs a `title`, a `description` and an `audiences` list. It appears on `/speaking` and in the booking form's topic dropdown automatically.

### Add a press article

`src/data/press.ts` → `pressArticles`. Set `category` to one of the values in `mediaCategories` at the top of the file. Leave `href` off and the card renders unlinked rather than as a dead link.

### Add photographs

1. Put the files in `public/images/photography/`
2. Add an entry in `src/data/photography.ts` with the `src` path, a descriptive `alt`, a `caption`, a `category`, and an `orientation` (`portrait`, `landscape` or `square` — this controls the grid layout)

`alt` matters: it is what a screen-reader user hears and what search engines read. Describe what is in the frame.

### Change the navigation

`src/data/site.ts` → the `nav` list. Order in the file is order on screen. Removing a link does **not** delete the page — it just hides it from the menu.

---

## Changing colors or fonts

Open `src/app/globals.css`. The `@theme` block at the top is the whole design system:

```css
--color-canvas:  #0a0a0a;   /* page background */
--color-heading: #f5f5f5;   /* headings */
--color-body:    #e4e4e4;   /* body copy */
--color-accent:  #ec1e21;   /* the accent colour */
```

Change a value there and it updates everywhere — buttons, links, dots, rules, focus rings.

> **If you change a text or accent color, re-check its contrast** against the page background at [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/). Aim for 4.5:1 or better on body text. The current palette clears that everywhere; a lighter grey or a brighter red would not.

Fonts are chosen in `src/app/layout.tsx`. Any font on [Google Fonts](https://fonts.google.com) can be swapped in by changing the import name.

---

## Placeholders you will see

These are intentional. They mark information the site is waiting for rather than guessing at:

| Placeholder | Meaning |
|---|---|
| `[ADD VERIFIED NUMBER]` | A statistic that has not been confirmed |
| `[TESTIMONIAL TO BE PROVIDED]` | Reserved slot for a real endorsement |
| `[ADD DATE]` | An unconfirmed year or date |
| `[TO BE CONFIRMED]` | An unconfirmed detail — usually an organization or credit |

They are all defined in one place (`PLACEHOLDER` in `src/data/site.ts`), so you can search the codebase for any of these strings to find every remaining gap.

See `LAUNCH-CHECKLIST.md` for the full list of what still needs supplying.

---

## Previewing your changes

```bash
npm run dev
```

Open `http://localhost:3000`. Edits appear instantly on save.

Before publishing:

```bash
npm run build
```

If that succeeds, the site is safe to deploy.
