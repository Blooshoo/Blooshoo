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



> **⚠️ LLM/editor note:** The `edit_file` tool in "edit" (diff) mode has been
> observed to fail repeatedly on `canvas-background.tsx` — even with exact,
> short match strings that visibly exist in the file. If you encounter this,
> do not waste time debugging your match text. Use one of these alternatives
> instead:
> 
> 1. **Spawn a sub-agent** — they get a fresh tool context and `edit_file`
>    works for them.
> 2. **Use `write` mode** on `edit_file` for new files (works fine).
> 3. **Use `terminal` with `sed`** — `sed -i 'LINENUMs/old/new/' file`
>    for single-line replacements, or `sed -i 'START,ENDd' file` to
>    delete line ranges. Fast and reliable.


Full-screen HTML5 canvas behind everything (z-0). One scene randomly picked

per page load:



| Scene | Color | Style |

|---|---|---|

| Seattle skyline | Teal `#00ffcc` | Space Needle + building silhouettes, slow line tracing |

| Brick wall grid | Blue `#00aaff` | Offset brick + mortar raster |

| Circuit board | Magenta `#ff44ff` | Trace routes, IC chips, vias |

| Star map | Amber `#ffaa00` | 45 stars with constellation lines |

| DVD bounce | Random neon | "BLOO / SHOO" logo bounces, leaves wake, drops O's, sparks |

| Revenge | Teal `#00ffcc` + Red `#ff2244` | **(out of rotation)** BLOO SQUADRON vs BAD VIBES SAT-1 — 5-layer space battle, state-machine AI, object pools, screen shake |

| Neon field | Multi | Bioluminescent neon grass field with perspective projection, wind gusts, pollen |

| Aquarium | Teal `#00ffcc` | Underwater world — 7 layers of animated marine life with neon glow |



All lines use `shadowBlur` glow + white core line. Drawing speeds 160–800

px/sec. Three animated scenes are described in detail in the sections

below — the O droplet system (DVD scene), the Revenge space battle, and

structure.




### Revenge Scene (out of rotation)

**File:** `components/revenge-scene.ts` — self-contained module, imported by
`components/canvas-background.tsx`. Currently not in the random rotation; can be
re-enabled by adding a `revenge` entry to the `allScenes` array.

A 5-layer canvas space battle between the **BLOO SQUADRON** (teal `#00ffcc`)
and the **BAD VIBES SAT-1** satellite (red `#ff2244`, amber `#ff8800`). All
drawing uses the Canvas 2D API with `shadowBlur` glow + bright core overlays.
No external libraries.

**Scene lifecycle:** Mothership warps in from left → continuous battle → after
2 satellite destructions, mothership warps out → scene resets with randomized
positions and replays.

#### Layer 1 — Starfield
80 stars, radius 0.5–1.5px, white with slight twinkle via
`sin(sceneTime * 2.5 + randomPhase)`. Parallax shifts 0.02× opposite to screen
shake.

#### Layer 2 — Bad Vibes Satellite (right side)
- Central body: ~60×70px dark rectangle with `#ff2244` red glow
- Two solar panels (left & right): ~80×16px amber `#ff8800`, segmented into 4
  cells with `#ff6600` lines
- Rotating dish: small arc/semicircle on a stalk, slowly tracks the nearest
  O-fighter (max turn rate 1.2 rad/sec)
- Screen: ~28×12px on the front face, displays scrolling "BAD VIBES" text via
  clip-region scroll. On hit: glitches for 0.6s — text changes to "GUD VIBES"
  and flickers with random opacity.
- Health: 20 hits to destroy. On destroy: 40 amber + 20 red explosion particles,
  screen shake (8px, 0.6s), "SATELLITE DESTROYED" HUD flash. Respawns after 6s
  with "REBOOTING..." screen text and "SAT-1 REBOOTING" HUD flash.
- Sweep laser: fires every 5–8s (random), wide red beam (`shadowBlur: 20`) that
  sweeps ~60 degrees over 1.2s. Triggers screen shake (4px, 0.3s). Uses
  point-to-line-segment distance for O-fighter hit detection.
- Dish tracks nearest O-fighter via `steerAngle()` (gradual turn, avoids
  snapping).

#### Layer 3 — Bloo Mothership (left side)
- ~80×40px trapezoid hull (narrower at back, wider at front) with `#00ffcc`
  teal glow
- Two engine nozzles at the back with animated flickering thrust (teal/white
  small rects, random intensity each frame)
