# blooshoo

Personal SvelteKit site for blooshoo: blog posts, projects, contact messages, animated canvas scenes, and a private administration panel.

## Security fixes — 2026-08-07 (pre-deploy cleanup)

- **Stored XSS (critical):** `sanitize-html` bumped 2.17.3 → 2.17.6. The `<xmp>` raw-text passthrough
  (GHSA-rpr9-rxv7-x643) was verified fixed against this app's exact sanitizer config.
- **Session forgery:** `docker-compose.yml` no longer ships default `AUTH_SECRET`/`POSTGRES_PASSWORD`
  fallbacks — both are required (`${VAR:?}`), with `.env.example` + secret-generation notes.
- **Admin gate:** everything under `/bloo` is admin-only (layout load + hooks-level non-GET gate + upload endpoint).
- **Auth:** Discord-only. Email/password login, change-password page, and `users.password_hash` removed;
  `better-auth` 1.6.9 → 1.6.26; `@better-auth/drizzle-adapter` now an explicit dependency.
- **Discord access:** the owner Discord ID `274013941821341696` is permanently protected. The owner can
  add/remove other Discord IDs from `/bloo/users`; removal revokes active sessions but keeps the profile.
- **Posts:** the editor auto-generates a URL slug from the title, derives blank excerpts from the body,
  and inserts uploaded images directly from the Media library.
- **Uploads:** server-side magic-byte sniffing; SVG uploads no longer accepted; admin-only.
- **Contact bot canary:** hidden honeypot/agent-test submissions are quietly discarded and counted on
  the admin dashboard without retaining their submitted content. The existing per-IP limiter bounds
  how quickly a single source can increase the counter.
