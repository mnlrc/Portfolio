# Build log

A step-by-step record of how this portfolio was built, written for someone who knows that
HTML, CSS and JavaScript exist but hasn't used frameworks or TypeScript.

Each step has:

- **What & why**: the plain-language explanation.
- **Deeper dive**: optional details for more experienced readers. Skip these freely.

New steps are added at the bottom.

---

## Quick glossary

| Word                     | Meaning                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js**              | A program that runs JavaScript outside the browser. We use it to _build_ the site on your computer, not to run it for visitors.                                                                             |
| **npm**                  | Node's package manager. It downloads code libraries ("packages") other people wrote.                                                                                                                        |
| **Package / dependency** | A library the project uses, listed in `package.json`, downloaded into `node_modules/`.                                                                                                                      |
| **TypeScript (TS)**      | JavaScript plus _types_: labels saying "this is a number", "this is a list of repos". Mistakes get caught before the code runs. Browsers can't read TS directly, so it is converted to JS during the build. |
| **Framework**            | A toolkit that gives structure: how files are organised, how pages are made, how code is reused. We use **Astro**.                                                                                          |
| **Component**            | A reusable piece of a page (a button, a project card) in its own file, used like a custom HTML tag: `<RepoCard />`.                                                                                         |
| **Build**                | Turning the source code into the final plain HTML/CSS/JS files a browser understands (in `dist/`).                                                                                                          |
| **Static site**          | A site made only of pre-built files. No server program runs when someone visits.                                                                                                                            |
| **API**                  | A way for programs to ask another service for data. GitHub's API returns your repos as JSON.                                                                                                                |

---

## Step 1: Project rules (`CLAUDE.md`)

**What & why.** Before writing code we wrote down the goals and rules (clean design, accessibility,
performance, GitHub integration…). `CLAUDE.md` is read by the AI assistant at the start of every
session, so it acts as the project's memory. Section 0 records the decisions we agreed on.

## Step 2: Choosing the architecture

**What & why.** We picked a _static site_ built with **Astro**:

- The site is mostly content, so it doesn't need a server running all the time.
- Your GitHub repos are fetched **once, when the site is built**, not every time someone visits.
  This makes the site fast and avoids GitHub's limit of 60 requests per hour for anonymous visitors.
- The downside: the repo list only updates when you rebuild. You said a manual rebuild is enough.