- Drifts with gentle sine-wave vertical motion (amplitude 18px, period ~7s)
- At scene start: warps in from off-screen left, travels fast then decelerates
  to position. 5 horizontal speed-lines burst on arrival and fade over ~0.5s.
- Launches a new O-fighter every 4s if active count is below 6 and the
  satellite is alive.

#### Layer 4 — O-Fighters (BLOO side, max 6)
- Appearance: circle (~8px radius) with bright teal `#00ffcc` core + glow.
  Directional trail of last 4 positions, fading opacity.
- **State machine:**
  - `PATROL`: Flies a loose figure-8 / Lissajous curve around the mothership.
    `x = centerX + sin(phase * 1.3) * ampX`, `y = centerY + sin(phase * 0.7) * ampY`.
  - `ATTACK_RUN`: Triggered every 3–6s randomly per fighter (staggered). Peels
    off, steers toward satellite using `steerAngle()` (max turn rate 2.5
    rad/sec). Fires teal laser (`#00ccff`, speed 320px/s, max range 280px,
    `shadowBlur: 8`) when within 280px. Banks away after passing within 60px or
    after 3.5s.
  - `EVADE`: If a Bad Vibes drone comes within 90px, breaks into a random
    perpendicular direction at 200px/s for 0.8s, then returns to PATROL.
  - `RETURN`: Arcs back to mothership at 130px/s.
  - `DYING`: Rotation accelerates (`deathSpin += dt * 10`), shrinks over 0.8s,
    then removed. Spawns 10 teal explosion particles. Respawns from mothership
    after 3s.

#### Layer 5 — Bad Vibes Drones (red faction, max 5)
- Appearance: small angular diamond/triangle shape (~10px), red `#ff2244` glow.
  Also has a 4-position directional trail.
- **State machine:**
  - `GUARD`: Orbits the satellite in an elliptical path (radiusX=90, radiusY=65),
    each drone offset by equal angles.
  - `INTERCEPT`: If an O-fighter enters within 200px of the satellite AND the
    drone is not on cooldown, breaks off and chases that fighter. Uses
    `steerAngle()` (max 2.5 rad/s). Fires red laser (`#ff2244`, speed 280px/s,
    max range 200px) when within 120px.
  - `RETREAT`: If the chased fighter dies or moves >350px away, returns to
    satellite at 170px/s.
  - `DYING`: Same as O-fighter death but red particles. Respawns after 4s.
  - `interceptCooldown`: Prevents immediate re-intercept after returning (2s
    after intercept start, 1.5s after retreat).

#### Projectiles
- Pool of max 20 lasers (both factions combined), pre-allocated at init.
  Recycled via `active` flag — zero allocations in the update loop.
- Each laser: `{ x, y, vx, vy, color, owner, distanceTraveled, maxRange, radius }`.
- Collision: circle vs circle. Bloo lasers hit satellite (radius 35px) and
  drones (radius 8px). BadVibes lasers hit O-fighters (radius 8px).
- On hit: 5 small impact particles at the hit point, appropriate faction color.

#### Particles
- Pool of max 80 particles, pre-allocated. Recycled — never allocates after init.
- Each particle: `{ x, y, vx, vy, life, maxLife, radius, color, active }`.
- Types:
  - **Explosion**: burst outward from a point, random angles, fading over life.
  - **Impact**: 5 particles per laser hit, fast fade (0.15–0.4s), small radius.
  - **Engine trail**: behind mothership during idle, tiny teal, spawns
    probabilistically each frame.

#### Screen Shake
- Tracked via `shakeX` and `shakeY`, applied with `ctx.translate()` before all
  drawing.
- Triggers:
  - Satellite hit: 2px intensity, 0.15s duration
  - Satellite sweep laser: 4px intensity, 0.3s duration
  - Satellite destruction: 8px intensity, 0.6s duration
- Decays linearly to 0 over the duration. Random direction each frame via
  `(Math.random() - 0.5) * intensity * fade`.

#### HUD / Flavor Text
- Permanent dim text in bottom-left corner: "BLOO SQUADRON vs BAD VIBES SAT-1"
  (9px monospace, 20% opacity).
- Flash messages (centered, bold 16px monospace, fade in/out):
  - "SATELLITE DESTROYED" in teal, 2s duration
  - "SAT-1 REBOOTING" in red, 1.5s duration

