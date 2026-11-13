CLAUDE.md — Developer Portfolio

0. Agreed Architecture (decided 2026-11-13; takes precedence over the generic suggestions below)

Status: scaffolded (v1 with placeholder content marked TODO(content) in src/config/site.ts).

Commands (Astro 7 requires Node >= 22.23.4)
- npm run dev            dev server at http://localhost:4321
- npm run build          static build to dist/ (fetches GitHub repos)
- npm run preview        serve dist/
- npm run check          astro check (TypeScript + .astro diagnostics)
- npm run lint           ESLint
- npm run format         Prettier (CLAUDE.md is excluded via .prettierignore)
- npm test               Vitest; single test: npx vitest run -t "<test name>" or npx vitest run src/services/github/repos.test.ts
- Delete .cache/github-repos.json to force a fresh GitHub fetch locally (cache TTL 1h).

Build log (required)
- docs/BUILD_LOG.md records every build step for a reader new to frontend/TypeScript/frameworks. After each significant change, append a numbered step: a plain-language "What & why" plus an optional "Deeper dive" for advanced readers. Update earlier steps if they become inaccurate.

Stack

- Astro (static output), TypeScript strict. No UI framework: client-side interactivity is plain TypeScript in src/scripts/. There is therefore no src/hooks/ directory.
- Plain CSS: design tokens as custom properties in src/styles/tokens.css, plus Astro scoped styles. No Tailwind.
- astro/zod to validate GitHub API responses. Self-hosted fonts via Fontsource.
- Quality: astro check, ESLint (eslint-plugin-astro), Prettier. Vitest for src/services/github (pure filter/sort/mapping logic).

Pages

