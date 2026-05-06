# Solar System Canvas Scene — As-Built Spec

Isometric top-down solar system with 8 orbiting planets, asteroid belt, pulsing sun, and 7 random chaotic events. Built as a drop-in module for `canvas-background.tsx`, following the same architecture as Neon Field and Revenge scenes.

**File:** `components/solar-system-scene.ts` (~1,440 lines)
**Registered in:** `components/canvas-background.tsx` — `allScenes` array, `SceneMode` type, tick handler, init, and resize

---

## Exports

```ts
export interface SolarSystemState { ... }
export function createSolarSystem(w: number, h: number): SolarSystemState
export function updateSolarSystem(state: SolarSystemState, dt: number): void
export function drawSolarSystem(state: SolarSystemState, ctx: CanvasRenderingContext2D): void
```

**Resize:** On window resize, `createSolarSystem(w, h)` is called again — regenerates star positions, recalculates `orbitScale`, and re-centers the sun. This is done because the solar system is center-anchored (unlike Neon Field which can get away with absolute coords).

---

## Isometric Tilt

All orbits use `ORBIT_Y_SQUISH = 0.85` — drawn as ellipses rather than circles for subtle 3D depth. Planet positions computed as:

```ts
const orbitRX = planet.orbitRadius * state.orbitScale
const orbitRY = orbitRX * ORBIT_Y_SQUISH
const px = cx + Math.cos(planet.angle) * orbitRX
const py = cy + Math.sin(planet.angle) * orbitRY
```

Saturn's rings use `ctx.ellipse()` with `radiusY = radiusX * 0.35`, rotated `Math.PI * 0.15`.

---

## SolarSystemState Interface

```ts
export interface SolarSystemState {
  w: number; h: number
  stars: Star[]
  planets: Planet[]
  asteroids: Asteroid[]
  shootingStars: ShootingStar[]
  meteors: Meteor[]
  ufos: UFO[]
  comets: Comet[]
  solarFlares: SolarFlare[]
  satellites: Satellite[]
  warpFlashes: WarpFlash[]
  sceneTime: number
  orbitScale: number
  cx: number; cy: number
}
```

### Supporting interfaces

```ts
interface Star {
  x: number; y: number
  radius: number
  baseOpacity: number
  opacity: number          // computed each frame from twinkle
  twinklePhase: number
  twinkleSpeed: number
}

interface Planet {
  name: string
  radius: number
  orbitRadius: number       // base px, multiplied by state.orbitScale
  orbitalPeriod: number     // seconds for one full orbit
  color: string
  glowColor: string
  angle: number
  trail: Array<{ x: number; y: number }>
  trailLength: number
  moons: Moon[]
}

interface Moon {
  orbitRadius: number
  orbitalPeriod: number
  angle: number
  radius: number
  color: string
}

interface Asteroid {
  angle: number
  orbitRadius: number       // already multiplied by orbitScale
  speed: number             // radians/sec
  radius: number
  opacity: number
}

// All event types use active:boolean flag for pool recycling
interface ShootingStar { active: boolean; x: number; y: number; vx: number; vy: number; life: number; maxLife: number; trail: Array<{ x: number; y: number }> }
interface Meteor        { active: boolean; x: number; y: number; vx: number; vy: number; rotation: number; rotationSpeed: number; life: number; maxLife: number; points: Array<{ x: number; y: number }>; trail: Array<{ x: number; y: number; opacity: number }> }
interface UFO           { active: boolean; x: number; y: number; vx: number; vy: number; baseY: number; wobblePhase: number; life: number; maxLife: number; lightPhase: number }
interface Comet         { active: boolean; x: number; y: number; vx: number; vy: number; life: number; maxLife: number; trail: Array<{ x: number; y: number }> }
interface SolarFlare    { active: boolean; angle: number; life: number; maxLife: number; color: string; strands: SolarFlareStrand[] }
interface Satellite     { active: boolean; x: number; y: number; vx: number; vy: number; life: number; maxLife: number; blinkPhase: number }
interface WarpFlash     { active: boolean; x: number; y: number; life: number; maxLife: number }
```

---

## createSolarSystem(w, h)

### orbitScale
```ts
const orbitScale = Math.min(1.4, Math.min(w, h) / 650)
```
System is ~38% larger than the original plan. Caps at 1.4× on very large screens.

### Stars — 200
Random positions across full canvas. `radius` 0.5–1.5, `baseOpacity` 0.3–0.9, `twinklePhase` 0–2π, `twinkleSpeed` 0.4–1.2.

### Planets — 8 (Mercury → Neptune)
Exact data from the original plan, with randomized starting angles. Earth gets 1 moon, Jupiter gets 2.

### Asteroid Belt — 120
Between Mars and Jupiter: `orbitRadius` 195–215 × `orbitScale`. Differential rotation 0.04–0.07 rad/sec. Opacity 0.3–0.6.

### Event Pools (pre-allocated at init)

| Event | Pool Size | Spawn Rate |
|---|---|---|
| Shooting stars | 3 | 0.008 |
| Meteors | 1 | 0.004 |
| UFOs | 1 | 0.002 |
| Comets | 1 | 0.001 |
| Solar flares | 2 | 0.005 |
| Satellites | 2 | 0.003 |
| Warp flashes | 2 | 0.0008 |

