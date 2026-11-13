# Portfolio

My personal developer portfolio. It's a fast, static website that introduces me, shows my education and skills, and lists my university and personal projects, pulled automatically from my GitHub repositories.

Built with [Astro](https://astro.build) and TypeScript, with no UI framework and very little JavaScript. New to these tools? [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md) explains every step of how the project was built, in plain language.

## Features

- **Landing page:** name, photo, short intro and a "Currently working on" block, followed by Projects, Education, Skills and Contact. The page scrolls one full-screen section at a time, with a little resistance between sections.
- **Project pages:** `/projects/uni` and `/projects/personal`, each with a grid of repository cards you can filter by programming language.
- **GitHub integration:** public repositories are fetched when the site is built, so visitors never hit GitHub's rate limits.
- Light and dark themes, a responsive layout, keyboard and screen-reader support, respect for reduced-motion settings, and SEO metadata (canonical URLs, Open Graph, sitemap, robots.txt).

## Requirements

- **Node.js ≥ 22.23.4** (Node 24 recommended). Astro refuses to start on older versions; check yours with `node -v`.
- npm (comes with Node).

## Getting started

```bash
npm install     # first time only
npm run dev     # http://localhost:4321, reloads on save
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the final site into `dist/` (fetches GitHub repos) |
| `npm run preview` | Serve the built site locally |
| `npm test` | Run the unit tests (Vitest) |
| `npm run check` | Type-check TypeScript and `.astro` files |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Making it yours

Almost everything personal lives in **`src/config/site.ts`**. Placeholders are marked `TODO(content)`.

- **Name, title, intro, skills, contact links:** edit the matching fields.
- **Education:** fill in the `education` entries (Bachelor's and Master's). An entry with an empty `degree` is hidden.
- **Photo:** add an image at `src/assets/profile.jpg` (`.png`, `.webp` and `.avif` also work). Until then a monogram placeholder is shown.
- **Currently working on:** shows your most recently updated repo by default. Set `currentProject.repo` to pin a specific one, and `currentProject.note` to add a one-line status.
- **Uni vs personal projects:** on GitHub, add the topic **`university`** to a repo to list it under University. All other repos appear under Personal. Forks and archived repos are hidden; use `github.exclude` to hide more and `github.featured` to highlight some.
- **Scroll resistance:** adjust the constants at the top of `src/scripts/sectionScroll.ts`.

## GitHub data and caching

Repositories are fetched from the GitHub REST API only at build time and validated before use. During local development, responses are cached in `.cache/github-repos.json` for one hour. Delete that file to force a refresh. If GitHub can't be reached, the last cached data is used, and pages show a friendly fallback when nothing is available.

Unauthenticated requests are limited to 60 per hour. To raise the limit locally, copy `.env.example` to `.env` and set `GITHUB_TOKEN`. The token is only read at build time and never sent to the browser.

## Project structure

```
src/
├── components/   layout, navigation, page sections, project cards, small UI pieces
├── config/       site.ts: all personal content and settings
├── pages/        one file per URL (index, projects/uni, projects/personal, 404, robots.txt)
├── scripts/      the little browser JavaScript: theme toggle, language filter, section scrolling
├── services/     GitHub API client, filtering/sorting logic and its tests
├── styles/       design tokens (colors, spacing, type) and global styles
└── assets/       images processed at build time (e.g. profile photo)
```

## CI and deployment

On every push and pull request, GitHub Actions (`.github/workflows/ci.yml`) lints, type-checks, tests and builds the project. It does **not** publish the site. The site currently runs on localhost only. When a domain and host are chosen, set `SITE_URL` so canonical links and the sitemap use the real address.

## Documentation

- [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md): step-by-step build history, with beginner explanations and deeper dives.
- [`CLAUDE.md`](CLAUDE.md): project rules and agreed architecture decisions.