- /                    landing, one full-screen section per scroll (CSS scroll snapping with scroll-snap-stop: always; html.snap-scroll via BaseLayout's snapScroll prop):
                         hero (name, title, intro, photo from src/assets/profile.*, "currently working on" repo) → projects entry cards (Uni / Personal) → education (bachelor's + master's from site.ts) → skills → contact
- Scroll resistance between landing sections is implemented in src/scripts/sectionScroll.ts (wheel/touch thresholds, springy give, inertia lock); CSS snapping is the no-JS / reduced-motion fallback.
- Landing design should stay sober.
- /projects/uni        filterable (by language) grid of repo cards
- /projects/personal   same layout
- 404 page
- Repo cards link directly to the GitHub repo. No per-project detail pages (may be added later).
- English only.

GitHub data

- Username: mnlrc (in src/config/site.ts).
- Fetched at BUILD time only (GET /users/{username}/repos?type=owner&sort=updated&per_page=100, follow Link pagination). Visitors never call the GitHub API, so there are no runtime loading states for repos.
- Classification: repos with the GitHub topic `university` are uni projects; everything else is personal. Do not hardcode the classification.
- Forks and archived repos excluded by default; additional exclusions and featured repos (shown first on their category page) are listed in src/config/site.ts. GitHub profile pins are not available via REST, hence the config list.
- In CI, use the Actions-provided GITHUB_TOKEN server-side only. Locally, cache responses to .cache/github-repos.json (gitignored) to avoid the 60 req/h unauthenticated limit.
- If the fetch fails in CI, fail the build rather than ship missing projects. Render a designed empty state when there are zero repos.

Deployment

- Not deployed for now: the repo stays named `portfolio` and development happens on localhost. Do not rename the repo or add deployment unless asked.
- .github/workflows/ci.yml only checks (lint, astro check, test, build) on push/PR/manual trigger; it publishes nothing.
- Site URL comes from an environment variable, defaulting to http://localhost:4321. No domain has been chosen yet; Proton DNS setup is deferred until it is.

Design direction

- Editorial / "technical notebook": typography-led, one sans + one monospace (mono for metadata and section labels), neutral palette with a single accent, light/dark following system preference with a manual toggle, thin rules instead of shadows, restrained motion disabled under prefers-reduced-motion. Language indicators always pair a color dot with a text label.

1. Project Overview

This project is a personal developer portfolio website.

The primary goal is to showcase:

Personal profile and professional background.
Technical skills and technologies.
GitHub repositories and open-source contributions.
Selected projects and personal work.
Contact information and professional links.

The application is primarily frontend-focused, with GitHub API integration to dynamically retrieve and display public repositories.

The website will be deployed using a custom domain managed through Proton.

Core Principles
Modern, minimal, and professional design.
Excellent user experience.
Responsive across all screen sizes.
Fast loading and optimized performance.
Accessible and SEO-friendly.
Maintainable and scalable codebase.
Avoid unnecessary complexity and dependencies. 2. Your Role

Act as a senior frontend engineer and UI/UX developer.

When working on this project:

Think about architecture before implementing features.
Follow modern frontend development practices.
Prioritize user experience and visual consistency.
Write clean, readable, and maintainable code.
Avoid overengineering.
Reuse components whenever appropriate.
Explain important technical decisions.
Challenge unnecessary complexity.
Never make assumptions about requirements when clarification is necessary.

Before implementing anything, inspect the existing project structure and understand the current architecture.

Do not rewrite existing functionality unless explicitly requested or technically necessary.

3. Frontend Development Standards
   General
   Prefer functional components.
   Use reusable and composable components.
   Keep components focused on a single responsibility.
   Separate business logic from presentation where appropriate.
   Avoid unnecessary prop drilling.
   Use semantic HTML elements.
   Keep the codebase consistent with existing conventions.
   Styling
   Maintain a consistent design system.
   Use reusable design tokens for colors, spacing, typography, and borders.
   Avoid arbitrary styling values when design tokens are available.
   Ensure consistent spacing and alignment.
   Use responsive layouts.
   Prefer CSS solutions over unnecessary JavaScript-based layout logic.
   Responsive Design

The application must work correctly on:

Mobile phones.
Tablets.
Laptops.
Desktop monitors.
Large displays.

Follow a mobile-first approach.

Never assume that a design that works on desktop will automatically work on mobile.

UI/UX

Prioritize:

Clear visual hierarchy.
Good typography.
Consistent spacing.
Intuitive navigation.
Subtle animations.
Smooth transitions.
Clear interactive states.
Loading and error states.

Avoid:

Excessive animations.
Unnecessary gradients.
Overly complex layouts.
Excessive visual effects.
Generic template-like designs.

The final result should feel like a carefully designed personal developer portfolio rather than a generic landing page.

4. GitHub API Integration

GitHub is the primary external data source.

The portfolio must be able to retrieve and display public repositories belonging to a configurable GitHub username.

Requirements
Store the GitHub username in a centralized configuration.
Fetch public repositories using the GitHub REST API.
Display repository information dynamically.
Do not hardcode repository data.
Handle API errors gracefully.
Display loading states while fetching data.
Handle empty repository responses.
Handle GitHub API rate limits.
Provide a fallback UI if GitHub is temporarily unavailable.
Repository Information

Display relevant information such as:

Repository name.
Description.
Programming language.
Stars.
Forks.
Last updated date.
Repository URL.
Topics, where available.
Repository Filtering and Sorting

Support the ability to:

Exclude forked repositories when appropriate.
Exclude archived repositories when appropriate.
Sort repositories by recently updated.
Highlight selected or pinned projects.
Filter repositories by programming language.
API Best Practices
Use asynchronous requests properly.
Avoid unnecessary API calls.
Cache responses where appropriate.
Avoid fetching the same information repeatedly.
Handle network failures.
Respect GitHub API rate limits.
Keep API integration separate from UI components.

Never expose private credentials or access tokens in frontend code.

Public repositories should be accessible without authentication unless a future requirement justifies authenticated API access.

5. Architecture and Code Organization

Keep the project structure organized and predictable.

Suggested structure (adapt to the existing framework):

text
src/
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── sections/
│   ├── ui/
│   └── projects/
│
├── hooks/
│
├── services/
│   └── github/
│       ├── githubApi.ts
│       └── githubTypes.ts
│
├── config/
│   └── site.ts
│
├── pages/
│
├── styles/
│
├── utils/
│
└── assets/

Architecture Rules
Keep API logic inside services.
Keep reusable UI elements inside components.
Keep shared configuration centralized.
Avoid unnecessary abstractions.
Avoid oversized components.
Separate concerns appropriately.
Use TypeScript types and interfaces where applicable.
Avoid duplicating functionality.

Do not introduce architectural patterns simply for the sake of using them.

6. Design Direction

The portfolio should have a modern, minimalist, and professional appearance.

Design Goals
Clean and elegant layout.
Strong typography.
Well-defined content hierarchy.
Subtle animations.
Carefully selected color palette.
Consistent spacing.
Professional presentation of projects.
Suggested Sections
Hero section
Name.
Professional title.
Short introduction.
Primary call to action.
About section
Professional background.
Interests.
Development philosophy.
Skills section
Programming languages.
Frameworks.
Tools and technologies.
Projects section
Dynamically fetched GitHub repositories.
Featured projects.
Repository statistics.
Links to GitHub.
Contact section
Email.
GitHub.
LinkedIn.
Other professional links.
Footer
Copyright.
Social links.
Minimal navigation.

These sections are suggestions. Adjust them based on the actual project requirements.

7. Performance

Performance is a priority.

Minimize unnecessary dependencies.
Optimize images and assets.
Avoid unnecessary re-renders.
Lazy-load components when appropriate.
Avoid excessive JavaScript.
Optimize API requests.
Use appropriate caching strategies.
Avoid layout shifts.
Keep animations performant.

Aim for strong Core Web Vitals and good Lighthouse scores.

8. Accessibility

Follow WCAG accessibility principles.

Use semantic HTML.
Provide meaningful alt text.
Ensure keyboard navigation works.
Maintain sufficient color contrast.
Provide visible focus states.
Use accessible labels for interactive elements.
Respect reduced-motion preferences.
Do not rely exclusively on color to communicate information. 9. SEO

The portfolio should be discoverable by search engines.

Implement:

Appropriate page titles.
Meta descriptions.
Open Graph metadata.
Social sharing metadata.
Semantic heading structure.
Canonical URL.
Sitemap where appropriate.
Robots.txt.
Structured data where relevant.

The canonical domain must be configurable.

Do not assume the final domain name until it has been provided.

10. Custom Domain and Deployment

The project will use a custom domain managed through Proton.

Requirements
Keep the canonical domain configurable.
Avoid hardcoding domain names across the application.
Use HTTPS.
Ensure correct canonical URLs.
Configure redirects consistently.
Ensure social sharing metadata uses the production domain.
Important

Do not assume Proton is the hosting provider.

Proton may be responsible for domain registration or DNS management, while the actual website hosting may be provided by a separate platform.

When deployment is configured:

Identify the hosting provider.
Document the required DNS records.
Configure the appropriate A, AAAA, or CNAME records depending on hosting requirements.
Verify domain ownership.
Confirm HTTPS functionality.
Verify that both the root domain and www subdomain behave as intended.

Never change DNS records without understanding their impact on existing services, particularly email-related MX, SPF, DKIM, and DMARC records.

Preserve existing Proton Mail DNS configuration.

11. Security
    Never commit secrets.
    Never expose API tokens in client-side code.
    Validate external data before rendering.
    Avoid unsafe HTML injection.
    Keep dependencies updated.
    Follow secure coding practices.
    Do not introduce unnecessary third-party scripts.

Public GitHub API access should be preferred whenever possible.

12. Testing and Quality Assurance

Before considering a feature complete:

Verify that the application builds successfully.
Check for TypeScript errors.
Check for linting errors.
Test responsive layouts.
Verify loading states.
Verify error states.
Test API integration.
Check browser console errors.
Verify keyboard accessibility.

Add tests where they provide meaningful value.

Do not claim that something works without verifying it.

13. Git and Version Control
    Never commit changes unless explicitly requested.
    Never overwrite unrelated user changes.
    Inspect Git status before making potentially destructive changes.
    Keep changes focused.
    Use meaningful commit messages when asked to commit.
    Do not modify project configuration unnecessarily.
14. Working Methodology

For every significant task, follow this workflow:

Step 1 — Understand
Inspect the relevant files.
Understand existing implementation.
Identify dependencies and constraints.
Step 2 — Plan
Define the simplest appropriate solution.
Identify affected components.
Consider responsive behavior.
Consider accessibility and performance.
Step 3 — Implement
Follow existing conventions.
Write maintainable code.
Reuse existing components.
Avoid unrelated modifications.
Step 4 — Verify
Run relevant tests.
Check the build.
Review the implementation.
Fix any regressions.
Step 5 — Summarize

At the end of each significant task, explain:

What was implemented.
Which files were changed.
Any important technical decisions.
Any remaining issues or next steps. 15. Final Guiding Principles

Always prioritize:

User experience over unnecessary technical complexity.
Maintainability over clever implementations.
Performance over unnecessary dependencies.
Accessibility over visual shortcuts.
Consistency over isolated design decisions.
Simplicity over overengineering.

The objective is to build a polished, professional developer portfolio that is visually distinctive, technically sound, fast, accessible, and easy to maintain.