#### Performance Rules
- `deltaTime` capped at 0.05s to prevent spiral-of-death on tab switch.
- Object pools for particles and lasers — no `new` inside the update loop.
- Indexed `for` loops throughout (no `forEach`).
- `ctx.save()` / `ctx.restore()` around every glow pass.
- `shadowBlur` only set when actually needed, reset to 0 / `"transparent"` after
  each glowing element.
- Draw order: starfield → satellite → mothership → speed lines → drones →
  fighters → lasers → sweep laser → particles → HUD.

### Neon Field Scene

A bioluminescent neon grass field viewed from a low camera angle across the
field — Ghost of Tsushima aesthetic in a cyberpunk palette. The key visual
trick is **perspective projection**: grass near the bottom of the canvas is
close to the camera (tall, large, bright) and grass near the horizon is far
away (tiny, dense, dim).

**Coordinate system:**
- Horizon line at 42% from the top of the canvas (`horizonY = h * 0.42`)
- All grass grows upward from anchor points distributed between `horizonY` and
  the canvas bottom
- Depth `t = (anchorY - horizonY) / (h - horizonY)` ranges 0.0 (horizon, far)
  to 1.0 (bottom, close)
- `t` drives everything: height, width, glow intensity, opacity, color

**Blade generation:** 500 blades across 8 depth rows evenly spaced between
horizonY and the canvas bottom. Far rows get 80–100 blades; close rows get
20–40 — the density illusion makes the far field feel packed and the near
field feel sparse. Each blade gets a random anchorX (±15% canvas overflow),
±6px Y jitter, and a natural lean of ±0.3 radians so blades don't all point
straight up.

**Color palette shifts by depth:**

| Depth (t) | Glow | Core |
|---|---|---|
| < 0.3 (far) | `#4422aa` deep blue-purple | `#6644cc` |
| 0.3–0.65 (mid) | 50% `#cc44ff` magenta, 50% `#0088cc` blue | same |
| > 0.65 (close) | 60% `#00ffcc` teal, 40% `#00aaff` cyan | same |

Tip gradient: core color → `#ffffff` at the tip via `createLinearGradient`.

**Idle sway:** `sin(time * 0.7 + swayPhase) * 0.04 * (0.8 + t * 0.5)` radians
added to natural lean. Close blades sway slightly more.

**Wind gusts:** Bell-curve influence with depth-dependent sigma —
`sigma = 80 + (1 - t) * 140`. Far blades have wide sigma (gusts look smoother
far away); close blades have tight sigma (gust front is sharply defined).
Max tip deflection: `strength * 60 * (0.6 + t * 0.8)` degrees. Spring-damper
physics per blade: `velocity += (target - angle) * 18 * dt`, `velocity *= 0.72`,
`angle += velocity * dt`. Gusts spawn every 2.5–6s, max 3 alive, speed
90–200 px/sec, strength 0.3–1.0, traveling full canvas width + 200px overflow.

**Drawing each blade:** Quadratic bezier curve — start at anchor point, control
point halfway up with extra horizontal offset `sin(angle) * height * 0.4`,
tip at `(anchorX + sin(angle) * height, anchorY - cos(angle) * height)`. Glow
pass first (thick line, `shadowBlur`, low opacity), then core pass on top
(thin line, no shadow, full opacity, white-to-color gradient).

**Horizon atmospheric glow:** Wide elliptical radial gradient centered at
`(w * 0.5, horizonY)` — `rgba(180,80,255,0.18)` → `rgba(0,180,200,0.08)` →
transparent — stretched with `ctx.scale(1, 0.18)` to canvas.width × 0.9 wide
and canvas.height × 0.18 tall. Plus a thin 2px horizon line at
`rgba(100,220,255,0.12)`.

**Pollen particles:** Pool of 60, recycled. Strong gusts (strength > 0.55)
passing close blades (t > 0.5) have a 4% chance per frame to spawn a particle
at the blade tip. Drift in gust direction + upward, life 1.5–3s, radius
1–2px, `#ffffff` fading to transparent, `shadowBlur: 6`.

**Draw order:** Horizon atmospheric glow → grass blades back-to-front (sorted
by anchorY ascending at init — never re-sorted) → pollen particles.

**Performance:** `dt` capped at 0.05s. Blades sorted once at init. Particle
pool pre-allocated — no allocations in update/draw loops. Indexed `for` loops
throughout. `ctx.save()`/`ctx.restore()` around shadow passes; `shadowBlur`
reset after each glow element. Blades with opacity < 0.05 skipped.

**File:** `components/neon-field.ts` — self-contained module exporting
`createNeonField(w, h)`, `updateNeonField(state, dt)`, `drawNeonField(state, ctx)`,
and the `NeonFieldState` type.



