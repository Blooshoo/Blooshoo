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

- [ ] **Make the contact math challenge server-verifiable.**
  - The browser currently submits `num1`, `num2`, and `answer`; the server trusts all three.
  - A bot can bypass it with values such as `0 + 0 = 0`.
  - Store the expected answer server-side or place it in a signed, expiring token.
  - Keep the honeypot and rate limiter as additional layers rather than treating the math question as the only defense.

### Medium priority — data validation

- [ ] **Resolve the `collab` project owner-type mismatch.**
  - `ProjectForm.svelte` offers `mine`, `friend`, and `collab`.
  - The server and Drizzle schema only declare `mine | friend`.
  - Either add `collab` everywhere, including a migration if a database constraint is added, or remove it from the form.

- [ ] **Validate project links by shape, not merely as JSON.**
  - The project actions accept anything that `JSON.parse()` accepts.
  - Public components expect an array of `{ label: string, url: string }` objects; valid JSON such as `{}` can therefore break rendering.
  - Use a Zod array schema, validate allowed URL protocols, and reject unexpected fields/types.

- [ ] **Make stored JSON parsing fault-tolerant.**
  - Several public/admin loaders directly parse post tags and project links.
  - One malformed database value can currently return a 500 for an entire page.
  - Prefer validated structured columns in the future, or use a shared safe parser with a sensible fallback and logging.
  - Post tags fixed 2026-08-08 with a shared safe parser; project links remain on the backlog.

- [ ] **Validate project form enums rather than casting arbitrary strings.**
  - Category and owner-type values are asserted with TypeScript casts, which provide no runtime protection.
  - Normalize or reject unknown form values before inserting them.

### Medium priority — error pages, motion, and accessibility

- [ ] **Show the intended custom error messages.**
  - The error component prefers SvelteKit's default message when it differs from the custom subtitle.
  - A normal missing route therefore renders "Not Found" instead of the custom 404 copy.
  - Decide when a deliberately supplied server error should override the friendly status message.

- [ ] **Run only one background scene on error pages.**
  - The public root layout mounts `CanvasBackground`, and the error page mounts a second status-specific canvas.
  - Avoid running and painting both animations simultaneously.

- [ ] **Honor `prefers-reduced-motion` in error scenes.**
  - The main public canvas already stops under reduced motion.
  - Apply the same behavior to the 403/404/500/503 animation loop.

- [x] **Restore a visible keyboard focus treatment.**
  - Shared buttons and inputs remove the default outline without providing an equally visible replacement.
  - Fixed 2026-08-08: shared controls now use a consistent teal focus-visible outline.

- [ ] **Improve small-control accessibility.**
  - Give the scene-picker trigger a larger touch target and appropriate menu/button semantics.
  - Fixed 2026-08-08: mobile navigation now has `aria-expanded`/`aria-controls`, an updated label, and a larger touch target; rich-text toolbar buttons now have accessible names. The scene picker remains.

### Tooling and tests

- [x] **Get `npm run check` clean (errors).**
  - Fixed 2026-08-07: the 3 errors (undefined `DATABASE_URL`, unguarded `ALLOWED_DISCORD_IDS.split()`, undefined Discord credentials) are resolved by `requireEnv()` + guarded env reads. The post/project initial-state warnings were made explicit on 2026-08-08; one non-blocking `@types/node` dependency warning remains for the next dependency install.
  - `@types/node` is missing even though the generated TypeScript configuration references Node types.
  - Svelte warns that `PostForm` and `ProjectForm` state captures only the initial prop value. This may be correct for the current page lifecycle, but should be made explicit or synchronized if those props can change without remounting.

- [ ] **Expand automated coverage around the risky boundaries.**
  - Environment validation/startup.
  - Discord login success, failure, cookie creation, and sign-out.
  - Admin versus contributor permissions for every mutation.
  - `/bloochat` receiving the public shell.
  - Contact challenge tampering.
  - Malformed project-link/tag JSON.
  - Reduced-motion behavior and basic keyboard focus visibility.

- [ ] **Make the Playwright test startup contract explicit.**
  - The current configuration assumes a Docker deployment is already running at `http://localhost:7777`.
  - Document the command that starts it, or configure Playwright's `webServer` so tests can run consistently in local development and CI.

## Current strengths worth preserving

- Consistent public visual system and reusable admin components.
- Published-post filtering happens on the server.
- Rich blog HTML is sanitized before rendering.
- Contact, login, password, and upload routes already include basic rate limiting.
- Security headers, responsive layouts, reduced motion for the primary canvas, and mobile-aware scene limits are already present.
- The scene system and hidden footer picker are delightful and should survive all responsible adult maintenance.
