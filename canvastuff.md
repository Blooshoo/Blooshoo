# Canvas Background — Full Spec

Full-screen HTML5 canvas behind everything (z-0). One scene randomly picked per page load. All lines use `shadowBlur` glow + white core line. Drawing speeds 160–800 px/sec.

**Main file:** `components/canvas-background.tsx` (~1850 lines)
**Scene modules:** `components/neon-field.ts`, `components/revenge-scene.ts`

> **⚠️ LLM note:** The Edit tool in diff mode has been observed to fail on `canvas-background.tsx` even with exact match strings. If you hit this, spawn a sub-agent (fresh tool context fixes it) or use `sed` for targeted line replacements.

---

## Scenes at a Glance

| Scene | Color | Status | Notes |
|---|---|---|---|
| Seattle skyline | Teal `#00ffcc` | In rotation | Space Needle + building silhouettes, slow line tracing |
| Brick wall | Blue `#00aaff` | In rotation | Offset brick + mortar raster |
| Circuit board | Magenta `#ff44ff` | In rotation | Trace routes, IC chips, vias |
| Star map | Amber `#ffaa00` | In rotation | 45 stars with constellation lines |
| DVD bounce | Random neon | In rotation | "BLOO / SHOO" bounces, wake trail, drops O's, sparks |
| Neon Field | Multi | In rotation | Bioluminescent grass, perspective projection, wind gusts, pollen |
| Aquarium | Teal `#00ffcc` | In rotation | Underwater world, 7 animated layers |
| Revenge | Teal + Red | **Out of rotation** | Add `revenge` entry to `allScenes` array to re-enable |

---

## Revenge Scene

**File:** `components/revenge-scene.ts` — self-contained module imported by `canvas-background.tsx`.

5-layer space battle: **BLOO SQUADRON** (teal `#00ffcc`) vs **BAD VIBES SAT-1** satellite (red `#ff2244`, amber `#ff8800`). Canvas 2D API, `shadowBlur` glow, no external libraries.

**Lifecycle:** Mothership warps in from left → continuous battle → after 2 satellite destructions, warps out → resets with re-randomized positions and replays.

### Layer 1 — Starfield
80 stars, radius 0.5–1.5px, white with twinkle via `sin(sceneTime * 2.5 + randomPhase)`. Parallax shifts 0.02× opposite screen shake.

### Layer 2 — Bad Vibes Satellite (right side)
- Body: ~60×70px dark rect with `#ff2244` red glow
- Solar panels: ~80×16px amber `#ff8800`, 4 segmented cells
- Rotating dish: tracks nearest O-fighter (max 1.2 rad/sec)
- Screen: scrolling "BAD VIBES" text; on hit glitches to "GUD VIBES" for 0.6s
- Health: 20 hits → 40 amber + 20 red explosion particles, screen shake (8px, 0.6s), "SATELLITE DESTROYED" HUD flash. Respawns after 6s.
- Sweep laser: fires every 5–8s, sweeps ~60° over 1.2s, screen shake (4px, 0.3s). Point-to-line-segment hit detection.

### Layer 3 — Bloo Mothership (left side)
- ~80×40px trapezoid hull, teal glow, flickering engine nozzles
- Gentle sine-wave vertical drift (amplitude 18px, period ~7s)
- Warps in from off-screen left on scene start, 5 speed-lines burst on arrival
- Launches a new O-fighter every 4s if active count < 6 and satellite is alive

### Layer 4 — O-Fighters (BLOO side, max 6)
Circle (~8px radius), teal core + glow, 4-position fading trail.

State machine:
- `PATROL` — Lissajous figure-8 around mothership: `x = centerX + sin(phase*1.3)*ampX`, `y = centerY + sin(phase*0.7)*ampY`
- `ATTACK_RUN` — triggers every 3–6s, steers to satellite (max 2.5 rad/sec), fires teal laser (320px/s, range 280px) when in range, banks away after 3.5s or passing within 60px
- `EVADE` — if a drone comes within 90px, breaks perpendicular at 200px/s for 0.8s
- `RETURN` — arcs back to mothership at 130px/s
- `DYING` — spin accelerates, shrinks over 0.8s, 10 teal explosion particles, respawns after 3s

### Layer 5 — Bad Vibes Drones (red, max 5)
Angular diamond shape (~10px), `#ff2244` glow, 4-position trail.

State machine:
- `GUARD` — elliptical orbit around satellite (radiusX=90, radiusY=65), evenly offset angles
- `INTERCEPT` — if O-fighter enters 200px of satellite, chases it (max 2.5 rad/sec), fires red laser (280px/s, range 200px) within 120px
- `RETREAT` — if target dies or moves >350px away, returns to satellite at 170px/s
- `DYING` — red particles, respawns after 4s
- `interceptCooldown` — 2s after intercept start, 1.5s after retreat

### Projectiles
Pool of max 20 lasers pre-allocated at init, recycled via `active` flag — zero allocations in update loop. Collision: circle vs circle. On hit: 5 impact particles.

### Particles
Pool of max 80, pre-allocated. Types: explosion (burst outward), impact (fast fade, 0.15–0.4s), engine trail (behind mothership, probabilistic per frame).

### Screen Shake
`shakeX`/`shakeY` via `ctx.translate()`. Satellite hit: 2px/0.15s. Sweep laser: 4px/0.3s. Destruction: 8px/0.6s. Decays linearly, random direction each frame.

### HUD
- Permanent: "BLOO SQUADRON vs BAD VIBES SAT-1" (9px mono, 20% opacity, bottom-left)
- Flash: "SATELLITE DESTROYED" (teal, 2s) / "SAT-1 REBOOTING" (red, 1.5s)