All pools are pre-allocated with `active: false` — zero allocations in the update loop.

---

## updateSolarSystem(state, dt)

`dt` capped at `0.05`. `state.sceneTime += dtCapped`.

### Stars
```ts
s.opacity = s.baseOpacity * (0.6 + 0.4 * Math.sin(state.sceneTime * s.twinkleSpeed + s.twinklePhase))
```

### Planets
Orbit using `(2π / orbitalPeriod) * dt`. Trail updated via `push` + `shift` when over `trailLength`. Moons updated similarly.

### Asteroid Belt
Simple angle increment: `asteroids[i].angle += asteroids[i].speed * dtCapped`.

### Event Update Pattern (all moving events)

**Global cap:** `MAX_ACTIVE_EVENTS = 10`. A `countActiveEvents(state)` helper sums across all 7 pools. No event spawns if 10 things are already active.

**Roll-off behavior:** Moving events (shooting stars, meteors, UFOs, comets, satellites) do **not** deactivate when `life <= 0`. They keep moving (invisible, since alpha reaches 0) until fully off-canvas, at which point they deactivate and free their slot. This prevents events from vanishing mid-screen and creates natural self-throttling.

```ts
// Example — shooting stars:
for (let i = 0; i < shootingStars.length; i++) {
  const ss = shootingStars[i];
  if (!ss.active) continue;
  ss.life -= dtCapped;
  ss.x += ss.vx * dtCapped;
  ss.y += ss.vy * dtCapped;
  ss.trail.push({ x: ss.x, y: ss.y });
  if (ss.trail.length > SHOOTING_STAR_TRAIL_LEN) ss.trail.shift();
  // Only deactivate when off-screen
  if (ss.x < -50 || ss.x > state.w + 50 || ss.y < -50 || ss.y > state.h + 50) {
    ss.active = false;
  }
}
if (countActiveEvents(state) < MAX_ACTIVE_EVENTS && Math.random() < SHOOTING_STAR_SPAWN_RATE) {
  spawnShootingStar(state);
}
```

**Stationary events** (solar flares, warp flashes) keep life-based deactivation but also check the global cap before spawning.

---

## drawSolarSystem(state, ctx)

### Draw Order (13 layers)

1. **Clear** — `ctx.clearRect(0, 0, w, h)`
2. **Stars** — 200 twinkling white dots with `globalAlpha = opacity`
3. **Orbit path ellipses** — faint `rgba(255,255,255,0.04)` ellipses for each planet
4. **Asteroid belt** — 120 brown `#968264` dots on elliptical orbits
5. **Sun** — 3 layers: outer pulsing glow (20–60px `shadowBlur`), mid `#ffaa00`, bright core `#ffffaa`
6. **Solar flares** — 5 curved plasma strands (teal `#00ffcc` or amber `#ffaa00`), peak alpha at 30% life
7. **Planet trails** — fading line segments, tail→head
8. **Planets** — glow pass (`shadowBlur: 10`) + solid core. Saturn gets 2 elliptical rings before planet
9. **Moons** — small circles around Earth and Jupiter
10. **Shooting stars** — fading trail + bright head (head fades with `Math.max(0, life/maxLife)`)
11. **Comets** — long icy-blue trail (60 pts, tapering width) + white head glow
12. **Meteors** — orange trail particles + jagged rotating polygon + smoke puff behind
13. **UFOs** — saucer + dome + light beam + 3 blinking belly lights (white/magenta/white)
14. **Satellites** — ISS-style body + solar panels + blinking red/white nav lights
15. **Warp flashes** — expanding ring (→80px) + center flash at random coords

---

## Performance

- `dt` capped at `0.05`
- All arrays pre-allocated at init — **no `new` calls in the update loop**
- Indexed `for` loops everywhere — no `forEach`, no `map` in hot paths
- `ctx.save()` / `ctx.restore()` around every glow pass
- `ctx.shadowBlur = 0` after every glowing element
- Trail arrays managed with `push()` + `shift()` (no `splice`)
- Global event cap (`MAX_ACTIVE_EVENTS = 10`) prevents render overload
- No `document.hidden` pausing (consistent with other scenes)

---

## Registration in canvas-background.tsx

```ts
// Import
import { createSolarSystem, updateSolarSystem, drawSolarSystem, type SolarSystemState } from "./solar-system-scene"

// SceneMode type
type SceneMode = "draw" | "bounce" | "revenge" | "aquarium" | "neonField" | "solarSystem"

// allScenes entry
{ name: "solarSystem", mode: "solarSystem", color: "#ffaa00", speed: 0, lines: [] }

// State variable
let solarSystemState: SolarSystemState | null = null

// Tick handler (in tick function)
if (scene.mode === "solarSystem" && solarSystemState) {
  solarSystemState.w = w; solarSystemState.h = h;
  updateSolarSystem(solarSystemState, dt);
  drawSolarSystem(solarSystemState, ctx!);
  return;
}

// Init (after resize())
if (scene.mode === "solarSystem") solarSystemState = createSolarSystem(w, h);

// Resize (in resize function)
if (scene.mode === "solarSystem" && solarSystemState) {
  solarSystemState = createSolarSystem(w, h);
}
```