### Aquarium Scene

A living underwater world rendered in 6 distinct layers, all drawn back-to-front

on a dark `#0a0a0f` canvas (background handled by parent component).



**Draw order:**



1. **Water atmosphere** — vertical gradient from transparent at bottom to deep

   blue `rgba(0,20,60,0.6)` at top. A soft horizontal haze band at 35% from

   bottom using a wide radial gradient (`rgba(0,80,120,0.12)`) mimics the light

   scattering zone. 6 large caustic blobs (`rgba(0,180,200,0.04)`, radius

   ~180px) drift slowly in random directions, bouncing off canvas edges at

   8–15 px/sec.



2. **Sea grass** (300 blades, 3 depth layers) — kept from the original neonField

   scene. Back layer (120 blades, `#007755` glow / `#00aa77` core), mid layer

   (100 blades, `#00ccaa` / `#00eebb`), front layer (80 blades, 70% `#00ffcc` /

   30% `#00aaff`). Each blade is a quadratic bezier anchored at the canvas

   bottom. Idle sway via `sin(time * 0.8 + phase) * 3°`, plus wind gusts

   (bell-curve influence, σ=120px) traveling left↔right at 80–220 px/sec.

   Spring-damper physics (stiffness=6, damping=4) for underdamped snap-back.

   Glow via `shadowBlur` (4/8/14 per layer) with a white-gradient core on top.



3. **Fish** (3 total) — pointed-oval bodies (~28×12px) built from cubic bezier

   curves, drawn with `rgba(0,20,40,0.7)` fill and glowing outline in their

   color (teal `#00ffcc`, blue `#00aaff`, magenta `#ff44ff`). Forked V-shaped

   tails oscillate via `sin(time * 3 + phase) * 0.3` radians. One triangular

   dorsal fin. Swim horizontally at 25–55 px/sec with gentle vertical sine drift

   (amplitude 15px). When a fish exits one edge, it flips direction and

   randomizes its vertical position and speed. Facing direction handled via

   `ctx.scale(direction, 1)`. `shadowBlur: 12` on outline strokes.



4. **Bubbles** (35 total) — thin circle strokes (not filled),

   `rgba(100,220,255, opacity 0.3–0.7)`, `shadowBlur: 6` in `#00ccff`. Radius

   2–7px. Rise upward at 15–40 px/sec with sin-based horizontal wobble (±8px).

   When a bubble exits the top, it resets to a random x at the bottom with new

   randomized properties. Object-pooled — no allocations in the update loop.



5. **Bioluminescent particles** (50 total) — tiny drifting particles (radius

   1–3px) moving in all directions at 4–12 px/sec. Each has a heading that

   slowly rotates (±0.3 rad/sec). Opacity pulses via

   `sin(time * pulseSpeed + phase) * 0.4 + 0.5`. Colors randomly assigned from

   `#00ffcc`, `#00aaff`, `#cc44ff`, `#ffffff`. `shadowBlur: 10` matching color.

   Wrap around all four canvas edges.



6. **Jellyfish** (1 only) — bell dome (~30×22px) with `rgba(180,100,255,0.15)`

   fill and `#cc44ff` glowing stroke, `shadowBlur: 18`. Bell breaths on a 2s

   cycle (±15% scale via `sin`). 6 trailing tentacles (40–70px each) drawn as

   wavy poly-lines animated with sin waves at different frequencies and phases,

   same purple glow, `shadowBlur: 8`. Drifts upward at 8–14 px/sec with gentle

   horizontal wobble. Resets to bottom-center when it reaches the top 20% of

   the canvas.



7. **Surface light rays** (5 total) — thin trapezoids (2px wide at top, 8px at

   bottom) spanning ~40% of canvas height, fanning out from the top edge. Fill

   is a vertical linear gradient from `rgba(100,220,255,0.06)` to transparent.

   Each ray slowly sways left/right (±15px at the bottom tip) on a unique

   period of 8–14 seconds. No shadowBlur — intentionally subtle.



**Performance rules:** `dt` capped at 0.05s. All arrays pre-allocated at scene

init — no allocations in update/draw loops. Indexed `for` loops throughout (no

`forEach`). `ctx.save()`/`ctx.restore()` scoped per element. `shadowBlur`

zeroed after every glow draw.



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
- [ ] Finish & re-enable Revenge scene (out of rotation — needs visual polish, files at `components/revenge-scene.ts`)