- **Leftovers:** `blooshoo.db`, `theissue.md`, `nul`, `_shot.mjs`, and the mangled `C:Users…` dir moved to
  `.trash-2026-08-07/` (delete that folder once you've confirmed nothing was wanted).

## Development

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Useful commands:

```sh
npm run check
npm test          # Vitest unit tests
npm run test:e2e  # Playwright; starts the Docker stack unless TEST_URL is set
npm run build
npm run preview
```

The application requires its database and authentication environment variables. Copy
`.env.example` to `.env.local` and fill in `AUTH_SECRET` (generate with
`openssl rand -base64 32`) and `POSTGRES_PASSWORD` — `docker compose up` refuses to
start without them (no default secrets). Sign-in is Discord-only.

## Known issues and future work

These findings came from a source review, Svelte's checker, and rendered desktop/mobile testing in July 2026. They are documented here for whenever webpage motivation returns. :D

### High priority — authentication and permissions

- [x] **Make missing environment variables fail clearly instead of crashing unexpectedly.**
  - Fixed 2026-08-07: `src/lib/server/env.ts` adds a `requireEnv()` helper; `AUTH_SECRET` and `DATABASE_URL` are validated at boot (missing / too short / known-insecure-default all fail loudly), and `ALLOWED_DISCORD_IDS` is guarded with a safe default (no configured non-owner IDs are accepted).

- [x] **Repair the email/password login flow.**
  - Resolved 2026-08-07 by removal: auth is now **Discord-only**. The email/password path was dead code (session cookie never forwarded) with two competing password stores. The login form/action, the change-password page, and `users.password_hash` (column dropped in `drizzle/0001`) are gone; `bcryptjs` removed. Users are created automatically on first Discord sign-in; the first user becomes admin.

- [x] **Define and enforce contributor permissions.**
  - Resolved 2026-08-07: everything under `/bloo` is **admin-only**. The layout load redirects non-admins, `hooks.server.ts` rejects non-GET requests under `/bloo` from non-admins, and the media upload endpoint (`/api/media/upload`) enforces admin too. The `contributor` role remains in the schema for future use but grants no panel access today.

- [x] **Make the Discord allowlist a revocation list.**
  - Fixed 2026-08-08: `discord_allowlist` is the database-backed source of truth after its one-time bootstrap from
    `ALLOWED_DISCORD_IDS`; the owner can manage IDs from `/bloo/users`.
  - New Discord sign-ins and existing sessions are checked against the table, and removing an ID revokes its active sessions.

### High priority — public behavior

- [x] **Turn post-save failures into actionable form errors.**
  - Fixed 2026-08-08: post slugs are normalized and checked before insert/update; duplicate slugs return a 400 with the form intact, while database failures return a clear temporary-unavailability message instead of an unhandled 500 page. The editor now shows a saving state and preserves progressive-enhancement feedback.

- [x] **Stop `/bloochat` from being classified as an admin route.**
  - Fixed 2026-08-07: root layout now matches `=== '/bloo' || startsWith('/bloo/')`.

- [x] **Make the contact math challenge server-verifiable.**
  - Fixed 2026-10-29: the page gets the two numbers plus an HMAC-signed token (keyed from `AUTH_SECRET`) carrying the
    answer, a 30-minute expiry, and a nonce (`src/lib/server/contact-challenge.ts`). Tokens are single-use — right or
    wrong — so one token can't brute-force the answer; a failed submit returns a fresh challenge.
  - The honeypot and rate limiter remain as separate layers.

### Medium priority — data validation

- [x] **Resolve the `collab` project owner-type mismatch.**
  - Fixed 2026-10-29: `collab` is now a real owner type in the schema and validator (the column is plain text, so no
    migration). Featured `collab` projects show on the homepage alongside `mine`.

- [x] **Validate project links by shape, not merely as JSON.**
  - Fixed 2026-10-29: `parseProjectForm()` in `src/lib/server/project-utils.ts` validates links with a strict Zod
    schema (`label` + absolute `http`/`https`/`mailto` `url`, no extra fields, max 20) and names the offending link.
  - The project actions accept anything that `JSON.parse()` accepts.
  - Public components expect an array of `{ label: string, url: string }` objects; valid JSON such as `{}` can therefore break rendering.
  - Use a Zod array schema, validate allowed URL protocols, and reject unexpected fields/types.

- [x] **Make stored JSON parsing fault-tolerant.**
  - Several public/admin loaders directly parse post tags and project links.
  - One malformed database value can currently return a 500 for an entire page.
  - Prefer validated structured columns in the future, or use a shared safe parser with a sensible fallback and logging.
  - Post tags fixed 2026-08-08 with a shared safe parser; project links fixed 2026-10-29 with `parseProjectLinks()`,
    which drops and logs invalid entries. The homepage now uses the safe tag parser too.

- [x] **Validate project form enums rather than casting arbitrary strings.**
  - Fixed 2026-10-29: unknown category/owner-type values are rejected with a 400. The category field was free text
    ("Web, Game, Tool") despite the `website | game | mod | other` enum; it is now a select, and an older project with a
    legacy category is asked to pick a new one instead of silently getting reassigned.

### Medium priority — error pages, motion, and accessibility

- [x] **Show the intended custom error messages.**
  - Fixed 2026-10-29: SvelteKit's generic messages ("Not Found", "Internal Error", …) get the friendly copy; a message
    deliberately passed to `error()`, like "Project not found", still wins.

- [x] **Run only one background scene on error pages.**
  - Fixed 2026-10-29: the root layout skips `CanvasBackground` when `$page.error` is set.
  - The public root layout mounts `CanvasBackground`, and the error page mounts a second status-specific canvas.
  - Avoid running and painting both animations simultaneously.

- [x] **Honor `prefers-reduced-motion` in error scenes.**
  - Fixed 2026-10-29: under reduced motion the scene is fast-forwarded and painted as a single still frame (and it
    reacts if the preference changes while the page is open).
  - The main public canvas already stops under reduced motion.
  - Apply the same behavior to the 403/404/500/503 animation loop.

- [x] **Restore a visible keyboard focus treatment.**
  - Shared buttons and inputs remove the default outline without providing an equally visible replacement.
  - Fixed 2026-08-08: shared controls now use a consistent teal focus-visible outline.

- [x] **Improve small-control accessibility.**
  - Give the scene-picker trigger a larger touch target and appropriate menu/button semantics.
  - Fixed 2026-08-08: mobile navigation now has `aria-expanded`/`aria-controls`, an updated label, and a larger touch target; rich-text toolbar buttons now have accessible names.
  - Fixed 2026-10-29: the scene picker trigger is a real `<button>` with `aria-haspopup`/`aria-expanded` and a 44px hit
    area (it still looks like one letter); the menu uses `menu`/`menuitemradio` roles, arrow/Home/End navigation, and
    returns focus on Escape.

### Tooling and tests

- [x] **Get `npm run check` clean (errors).**
  - Fixed 2026-08-07: the 3 errors (undefined `DATABASE_URL`, unguarded `ALLOWED_DISCORD_IDS.split()`, undefined Discord credentials) are resolved by `requireEnv()` + guarded env reads. The post/project initial-state warnings were made explicit on 2026-08-08; the remaining `@types/node` warning was fixed 2026-10-29 by adding it as a dev dependency. `npm run check` is now 0 errors, 0 warnings.
  - `@types/node` is missing even though the generated TypeScript configuration references Node types.
  - Svelte warns that `PostForm` and `ProjectForm` state captures only the initial prop value. This may be correct for the current page lifecycle, but should be made explicit or synchronized if those props can change without remounting.

- [ ] **Expand automated coverage around the risky boundaries.**
  - Started 2026-10-29: Vitest unit tests (`npm test`) cover the contact challenge, project form/link validation, and
    post tag parsing; Playwright now covers contact tampering, custom error copy, the single error canvas,
    reduced-motion error scenes, and scene-picker keyboard behavior. Still open below:
  - Environment validation/startup.
  - Discord login success, failure, cookie creation, and sign-out.
  - Admin versus contributor permissions for every mutation.
  - `/bloochat` receiving the public shell.
  - Basic keyboard focus visibility.

- [x] **Make the Playwright test startup contract explicit.**
  - Fixed 2026-10-29: `npm run test:e2e` starts the Docker stack via Playwright's `webServer` (reusing one that's
    already up), or runs against an existing deployment when `TEST_URL` is set. See `playwright.config.ts`.

## Current strengths worth preserving

- Consistent public visual system and reusable admin components.
- Published-post filtering happens on the server.
- Rich blog HTML is sanitized before rendering.
- Contact, login, password, and upload routes already include basic rate limiting.
- Security headers, responsive layouts, reduced motion for the primary canvas, and mobile-aware scene limits are already present.
- The scene system and hidden footer picker are delightful and should survive all responsible adult maintenance.