### Performance
- `deltaTime` capped at 0.05s
- Object pools — no `new` in update loop
- Indexed `for` loops, no `forEach`
- `ctx.save()`/`ctx.restore()` around every glow pass
- `shadowBlur` reset to 0 after each glowing element
- Draw order: starfield → satellite → mothership → speed lines → drones → fighters → lasers → sweep laser → particles → HUD

---

## Neon Field Scene

**File:** `components/neon-field.ts` — exports `createNeonField(w,h)`, `updateNeonField(state,dt)`, `drawNeonField(state,ctx)`, `NeonFieldState`.

Bioluminescent grass field, low camera angle — Ghost of Tsushima aesthetic in a cyberpunk palette. Key trick: **perspective projection** via a depth value `t`.

**Coordinate system:**
- Horizon at 42% from top (`horizonY = h * 0.42`)
- Depth `t = (anchorY - horizonY) / (h - horizonY)`: 0.0 = horizon/far, 1.0 = bottom/close
- `t` drives height, width, glow intensity, opacity, color

**Blades:** 500 across 8 depth rows. Far rows: 80–100 blades. Close rows: 20–40. Each has random anchorX (±15% overflow), ±6px Y jitter, natural lean ±0.3 rad.

**Color by depth:**

| t | Glow | Core |
|---|---|---|
| < 0.3 (far) | `#4422aa` | `#6644cc` |
| 0.3–0.65 (mid) | 50/50 `#cc44ff` / `#0088cc` | same |
| > 0.65 (close) | 60/40 `#00ffcc` / `#00aaff` | same |

Tip gradient: core → `#ffffff` via `createLinearGradient`.

**Sway:** `sin(time * 0.7 + swayPhase) * 0.04 * (0.8 + t * 0.5)` rad added to natural lean.

**Wind gusts:** Bell-curve influence, sigma = `80 + (1-t) * 140` (far blades see wide gusts, close see sharp fronts). Max deflection: `strength * 60 * (0.6 + t*0.8)°`. Spring-damper per blade: `velocity += (target - angle) * 18 * dt`, `velocity *= 0.72`. Gusts: every 2.5–6s, max 3 alive, 90–200 px/sec, strength 0.3–1.0.

**Drawing:** Quadratic bezier — anchor → control point (halfway up, offset `sin(angle)*height*0.4`) → tip. Glow pass (thick, `shadowBlur`, low opacity) then core pass (thin, no shadow, gradient).

**Horizon glow:** Elliptical radial gradient at `(w*0.5, horizonY)`, stretched via `ctx.scale(1, 0.18)`. Plus 2px horizon line at `rgba(100,220,255,0.12)`.

**Pollen:** Pool of 60. Strong gusts (>0.55) near close blades (t > 0.5): 4% chance per frame to spawn at blade tip. Drift in gust direction + upward, life 1.5–3s, radius 1–2px, white fading, `shadowBlur: 6`.

**Draw order:** Horizon glow → blades back-to-front (sorted by anchorY at init, never re-sorted) → pollen.

**Performance:** dt capped 0.05s. Sorted once. Pool pre-allocated. Blades with opacity < 0.05 skipped.

---

## Aquarium Scene

Living underwater world, 7 layers drawn back-to-front on `#0a0a0f` canvas.

**Draw order:**

1. **Water atmosphere** — vertical gradient (transparent bottom → `rgba(0,20,60,0.6)` top). Haze band at 35% from bottom. 6 caustic blobs (`rgba(0,180,200,0.04)`, ~180px) drifting at 8–15 px/sec, bouncing off edges.

2. **Sea grass** (300 blades, 3 depth layers) — back (120 blades, `#007755`/`#00aa77`), mid (100, `#00ccaa`/`#00eebb`), front (80, 70% `#00ffcc` / 30% `#00aaff`). Quadratic beziers from canvas bottom. Idle sway `sin(time*0.8+phase)*3°` + bell-curve gusts (σ=120px) at 80–220 px/sec. Spring-damper (stiffness=6, damping=4). `shadowBlur` 4/8/14 per layer.

3. **Fish** (3) — pointed-oval cubic bezier bodies (~28×12px), `rgba(0,20,40,0.7)` fill, glowing outline (teal/blue/magenta). V-tail oscillates `sin(time*3+phase)*0.3` rad. Swim 25–55 px/sec, vertical sine drift ±15px. Flip direction + randomize on edge exit. `shadowBlur: 12`.

4. **Bubbles** (35) — thin circle strokes (not filled), `rgba(100,220,255,0.3–0.7)`, `shadowBlur: 6`. Radius 2–7px. Rise 15–40 px/sec with sin wobble ±8px. Reset to random x at bottom on exit.

5. **Bioluminescent particles** (50) — radius 1–3px, all-direction drift at 4–12 px/sec. Heading rotates ±0.3 rad/sec. Opacity pulses `sin(time*pulseSpeed+phase)*0.4+0.5`. Colors: `#00ffcc`, `#00aaff`, `#cc44ff`, `#ffffff`. Wrap all edges.

6. **Jellyfish** (1) — dome ~30×22px, `rgba(180,100,255,0.15)` fill, `#cc44ff` stroke, `shadowBlur: 18`. Breathes on 2s cycle ±15% scale. 6 tentacles (40–70px), wavy poly-lines, `shadowBlur: 8`. Drifts up 8–14 px/sec. Resets to bottom-center at top 20%.

7. **Surface light rays** (5) — thin trapezoids (2px top, 8px bottom), ~40% canvas height, gradient `rgba(100,220,255,0.06)` → transparent. Sway ±15px over 8–14s periods. No shadowBlur — intentionally subtle.

**Performance:** dt capped 0.05s. All arrays pre-allocated at init. Indexed `for` loops. `shadowBlur` zeroed after every glow draw.
