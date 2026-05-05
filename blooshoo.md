# blooshoo

Personal website and portfolio — retro pixel / late-90s aesthetic. Built with
Next.js 15, TypeScript, Tailwind CSS v4, and SQLite via Drizzle ORM. Runs in
Docker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Radix UI primitives |
| Database | SQLite via `better-sqlite3` + Drizzle ORM |
| Auth | NextAuth v5 — credentials provider against `users` table |
| Rich text | Tiptap (StarterKit, Color, TextStyle, Link, Image) |
| Fonts | VT323 (headings) + IBM Plex Mono (body) via `next/font` |
| Deploy | Docker + docker-compose |

---

## Pages

### Public
| Route | Description |
|---|---|
| `/` | Home — hero with blinking cursor, latest 3 posts, featured projects (mine only) |
| `/blog` | All published posts |
| `/blog/[slug]` | Single post (raw HTML rendered from Tiptap) |
| `/projects` | Two sections: "Projects" (mine, sorted by order) + "Friends' Stuff" (sorted by date) |
| `/capes` | 🦸 Cape product page (easter egg — **not in nav**, discoverable via blog links). Sold-out listing with 3 product images, struck-out $49.99 price, waiting-list CTA → `/contact` |
| `/contact` | Contact form with math challenge captcha and honeypot. Submissions saved to database. |

### Bloo panel (secret URL — not linked anywhere public)
| Route | Description |
|---|---|
| `/bloo` | Dashboard — stats for posts, projects, media |
| `/bloo/messages` | Inbox dashboard for contact form submissions. Mark as replied or delete. |
| `/bloo/login` | Login page |
| `/bloo/change-password` | Any logged-in user can change their own password |
| `/bloo/posts` | Blog CRUD list — Edit / Delete per row, "New Post" button |
| `/bloo/posts/new` | New post form — Tiptap rich text editor |
| `/bloo/posts/[id]` | Edit post |
| `/bloo/projects` | Project CRUD — admins see all, contributors see own |
| `/bloo/projects/new` | New project form — category, owner type, dynamic links |
| `/bloo/projects/[id]` | Edit project |
| `/bloo/users` | Admin-only user management — create, delete, reset passwords |
| `/bloo/media` | Media upload via BunnyCDN |

---

## Design

- **Color palette:** near-black `#0a0a0f` background, electric teal `#00ffcc`
  primary, electric blue `#00aaff` secondary, off-white `#e8e8e8` text, `#888`
  muted
- **Typography:** VT323 pixel font on all headings, IBM Plex Mono for body/nav
- **CRT scanlines:** subtle 6% opacity horizontal lines via CSS gradient (also on
  `/bloo` pages)
- **Content panels:** semi-transparent dark overlay (`rgba(0,0,0,0.88)` +
  `blur(4px)`)
- **Nav:** bracket hover effect (`[ Home ]`) with teal accent on hover
- **Logo:** glitchy "BLOOSHOO" with chromatic aberration
- **Bloo panel buttons:** teal border, transparent bg, teal text. Hover: teal bg,
  black text.
- **Bloo panel inputs:** dark `#0a0a0f` bg, teal border, off-white text
- **Blog content:** `.prose-bloo` scoped CSS — VT323 teal headings, `#00aaff`
  links, styled code blocks

---

## Canvas Background Animation

Full-screen HTML5 canvas behind everything (z-0). One scene randomly picked
per page load:

| Scene | Color | Style |
|---|---|---|
| Seattle skyline | Teal `#00ffcc` | Space Needle + building silhouettes, slow line tracing |
| Brick wall grid | Blue `#00aaff` | Offset brick + mortar raster |
| Circuit board | Magenta `#ff44ff` | Trace routes, IC chips, vias |
| Star map | Amber `#ffaa00` | 45 stars with constellation lines |
| DVD bounce | Random neon | "BLOO / SHOO" logo bounces, leaves wake, drops O's, sparks |
| Revenge of the O's | Teal `#00ffcc` | Mini space battle — ship warps in, fighters attack pixel shoe |

All lines use `shadowBlur` glow + white core line. Drawing speeds 160–800
px/sec. Two animated scenes are described in detail in previous revisions of
this file — the O droplet system (DVD scene) and the Revenge of the O's battle
structure.

---

## Database (SQLite via Drizzle ORM)

| Table | Key columns |
|---|---|
| `users` | id, username (unique), display_name, password_hash (bcrypt), role (admin/contributor), created_at |
| `posts` | id, title, slug (unique), content (HTML), excerpt, cover_image, status, tags (JSON), author_id (FK→users), created_at, updated_at |
| `projects` | id, title, description, category (website/game/mod/other), links (JSON), image, owner_type (mine/friend), owner_name, owner_id (FK→users), featured (bool), sort_order, created_at, updated_at |
| `media` | id, filename, original_name, url, mime_type, size, created_at |
| `messages` | id, name, email, message, status (unread/read/replied), created_at |

---

## Auth & Roles