**Deeper dive.** Astro renders `.astro` components to HTML at build time and ships zero JavaScript
by default. Interactive bits are opt-in `<script>` tags that Vite bundles. We use no UI framework
(React etc.): the only interactivity (theme toggle, language filter, reveal animations) is a few
dozen lines of plain TS. Alternatives considered: a Vite + React single-page app (client-side fetches
hit rate limits and need loading/error states) and Next.js (server features we don't need).

## Step 3: Creating the project and installing tools

**What & why.** `package.json` is the project's ID card: its name, the tools it needs, and
shortcut commands (`npm run dev`, `npm run build`, …). `npm install` downloaded the tools into
`node_modules/` (never edit or commit that folder) and wrote `package-lock.json`, which pins exact
versions so everyone gets the same ones.

What we installed:

| Package                                      | Role                                                               |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `astro`                                      | The framework.                                                     |
| `@astrojs/sitemap`                           | Generates `sitemap-index.xml` so search engines find all pages.    |
| `@fontsource-variable/geist`, `…/geist-mono` | The two fonts, served from our own site (no Google Fonts request). |
| `typescript`, `@astrojs/check`               | Type checking.                                                     |
| `vitest`                                     | Runs automated tests.                                              |
| `eslint` (+ plugins)                         | Spots suspicious code ("linting").                                 |
| `prettier` (+ Astro plugin)                  | Auto-formats code so the style is consistent.                      |

**Deeper dive.** Tools only needed while developing go in `devDependencies` (`npm install -D`).
Astro 7 requires **Node ≥ 22.23.4**; this is declared in `package.json` → `engines`. The machine
this was set up on has 22.22.1, so `astro dev/build/check` refuse to start there until Node is
upgraded. Tests, lint and `tsc` still work.

## Step 4: Configuration files

**What & why.** Small files that tell each tool how to behave:

| File                                  | Purpose                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro.config.mjs`                    | Astro settings. The site's address comes from the `SITE_URL` environment variable, defaulting to `http://localhost:4321`. No domain is hardcoded. |
| `tsconfig.json`                       | TypeScript in _strict_ mode (catches the most mistakes).                                                                                          |
| `eslint.config.js`                    | Lint rules for JS/TS/Astro files.                                                                                                                 |
| `.prettierrc.json`, `.prettierignore` | Formatting rules. `CLAUDE.md` and `README.md` are excluded so they're never reformatted.                                                          |
| `.gitignore`                          | Files Git should never track: `node_modules/`, the build output `dist/`, caches, `.env`.                                                          |
| `.env.example`                        | Documents the optional environment variables (`SITE_URL`, `GITHUB_TOKEN`). Copy to `.env` to use them.                                            |

**Deeper dive.** An _environment variable_ is a setting given to a program from outside its code.
This keeps secrets (like a GitHub token) and per-environment values (like the domain) out of the
source files.

## Step 5: Fetching GitHub repos (`src/services/github/`)

**What & why.** This folder holds all the code that talks to GitHub, kept separate from the visual
components. Four files:

- `githubTypes.ts`: describes what a repo looks like (name, description, stars…).
- `githubApi.ts`: asks GitHub for all public repos of `mnlrc`.
- `repos.ts`: sorting and filtering (hide forks, uni vs personal, newest first…).
- `projects.ts`: combines the above with your settings, ready for the pages.

**How uni vs personal works:** on GitHub, add the _topic_ `university` to a repo (repo page →
⚙ next to "About" → Topics). Tagged repos appear under University; everything else under Personal.

**Deeper dive.**

- **Validation:** GitHub's response is checked with `zod` (bundled with Astro as `astro/zod`).
  Malformed entries are dropped instead of crashing the page. Only the fields we use are kept.
- **Pagination:** GitHub returns at most 100 repos per request. The `Link` response header
  points to the next page, and we follow it.
- **Rate limits:** a 403/429 response with `x-ratelimit-remaining: 0` becomes a clear error
  message with the reset time. An optional `GITHUB_TOKEN` raises the limit; it's read only
  at build time on your machine/CI and never reaches the browser.
- **Caching:** locally, results are saved to `.cache/github-repos.json` for 1 hour, so restarting
  the dev server doesn't spend requests. If GitHub is unreachable, the old cache is used, and a
  "showing cached data" notice appears. With no cache at all, pages show a friendly fallback.
  Delete the file to force a refresh.
- **Memoisation:** all pages share one in-flight request per build (`getRepos` keeps the promise).
- In CI (`process.env.CI`), a failed fetch fails the build on purpose rather than producing a
  site with missing projects.

## Step 6: Automated tests (`repos.test.ts`)

**What & why.** Small programs that check the GitHub logic still works: "forks are hidden",
"uni repos are detected by topic", "pagination follows the next page", "rate limits give a clear
error"… Run them with `npm test`. If one fails after a change, something broke.

**Deeper dive.** Vitest. The network is never hit in tests: `fetchUserRepos` accepts a
`fetchImpl` parameter, so tests pass a fake `fetch` (_dependency injection_). Run one test with
`npx vitest run -t "name of test"`.

## Step 7: Design tokens and global styles (`src/styles/`)

**What & why.** `tokens.css` defines the design's building blocks once, as CSS variables:
colours, font sizes, spacing steps, corner radii, animation speeds. Components use
`var(--space-4)` instead of `16px`, so the look stays consistent and can be changed in one place.
It also defines the **dark theme**: the same variable names with different colours.

`global.css` holds the few styles that apply everywhere: base typography, link style, focus
outline, the `.container` width, and the reduced-motion rules.

**Deeper dive.** Dark mode follows the OS setting (`prefers-color-scheme`) unless the visitor
picks one with the toggle, which sets `data-theme` on `<html>` and remembers it in
`localStorage`. A tiny inline script in `<head>` applies the saved choice _before_ the page paints,
avoiding a flash of the wrong theme. Font sizes use `clamp()` to scale smoothly with screen width.

## Step 8: Components (`src/components/`)

**What & why.** An `.astro` file has up to three parts:

```astro
---
// 1. Code that runs at BUILD time (fetch data, read config). Never sent to the browser.
const title = 'Hello';
---

<!-- 2. HTML, with {curly braces} to insert values -->
<h2>{title}</h2>

<style>
  /* 3. CSS that only affects THIS component */
  h2 {
    color: var(--color-accent);
  }
</style>
```

Folders:

- `layout/`: the page shell (`BaseLayout`: `<head>`, SEO tags, header, footer) and `Section`.
- `navigation/`: the header and menu.
- `sections/`: the big blocks of the landing page (Hero, Projects, Education, Skills, Contact).
- `projects/`: repo cards, the grid with the language filter, the shared projects page.
- `ui/`: small reusable pieces (buttons, language label, theme toggle, profile photo).

**Deeper dive.** Styles in `<style>` are _scoped_ (Astro adds unique attributes), so class names
never clash between components. Props are typed with `interface Props`. Repo cards use a
"stretched link" (a `::after` covering the card) so the whole card is clickable while keeping
one real link for screen readers.

## Step 9: Pages and routing (`src/pages/`)

**What & why.** Astro uses _file-based routing_: each file in `src/pages/` becomes a URL.

| File                      | URL                                                |
| ------------------------- | -------------------------------------------------- |
| `index.astro`             | `/`                                                |
| `projects/uni.astro`      | `/projects/uni`                                    |
| `projects/personal.astro` | `/projects/personal`                               |
| `404.astro`               | shown for unknown URLs                             |
| `robots.txt.ts`           | `/robots.txt` (tells search engines what to crawl) |

The two project pages share one component (`ProjectsPage.astro`) and only pass a different
`category`, so there's no duplicated code.

## Step 10: Small browser scripts (`src/scripts/`)

**What & why.** The only JavaScript sent to visitors:

- `theme.ts`: the light/dark toggle.
- `reveal.ts`: sections fade in gently as you scroll to them.
- `repoFilter.ts`: the "filter by language" buttons on project pages.

**Deeper dive.** All three are _progressive enhancement_: without JavaScript the site still
works. All cards are visible, and the filter bar stays hidden because it would do nothing.
The filter announces results to screen readers through a `role="status"` region, and buttons
use `aria-pressed`. Animations are disabled when the OS asks for reduced motion.

## Step 11: Continuous integration (`.github/workflows/ci.yml`)

**What & why.** When you push to GitHub, GitHub runs this file on its own servers: install,
lint, type-check, test, build. A ✗ on the commit means something is broken. It **does not
publish** the site. Deployment is postponed: you're keeping the repo name `portfolio` and
working on `localhost` for now.

**Deeper dive.** An earlier version deployed to GitHub Pages and assumed the repo would be renamed
to `mnlrc.github.io`. It was replaced by this check-only workflow when that plan was dropped.
CI uses Node 24 and the automatic `GITHUB_TOKEN` (1,000 API requests/hour), which is enough
because the build fetches repos only a few times.

## Step 12: Education section

**What & why.** A new landing-page section listing your degrees as a vertical timeline, with
placeholders for a **Bachelor's** and a **Master's**. Fill them in `src/config/site.ts` →
`education`: degree, institution, start/end years, status (`completed`, `in-progress`,
`planned`) and optional detail lines (specialisation, thesis…). An entry with an empty
`degree` is hidden.

**Deeper dive.** The data has a `Degree` type, so a typo like `status: 'done'` is flagged by
TypeScript. An in-progress degree without an end year shows "present".

## Step 13: Landing page redesign (name, photo, current project)

**What & why.** The first screen now shows, in a deliberately sober layout:

- your **name**, title and short intro, with buttons to the two project pages;
- your **photo**: drop an image at `src/assets/profile.jpg` (or `.png`, `.webp`, `.avif`).
  Until then, a neutral monogram placeholder is shown. Set the alt text in `site.ts` → `photoAlt`;
- a **"Currently working on"** block. By default it shows your most recently updated repo
  automatically. To pin a specific one, set `site.ts` → `currentProject.repo` to its name, and
  optionally add a one-line `note` in your own words.

On phones the photo sits small above the text; on large screens it moves to the right.

**Deeper dive.** `ProfilePhoto.astro` finds the image with `import.meta.glob`, so the build works
whether or not the file exists. With a photo, Astro's `<Image>` produces resized, compressed versions
(several `widths` + `sizes`) with fixed dimensions to avoid layout shift. The current-project logic
is `currentRepo()` in `repos.ts` (unit-tested): the preferred repo if visible, otherwise the
newest visible one.

## Step 14: Section-by-section scrolling

**What & why.** On the landing page each section fills the screen, and scrolling moves you
**one section at a time**: the page "settles" on each section and resists skipping past it.
This uses a built-in CSS feature called _scroll snapping_, with no JavaScript. The header stays
pinned at the top.

**Deeper dive.**

- `BaseLayout` takes a `snapScroll` prop; only `index.astro` sets it, which adds
  `class="snap-scroll"` to `<html>`. Project pages scroll normally.
- `scroll-snap-type: y mandatory` on `<html>`, plus `scroll-snap-align: start` and
  `scroll-snap-stop: always` on each `.snap-section`: the `always` part is the resistance.
  It prevents one fast flick from flying past several sections.
- Sections get `min-height: calc(100dvh - var(--header-height))`. `dvh` accounts for mobile
  browser toolbars. A section taller than the screen can still be scrolled through.
- Accessibility: with "reduced motion" enabled, snapping softens to `proximity` (only snaps
  when you stop near a section). On very short screens (landscape phones), snapping is turned
  off because sections can't fit.
- `scroll-padding-top` keeps anchor links (e.g. `/#contact`) from hiding under the sticky header.

---

## Step 15: Resistance between sections

**What & why.** With CSS snapping alone, one tiny wheel notch was enough to jump to the next
section. Now the page **resists**: a small scroll only makes the page give a little (it shifts a
few pixels) and then springs back. You have to keep scrolling past a threshold (about one and a half
mouse-wheel notches, or a swipe of roughly an eighth of the screen on touch) before it glides
to the next section. Keyboard keys (↓ ↑, Page Up/Down, Space) still move one section per press.

To make it stiffer or looser, change the numbers at the top of `src/scripts/sectionScroll.ts`
(`WHEEL_THRESHOLD`, `TOUCH_THRESHOLD_RATIO`, `MAX_STRETCH`).

Initial values were loosened after first feedback: wheel threshold 220 → 160 px, touch 18% → 13% of
the screen height (minimum 90 → 70 px), maximum give 28 → 22 px.

**Deeper dive.**

- The script only runs when `<html>` has `snap-scroll` (landing page), reduced motion is off and
  the screen is at least 32rem tall. It then adds `snap-js` to `<html>`, which turns off CSS
  snapping so the two don't fight. Without JavaScript, the CSS snapping from step 14 still applies.
- **Wheel:** a non-passive `wheel` listener calls `preventDefault()` and accumulates `deltaY`
  (normalised for line/page `deltaMode`). The sum resets after a 350 ms pause or a direction
  change. Crossing the threshold calls `scrollTo({ behavior: 'smooth' })` on the next section.
- **Trackpad inertia:** after a move, input is swallowed until the wheel has been quiet for
  180 ms, so a single flick can't skip two sections. The move ends on `scrollend`, with a 1 s
  timeout fallback.
- **Touch:** `touchmove` is blocked at section edges and the swipe distance drives the stretch;
  `touchend` decides between moving and springing back.
- **Tall sections:** if the current section is taller than the screen, the script stays out of the way
  until you reach its edge (`canScrollWithin`), so content is never trapped.
- The visual give is a `transform: translateY()` on `<main>` (GPU-friendly, no layout shift).
  Zoom gestures (`ctrlKey`), horizontal scrolls and typing in form fields are ignored.

---

## How to run it (once Node ≥ 22.23.4 is installed)

```bash
npm install        # first time only: download the tools
npm run dev        # start the dev site at http://localhost:4321 (auto-reloads on save)
npm test           # run the automated tests
npm run build      # produce the final site in dist/
npm run preview    # view that final build locally
```
