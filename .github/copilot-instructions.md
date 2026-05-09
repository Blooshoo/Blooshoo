# Blooshoo — Copilot Instructions

Personal website and portfolio — retro pixel / dark aesthetic. **SvelteKit 2 + Svelte 5 + Tailwind CSS v4 + Drizzle ORM + PostgreSQL + better-auth.**

---

## Key Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build (requires env vars — see Dockerfile for placeholders)
npm run check        # svelte-kit sync + svelte-check (type-check everything)
npm run check:watch  # Same, in watch mode
npm run db:push      # Push schema to DB directly (dev only)
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations via drizzle-kit
npm run db:studio    # Open Drizzle Studio UI
```

Docker: `docker compose up -d` (migrates + starts). `docker compose down -v` to wipe volumes.

---

## Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (runes mode) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 — CSS-first, no `tailwind.config.js` |
| Database | PostgreSQL via `postgres` driver + Drizzle ORM |
| Auth | `better-auth` — Discord OAuth + email/password |
| Rich text | Tiptap (StarterKit, Color, TextStyle, Link, Image) |
| Media | BunnyCDN — upload/delete via `$lib/server/bunnycdn.ts` |
| AI | DeepSeek — writing helpers via `$lib/server/deepseek.ts` |
| Migrations | Drizzle migrator — runs on container start from `scripts/migrate.mjs` |

---

## Project Layout

```
src/
  routes/
    layout.css              ← Tailwind v4 entry + all design tokens + component utilities
    +layout.svelte          ← Root layout: CanvasBackground, PublicNav, PublicFooter, Toaster
                              (all three hidden for /bloo/* routes)
    blog/                   ← Public blog listing + [slug]/
    bloo/                   ← Admin panel (auth-guarded)
      +layout.server.ts     ← Auth guard: redirects to /bloo/login if no session
      +layout.svelte        ← AdminSidebar + AdminHeader shell
      posts/, projects/, media/, messages/, users/, change-password/
    capes/, contact/, projects/  ← Public pages
    api/auth/[...all]/      ← better-auth handler (GET + POST)
    api/ai/excerpt|improve|tags/ ← DeepSeek AI endpoints
    api/media/              ← BunnyCDN media API

  lib/
    server/
      auth.ts               ← better-auth instance (Discord + email/password)
      db/
        index.ts            ← exports `db` (drizzle instance)
        schema.ts           ← all table definitions
      bunnycdn.ts
      deepseek.ts
    components/
      layout/               ← AdminHeader, AdminSidebar, PublicNav, PublicFooter
      ui/                   ← CanvasBackground, DataTable, EmptyState, PageHeader,
                               RichTextEditor, ScenePicker, SectionCard, StatCard, StatusBadge
    scenes/                 ← 7 canvas scenes (aurora, globe, neon-field, neural, revenge, solar-system, synthwave)
    auth-client.ts          ← better-auth client (`createAuthClient()` from 'better-auth/svelte')
```

---

## Coding Conventions — Read the Instruction Files

All granular rules live in `.github/instructions/`:

| File | Applies to | Key rules |
|---|---|---|
| [`svelte5.instructions.md`](.github/instructions/svelte5.instructions.md) | `**/*.svelte` | Runes only — `$state`, `$derived`, `$effect`, `$props`. No `on:` directives, no stores, no `export let` |
| [`svelte-ts.instructions.md`](.github/instructions/svelte-ts.instructions.md) | `**/*.svelte.ts` | Module-scope `$state` singletons. Never `writable/readable/derived` from svelte/store |
| [`server-ts.instructions.md`](.github/instructions/server-ts.instructions.md) | `src/**/*.server.ts` | `$env/static/private` only (never `process.env`). Auth guard via `locals.user`. Drizzle query patterns |
| [`components.instructions.md`](.github/instructions/components.instructions.md) | `src/lib/components/**/*.svelte` | Folder structure (`ui/`, `layout/`). PascalCase files. Inline `$props<{}>()` typing. Snippets over slots |
| [`tailwindcss.instructions.md`](.github/instructions/tailwindcss.instructions.md) | `**/*.svelte` | Dark-only. Named design tokens (never arbitrary values for defined tokens). Component utilities in `layout.css` |
| [`icons.instructions.md`](.github/instructions/icons.instructions.md) | `src/**/*.svelte` | Raw Lucide SVG strings only — no icon library imports. Always `{@html icon}` with ESLint suppression comment |
| [`testing.instructions.md`](.github/instructions/testing.instructions.md) | `src/**/*.test.ts` | `*.svelte.test.ts` → browser (Playwright). `*.test.ts` → Node. `expect.requireAssertions: true` always |

---

## Auth

### Session & locals

`hooks.server.ts` calls `auth.api.getSession()` on every request and populates:

```ts
// app.d.ts
locals.user: {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'contributor';
  email: string;
} | null
```

### Guards

```ts
// In any +page.server.ts or +layout.server.ts
if (!locals.user) redirect(302, '/bloo/login');
if (locals.user.role !== 'admin') redirect(302, '/bloo');
```

### Discord allowlist

`ALLOWED_DISCORD_IDS` (comma-separated env var) controls who can log in via Discord. Checked in the `account.create` hook in `src/lib/server/auth.ts` — unlisted IDs throw and are rejected.

### Client-side OAuth

Use `authClient` from `$lib/auth-client`:

```ts
import { authClient } from '$lib/auth-client';
await authClient.signIn.social({ provider: 'discord', callbackURL: '/bloo' });
```

---

## Database

```ts
import { db } from '$lib/server/db';
import { posts, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Prefer relational API
const post = await db.query.posts.findFirst({ where: eq(posts.slug, slug) });
```

### Schema overview

| Table | PK | Notable columns |
|---|---|---|
| `users` | `text` (no default — must pass `crypto.randomUUID()` on insert) | `username`, `displayName`, `passwordHash`, `role`, `email` |
| `posts` | `serial` | `slug` (unique), `content` (HTML), `tags` (JSON string), `status` (draft\|published) |
| `projects` | `serial` | `category` (website\|game\|mod\|other), `links` (JSON string), `ownerType` (mine\|friend), `featured`, `sortOrder` |
| `media` | `serial` | `filename`, `url`, `mimeType`, `size` |
| `messages` | `serial` | `name`, `email`, `message`, `status` (unread\|read\|replied) |
| `session`, `account`, `verification` | text | better-auth managed |

**`tags` and `links`** are stored as JSON strings — always `JSON.parse()` on read and `JSON.stringify()` on write.

**`users.id`** has no default — pass `crypto.randomUUID()` explicitly on insert.

---

## Styling Quickref

Dark-only. Never add `dark:` variants.

**Common component utilities** (defined in `src/routes/layout.css`):

| Class | Use |
|---|---|
| `.input-dark` | `<input>`, `<select>`, `<textarea>` |
| `.label-caps` | Uppercase tracking-widest label above inputs |
| `.btn-cyan` | Primary action button |
| `.btn-ghost` | Secondary / cancel button |
| `.btn-destructive` | Danger / delete button |
| `.content-panel` | Dark glass card (`bg rgba(0,0,0,0.88)` + blur) |
| `.logo-glitch` | VT323 logo with cyan/magenta text-shadow offset |
| `.scanlines` | CRT scanline overlay (fixed, pointer-events none) |

**Named tokens** — use instead of arbitrary values: `shadow-glow-cyan-sm/md/lg`, `shadow-card`, `shadow-login-card`, `blur-orb-sm/md/lg`, `text-label-xs`, `text-label`, `text-ui`. If a value doesn't exist, add it to `@theme` in `layout.css` first.

---

## Canvas Background

`CanvasBackground.svelte` is rendered in the root layout for all non-`/bloo` routes. Scene modules live in `src/lib/scenes/` — each exports `create*`, `update*`, `draw*` functions. `ScenePicker.svelte` lets users switch scenes (it lives inline in `PublicFooter` as the "s" in "blooshoo").

---

## Docker / Env Vars

The Dockerfile uses placeholder env vars at build time so `vite build` resolves `$env/static/private` imports without real secrets. Real values are injected at runtime via Docker Compose / `.env.local`.

Required env vars at runtime:

```
DATABASE_URL
AUTH_SECRET
BETTER_AUTH_URL
BETTER_AUTH_TRUSTED_ORIGINS
ORIGIN                        # adapter-node CSRF protection
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
ALLOWED_DISCORD_IDS           # comma-separated Discord user IDs
BUNNYCDN_STORAGE_ZONE_NAME
BUNNYCDN_STORAGE_API_KEY
BUNNYCDN_PULL_ZONE_URL
BUNNYCDN_STORAGE_REGION
DEEPSEEK_API_KEY
```

Migrations run automatically on container start (`scripts/migrate.mjs` → `docker-entrypoint.sh`).

---

## Known Gotchas

- **`class:` directive with `/` in class name** causes a Svelte parse error — use ternary in `class=` instead.
- **`$env/static/private`** can only be imported in `.server.ts` files and `hooks.server.ts` — never in `.svelte` components or universal `+page.ts` / `+layout.ts` files.
- **Zod v4**: use `.issues` not `.errors` on `ZodError`.
- **`users.id`** is `text` with no DB default — always provide `crypto.randomUUID()` manually.
- **`tags` / `links` columns** are raw JSON strings in the DB — never assume they're arrays without parsing.
- **Discord login allowlist** is enforced server-side in the auth hook — adding a Discord OAuth button is not enough; the user's Discord ID must be in `ALLOWED_DISCORD_IDS`.