- **Admin** — full access to all `/bloo` pages, manage users, set project featured
- **Contributor** — CRUD own posts/projects, no `/bloo/users`, no featured flag
- Session carries `id`, `displayName`, `role` — available via `auth()` everywhere
- Auth helpers: `requireAuth()` → redirects to `/bloo/login`, `requireAdmin()` →
  redirects to `/bloo`

### Auth architecture (split config)

| File | Purpose |
|---|---|
| `auth.config.ts` | Edge-safe config — JWT/session callbacks, `authorized` guard, `trustHost: true`. No Node.js-only imports (no `fs`, no `better-sqlite3`). Used by middleware. |
| `auth.ts` | Full NextAuth config — spreads `authConfig`, adds credentials provider with bcrypt + DB lookup. Exports `handlers`, `signIn`, `signOut`, `auth`. |
| `middleware.ts` | Runs `NextAuth(authConfig)` on Edge. Matcher: `["/bloo", "/bloo/((?!login).*)"]` — excludes `/bloo/login` to prevent redirect loops. |
| `app/api/auth/[...nextauth]/route.ts` | Re-exports `{ GET, POST }` from `auth.ts` handlers. |

### Key auth behaviors

- **Middleware** protects all `/bloo/*` except `/bloo/login` — unauthenticated
  requests to protected routes get a 307 to `/bloo/login?callbackUrl=...`
- **`app/bloo/layout.tsx`** checks `auth()` — if no session, renders children
  without the admin sidebar/header (the login page). If session exists, renders
  the full admin chrome.
- **`trustHost: true`** in `auth.config.ts` — required when running behind
  Docker port-mapping or accessing via LAN IP, otherwise NextAuth rejects
  callback URLs that don't match `AUTH_URL`.
- **Logged-in users** visiting `/bloo/login` get redirected to `/bloo` by the
  `authorized` callback.

---

## Setting Up Your Admin Account

### Option A: Local dev (plaintext password)

```env
# .env.local
ADMIN_USERNAME=blooshoo
ADMIN_DISPLAY_NAME="blooshoo"
ADMIN_PASSWORD=yourplaintextpassword
```

Then:
```bash
npm run seed
# Remove ADMIN_PASSWORD from .env.local after — the hash is in the DB now.
```

### Option B: Sharing with a friend (pre-hashed — SAFE)

**On your machine:**
```bash
npm run hash-password -- yourplaintextpassword
# Copy the hash it prints.
```

**Give your friend:**
```env
ADMIN_USERNAME=blooshoo
ADMIN_DISPLAY_NAME="blooshoo"
# IMPORTANT: wrap the hash in single quotes! The $ signs in bcrypt
# hashes look like shell variables to Docker Compose.
ADMIN_PASSWORD_HASH='$2a$12$...theHashYouCopied...'
```

**Your friend runs:**
```bash
npm run seed
```

Your friend never sees your plaintext password — the hash is one-way bcrypt.

### Creating additional users

Log in as admin → `/bloo/users` → "Create User". Each user can then change
their own password at `/bloo/change-password` (key icon in the header).

---

## Running

### First time (or after wiping the DB)

```bash
docker compose up --build -d
docker compose exec blooshoo npm run seed   # ← creates your admin user
```

Then log in at `http://localhost:7777/bloo/login`.

**After seeding**, you can remove `ADMIN_USERNAME`, `ADMIN_DISPLAY_NAME`,
`ADMIN_PASSWORD`, and `ADMIN_PASSWORD_HASH` from `.env.local` — they were only
needed for `npm run seed`. The credentials live in the database now.

### Normal startup

```bash
docker compose up --build -d
```

Site at `http://localhost:7777`. Database persists in the `blooshoo_data`
Docker volume. Only `AUTH_SECRET` is strictly required in `.env.local`.

### Manual (no Docker)

```bash
npm install
npm run db:push
npm run seed
npm run dev
```

---

## NPM Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run seed` | Create admin user from env vars |
| `npm run hash-password -- <pw>` | Print bcrypt hash (for sharing safely) |
| `npm run db:push` | Push schema directly to SQLite |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run generated migrations |
| `npm run db:studio` | Open Drizzle Studio |

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | yes | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | production | Full URL the site is served at — **must match the actual port** (e.g. `http://localhost:7777` if running on 7777) |
| `DATABASE_PATH` | no | Defaults to `blooshoo.db` |
| `ADMIN_USERNAME` | for seed | Admin username |
| `ADMIN_DISPLAY_NAME` | for seed | Name shown on posts |
| `ADMIN_PASSWORD` | for seed (opt A) | Plaintext — remove after seeding |
| `ADMIN_PASSWORD_HASH` | for seed (opt B) | Pre-hashed — safe to share |
| `DEEPSEEK_API_KEY` | optional | AI writing features |
| `BUNNYCDN_*` | for media | Storage zone, API key, pull zone URL, region |

---

## TODO

- [x] Captcha for contact form + store in database
- [ ] Blog post search / tag filtering
- [ ] RSS / Atom feed
- [ ] Dynamic OG image generation
- [ ] Deploy to the internet (VPS, domain, SSL)
