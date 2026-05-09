# Wireframe Globe Canvas Scene — Implementation Plan (v2)

## Overview

Add a new animated Earth globe scene to `components/canvas-background.tsx`. This follows the exact same architecture as the existing **Neon Field** and **Revenge** scenes: a self-contained module file with create/update/draw exports, registered in the `allScenes` array in `canvas-background.tsx`.

The globe should feel like you're in **low orbit** — large, dominating the background, slightly bleeding off screen on smaller viewports. Not a marble. Not a diagram. A planet.

---

## Files to Create / Modify

| Action | File |
|---|---|
| **Create** | `components/globe-scene.ts` |
| **Modify** | `components/canvas-background.tsx` — import the module + add entry to `allScenes` |

---

## Module Architecture

Model this file exactly after `components/neon-field.ts`. Export these four things:

```ts
export interface GlobeState { ... }
export function createGlobe(w: number, h: number): GlobeState
export function updateGlobe(state: GlobeState, dt: number): void
export function drawGlobe(state: GlobeState, ctx: CanvasRenderingContext2D): void
```

In `canvas-background.tsx`, add to the `allScenes` array following the same pattern as the neon field entry. Pass `canvas.width` and `canvas.height` to `createGlobe` on init, call `updateGlobe(state, deltaTime)` + `drawGlobe(state, ctx)` each frame.

Handle resize: call `createGlobe(newW, newH)` again to regenerate everything. Unlike neonField which survives resize by keeping absolute coords, the globe has a computed center point — if the window resizes without recreating, the globe center is wrong.

---

## TypeScript Interfaces

```ts
export interface GlobeState {
  cx: number                 // canvas center x
  cy: number                 // canvas center y
  radius: number             // globe radius in px
  rotation: number           // current surface longitude rotation in radians
  cloudRotation: number      // independent cloud layer rotation (faster than surface)
  stars: GlobeStar[]
  cloudPatches: CloudPatch[]
  cityLights: CityLight[]
  satellites: Satellite[]
  sceneTime: number
}

interface GlobeStar {
  x: number
  y: number
  radius: number
  baseOpacity: number
  opacity: number            // computed each frame from twinkle
  twinklePhase: number
  twinkleSpeed: number
}

interface CloudPatch {
  lat: number                // center latitude in radians
  lon: number                // center longitude in radians
  size: number               // angular radius (0.12–0.28 radians)
  opacity: number            // 0.3–0.7
  points: Array<[number, number]>  // pre-computed [lat, lon] offsets for blob shape
}

interface CityLight {
  lat: number                // radians
  lon: number                // radians
  opacity: number            // base brightness 0.4–1.0
}

interface Satellite {
  orbitRadius: number        // px from globe center
  inclination: number        // orbital tilt in radians
  angle: number              // current position along orbit
  speed: number              // radians/sec
  blinkPhase: number
  trail: Array<{ x: number; y: number }>
}
```

---

## createGlobe(w, h)

Run once on init and again on canvas resize.

```ts
cx = w / 2
cy = h / 2
radius = Math.min(w, h) * 0.52    // low orbit — large and dominating
rotation = Math.random() * Math.PI * 2
cloudRotation = Math.random() * Math.PI * 2
sceneTime = 0
```

### Stars — generate 200
Random `x` in `[0, w]`, `y` in `[0, h]`. `radius` 0.5–1.5, `baseOpacity` 0.3–0.9, `opacity` initialized to `baseOpacity`, `twinklePhase` 0–2π, `twinkleSpeed` 0.4–1.2.

### Cloud Patches — generate 18

For each patch:
- `lat`: random −50° to 50° converted to radians
- `lon`: random 0–360° converted to radians
- `size`: random 0.12–0.28
- `opacity`: random 0.3–0.7
- `points`: generate 7 blob points. For each point, pick a random angle 0–2π and random distance `size * (0.5 + Math.random() * 0.5)`. Store as `[centerLat + dist*sin(angle), centerLon + dist*cos(angle)]`. These are fixed offsets — the whole patch moves with `cloudRotation` at draw time.

### City Lights

Hardcode the following real-world anchors (lat/lon in degrees, convert to radians on store):

```ts
const anchors: Array<[number, number]> = [
  [41, -74],    // New York
  [51, 0],      // London
  [36, 140],    // Tokyo
  [31, 121],    // Shanghai
  [19, 73],     // Mumbai
  [-24, -46],   // São Paulo
  [30, 31],     // Cairo
  [6, 3],       // Lagos
  [56, 37],     // Moscow
  [-34, 151],   // Sydney
  [34, -118],   // Los Angeles
  [42, -88],    // Chicago
  [48, 2],      // Paris
  [52, 13],     // Berlin
  [35, 139],    // Osaka
  [1, 104],     // Singapore
  [37, 127],    // Seoul
  [55, 82],     // Novosibirsk
  [-34, -58],   // Buenos Aires
  [30, 121],    // Hangzhou
]
```

Then add 20 more random scatter points: random lat −60° to 60°, random lon. These simulate smaller cities and lit-up regions. Each city light: `opacity` random 0.5–1.0.

### Satellites — define exactly 3

```ts
satellites = [
  {
    orbitRadius: radius * 1.10,
    inclination: 0.9,                    // ~51.6° — ISS-style
    angle: Math.random() * Math.PI * 2,
    speed: 0.08,
    blinkPhase: Math.random(),
    trail: []
  },
  {
    orbitRadius: radius * 1.15,
    inclination: Math.PI / 2 * 0.95,    // near-polar orbit
    angle: Math.random() * Math.PI * 2,
    speed: 0.06,
    blinkPhase: Math.random(),
    trail: []
  },
  {
    orbitRadius: radius * 1.22,
    inclination: 0.05,                   // near-equatorial / geostationary-ish
    angle: Math.random() * Math.PI * 2,
    speed: 0.02,
    blinkPhase: Math.random(),
    trail: []
  }
]
```

---

## updateGlobe(state, dt)

```ts
dt = Math.min(dt, 0.05)
state.sceneTime += dt

// Surface rotation — one full rotation every ~35 minutes
state.rotation += 0.003 * dt
if (state.rotation > Math.PI * 2) state.rotation -= Math.PI * 2

// Cloud rotation — 1.4× faster than surface
state.cloudRotation += 0.003 * 1.4 * dt
if (state.cloudRotation > Math.PI * 2) state.cloudRotation -= Math.PI * 2

// Star twinkle
for (let i = 0; i < state.stars.length; i++) {
  const s = state.stars[i]
  s.opacity = s.baseOpacity * (0.6 + 0.4 * Math.sin(state.sceneTime * s.twinkleSpeed + s.twinklePhase))
}

// Satellites
for (let i = 0; i < state.satellites.length; i++) {
  const sat = state.satellites[i]
  sat.angle += sat.speed * dt
  sat.blinkPhase += dt

  const { x, y, z } = projectSatellite(sat, state)
  if (z > 0) {
    sat.trail.push({ x, y })
    if (sat.trail.length > 24) sat.trail.shift()
  }
}
```

---

## Projection Helpers

Define these as module-internal functions (not exported).

### Surface point projection (orthographic)

```ts
function project(
  lat: number,
  lon: number,
  rotation: number,
  cx: number,
  cy: number,
  R: number
): { x: number; y: number; z: number } {
  const adjustedLon = lon + rotation
  const x = R * Math.cos(lat) * Math.sin(adjustedLon)
  const y = R * Math.sin(lat)
  const z = R * Math.cos(lat) * Math.cos(adjustedLon)
  return { x: cx + x, y: cy - y, z }
}
```

Z-based opacity for grid lines: `opacity = (z / R) * 0.55 + 0.08`, clamped to `[0, 1]`.

### Satellite projection

```ts
function projectSatellite(
  sat: Satellite,
  state: GlobeState
): { x: number; y: number; z: number } {
  const ox = Math.cos(sat.angle) * sat.orbitRadius
  const oy = Math.sin(sat.angle) * sat.orbitRadius * Math.sin(sat.inclination)
  const oz = Math.sin(sat.angle) * sat.orbitRadius * Math.cos(sat.inclination)

  // Rotate around Y axis by globe rotation so orbit stays fixed in space
  const cosR = Math.cos(state.rotation)
  const sinR = Math.sin(state.rotation)
  const rx = ox * cosR - oz * sinR
  const rz = ox * sinR + oz * cosR

  return {
    x: state.cx + rx,
    y: state.cy - oy,
    z: rz
  }
}
```

---

## drawGlobe(state, ctx)

### Full Draw Order

1. Clear
2. Stars
3. Atmosphere glow (first pass — behind globe)
4. Ocean fill
5. Continent fills
6. Grid lines (latitude + longitude + special lines)
7. Continent outlines (glowing stroke on top of fills)
8. Terminator line (day/night boundary)
9. City lights (night side only)
10. Cloud layer
11. Satellite orbit trails
12. Satellites
13. Atmosphere glow (second pass — rim on top for depth)

---

### 1. Clear
```ts
ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
```

### 2. Stars
```ts
for (let i = 0; i < state.stars.length; i++) {
  const s = state.stars[i]
  ctx.save()
  ctx.globalAlpha = s.opacity
  ctx.fillStyle = '#e8e8ff'
  ctx.beginPath()
  ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
```

### 3. Atmosphere Glow (behind)
```ts
ctx.save()
const atmoGrad = ctx.createRadialGradient(
  state.cx, state.cy, state.radius * 0.85,
  state.cx, state.cy, state.radius * 1.2
)
atmoGrad.addColorStop(0, 'rgba(0,255,204,0)')
atmoGrad.addColorStop(0.5, 'rgba(0,255,204,0.05)')
atmoGrad.addColorStop(0.85, 'rgba(0,170,255,0.12)')
atmoGrad.addColorStop(1, 'rgba(0,170,255,0)')
ctx.fillStyle = atmoGrad
ctx.beginPath()
ctx.arc(state.cx, state.cy, state.radius * 1.2, 0, Math.PI * 2)
ctx.fill()
ctx.restore()
```

### 4. Ocean Fill
```ts
ctx.save()
ctx.fillStyle = 'rgba(0,15,40,0.92)'
ctx.beginPath()
ctx.arc(state.cx, state.cy, state.radius, 0, Math.PI * 2)
ctx.fill()
ctx.restore()
```

### 5. Continent Fills

For each continent in the array, project all points and draw as a filled polygon. Lift the pen (reset `started`) when a point crosses to the back hemisphere:

```ts
for (const continent of continents) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,60,40,0.7)'
  ctx.beginPath()
  let started = false
  for (let i = 0; i < continent.coords.length; i++) {
    const [latDeg, lonDeg] = continent.coords[i]
    const lat = latDeg * Math.PI / 180
    const lon = lonDeg * Math.PI / 180
    const { x, y, z } = project(lat, lon, state.rotation, state.cx, state.cy, state.radius)
    if (z > -state.radius * 0.05) {
      if (!started) { ctx.moveTo(x, y); started = true }
      else { ctx.lineTo(x, y) }
    } else {
      started = false
    }
  }
  ctx.fill()
  ctx.restore()
}
```

### 6. Grid Lines

Regular latitude lines at −75, −60, −45, −30, −15, 15, 30, 45, 60, 75 degrees:
```ts
ctx.strokeStyle = 'rgba(0,255,204,0.10)'
ctx.lineWidth = 0.8
// sample every 2° of longitude, draw segments where z > 0
```

Special latitude lines — draw these brighter with glow:

| Line | Degrees | strokeStyle | shadowBlur |
|---|---|---|---|
| Equator | 0 | `rgba(0,255,204,0.45)` | 5 |
| Tropic of Cancer | 23.5 | `rgba(0,255,204,0.30)` | 3 |
| Tropic of Capricorn | −23.5 | `rgba(0,255,204,0.30)` | 3 |
| Arctic Circle | 66.5 | `rgba(0,200,255,0.25)` | 3 |
| Antarctic Circle | −66.5 | `rgba(0,200,255,0.25)` | 3 |

Longitude lines at every 15° (24 meridians):
```ts
ctx.strokeStyle = 'rgba(0,255,204,0.08)'
ctx.lineWidth = 0.8
// sample every 2° of latitude from −90 to 90
```

`ctx.save()` / `ctx.restore()` around each individual line. `shadowBlur = 0` after any glow pass.

### 7. Continent Outlines

Same loop as the fill pass, stroked on top:
```ts
ctx.strokeStyle = 'rgba(0,255,204,0.75)'
ctx.lineWidth = 1.2
ctx.shadowBlur = 5
ctx.shadowColor = '#00ffcc'
```
`shadowBlur = 0` after each continent.

### 8. Terminator Line (Day/Night Boundary)

The terminator sits at z ≈ 0 on the surface. Approximate by drawing the longitude line at `−state.rotation − π/2` with a warm amber color:

```ts
const terminatorLon = -state.rotation - Math.PI / 2
ctx.save()
ctx.strokeStyle = 'rgba(255,180,80,0.35)'
ctx.shadowBlur = 10
ctx.shadowColor = '#ffaa44'
ctx.lineWidth = 1.5
ctx.beginPath()
let started = false
for (let latDeg = -90; latDeg <= 90; latDeg += 2) {
  const lat = latDeg * Math.PI / 180
  // Pass rotation=0 here because terminatorLon already bakes in state.rotation
  const { x, y, z } = project(lat, terminatorLon, 0, state.cx, state.cy, state.radius)
  if (Math.abs(z) < state.radius * 0.3) {
    if (!started) { ctx.moveTo(x, y); started = true }
    else { ctx.lineTo(x, y) }
  } else {
    started = false
  }
}
ctx.stroke()
ctx.shadowBlur = 0
ctx.restore()
```

### 9. City Lights (Night Side Only)

```ts
for (let i = 0; i < state.cityLights.length; i++) {
  const city = state.cityLights[i]
  const { x, y, z } = project(city.lat, city.lon, state.rotation, state.cx, state.cy, state.radius)

  if (z < -state.radius * 0.05) {
    const nightDepth = Math.abs(z) / state.radius  // 0→1 as you go deeper into night side
    ctx.save()
    ctx.globalAlpha = nightDepth * city.opacity * 0.8
    ctx.fillStyle = '#ffee88'
    ctx.shadowBlur = 4
    ctx.shadowColor = '#ffcc44'
    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
  }
}
```

Cities near the terminator will be dim. Cities deep on the night side will be bright. The gradual reveal as the globe rotates is the best visual effect in this whole scene — make sure it's working.

### 10. Cloud Layer

```ts
for (let i = 0; i < state.cloudPatches.length; i++) {
  const cloud = state.cloudPatches[i]

  const centroid = project(cloud.lat, cloud.lon, state.cloudRotation, state.cx, state.cy, state.radius)
  if (centroid.z < 0) continue

  ctx.save()
  ctx.fillStyle = 'rgba(180,230,255,0.18)'
  ctx.shadowBlur = 8
  ctx.shadowColor = '#aaddff'
  ctx.globalAlpha = cloud.opacity * (centroid.z / state.radius)
  ctx.beginPath()
  let started = false
  for (let p = 0; p < cloud.points.length; p++) {
    const [latOff, lonOff] = cloud.points[p]
    const { x, y, z } = project(
      cloud.lat + latOff,
      cloud.lon + lonOff,
      state.cloudRotation,
      state.cx, state.cy, state.radius
    )
    if (z > 0) {
      if (!started) { ctx.moveTo(x, y); started = true }
      else { ctx.lineTo(x, y) }
    }
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}
```

### 11. Satellite Orbit Trails

```ts
for (let i = 0; i < state.satellites.length; i++) {
  const sat = state.satellites[i]
  if (sat.trail.length < 2) continue

  ctx.save()
  ctx.strokeStyle = '#00ffcc'
  ctx.lineWidth = 0.8
  for (let t = 1; t < sat.trail.length; t++) {
    const progress = t / sat.trail.length
    ctx.globalAlpha = progress * 0.25
    ctx.beginPath()
    ctx.moveTo(sat.trail[t - 1].x, sat.trail[t - 1].y)
    ctx.lineTo(sat.trail[t].x, sat.trail[t].y)
    ctx.stroke()
  }
  ctx.restore()
}
```

### 12. Satellites

```ts
for (let i = 0; i < state.satellites.length; i++) {
  const sat = state.satellites[i]
  const { x, y, z } = projectSatellite(sat, state)
  if (z <= 0) continue

  const travelAngle = sat.angle + Math.PI / 2

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(travelAngle)

  // Body
  ctx.fillStyle = '#aaaaaa'
  ctx.shadowBlur = 6
  ctx.shadowColor = '#aaccff'
  ctx.fillRect(-3, -1.5, 6, 3)

  // Solar panels
  ctx.shadowBlur = 0
  ctx.strokeStyle = '#4488ff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-6, 0); ctx.lineTo(-3, 0)
  ctx.moveTo(3, 0);  ctx.lineTo(6, 0)
  ctx.stroke()

  // Nav light blink ~1hz, alternates red/white
  const blink = Math.sin(sat.blinkPhase * Math.PI * 2) > 0
  ctx.fillStyle = blink ? '#ff4444' : '#ffffff'
  ctx.shadowBlur = blink ? 4 : 0
  ctx.shadowColor = '#ff4444'
  ctx.beginPath()
  ctx.arc(4, 0, 1.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}
```

### 13. Atmosphere Glow (second pass — rim on top)

```ts
ctx.save()
const rimGrad = ctx.createRadialGradient(
  state.cx, state.cy, state.radius * 0.95,
  state.cx, state.cy, state.radius * 1.08
)
rimGrad.addColorStop(0, 'rgba(0,200,255,0)')
rimGrad.addColorStop(0.7, 'rgba(0,200,255,0.08)')
rimGrad.addColorStop(1, 'rgba(0,255,204,0.18)')
ctx.fillStyle = rimGrad
ctx.beginPath()
ctx.arc(state.cx, state.cy, state.radius * 1.08, 0, Math.PI * 2)
ctx.fill()
ctx.restore()
```

---

## Continent Coordinate Arrays

```ts
const continents: Array<{ name: string; coords: Array<[number, number]> }> = [
  {
    name: 'North America',
    coords: [
      [70,-140],[72,-120],[70,-100],[60,-95],[50,-85],[46,-84],
      [44,-76],[48,-70],[45,-64],[38,-75],[30,-81],[24,-81],
      [20,-87],[15,-88],[10,-85],[8,-77],[10,-75],[20,-105],
      [22,-110],[28,-112],[30,-117],[34,-120],[38,-122],[48,-124],
      [54,-130],[58,-136],[60,-146],[66,-162],[68,-165],[70,-155],
      [70,-140],
    ],
  },
  {
    name: 'South America',
    coords: [
      [10,-73],[8,-63],[8,-60],[5,-52],[4,-50],[0,-50],
      [-5,-35],[-10,-37],[-15,-39],[-20,-40],[-23,-43],[-30,-51],
      [-34,-58],[-38,-62],[-42,-65],[-46,-66],[-50,-69],[-52,-69],
      [-54,-65],[-56,-67],[-55,-68],[-52,-75],[-46,-75],[-38,-73],
      [-30,-72],[-22,-70],[-18,-70],[-5,-81],[0,-80],[5,-77],
      [10,-73],
    ],
  },
  {
    name: 'Europe',
    coords: [
      [70,28],[68,18],[65,14],[58,5],[52,4],[48,-5],
      [44,-9],[36,-9],[36,-6],[38,-1],[40,3],[43,6],
      [44,14],[40,18],[38,22],[40,28],[42,28],[44,30],
      [46,30],[48,24],[50,18],[52,14],[54,18],[58,24],
      [60,25],[64,26],[68,28],[70,28],
    ],
  },
  {
    name: 'Africa',
    coords: [
      [36,-5],[36,10],[32,33],[28,34],[22,37],[12,43],
      [8,48],[2,42],[-2,42],[-5,40],[-10,38],[-15,36],
      [-18,36],[-22,35],[-26,33],[-30,31],[-34,26],[-35,20],
      [-34,18],[-30,17],[-24,15],[-18,12],[-12,14],[-6,13],
      [0,8],[4,2],[4,10],[6,1],[4,-2],[4,-9],
      [8,-15],[14,-17],[18,-16],[22,-17],[26,-15],[30,-10],
      [32,-2],[30,10],[28,16],[36,-5],
    ],
  },
  {
    name: 'Asia',
    coords: [
      [70,30],[70,60],[72,100],[70,140],[68,162],[60,162],
      [54,142],[46,142],[40,132],[36,128],[34,130],[36,126],
      [34,120],[30,122],[24,122],[22,114],[20,110],[10,104],
      [2,104],[2,100],[5,100],[5,80],[8,78],[12,80],
      [15,80],[20,73],[22,70],[24,62],[22,58],[16,52],
      [14,44],[18,40],[22,40],[28,35],[36,36],[40,36],
      [42,45],[44,50],[50,58],[56,60],[56,68],[60,70],
      [62,72],[66,68],[70,30],
    ],
  },
  {
    name: 'Australia',
    coords: [
      [-14,130],[-12,136],[-12,142],[-16,146],[-20,148],
      [-24,152],[-28,154],[-32,152],[-36,150],[-38,146],
      [-38,140],[-36,140],[-34,136],[-32,134],[-32,128],
      [-30,115],[-26,114],[-22,114],[-20,119],[-18,122],
      [-16,124],[-14,128],[-14,130],
    ],
  },
  {
    name: 'Antarctica',
    coords: [
      [-70,0],[-68,45],[-66,90],[-68,135],[-70,180],
      [-68,135],[-66,90],[-68,45],[-70,0],
    ],
  },
]
```

---

## Registration in canvas-background.tsx

At the top of the file add:
```ts
import { createGlobe, updateGlobe, drawGlobe, GlobeState } from './globe-scene'
```

Find the `allScenes` array and add a new entry following the exact same structure as existing entries. Call `createGlobe(canvas.width, canvas.height)` on init, `updateGlobe(state, deltaTime)` on update, `drawGlobe(state, ctx)` on draw.

> ⚠️ **Edit tool warning (from canvastuff.md):** The diff editor has been observed to fail on `canvas-background.tsx` even with exact match strings. If you hit this, spawn a sub-agent (fresh tool context fixes it) or use `sed` for targeted line replacements.

---

## Performance Requirements

- `dt` capped at `0.05` at the top of `updateGlobe`
- All arrays pre-allocated in `createGlobe` — **no `new` calls in the update loop**
- Indexed `for` loops everywhere — **no `forEach`, no `map` in hot paths**
- `ctx.save()` / `ctx.restore()` around every glow pass
- `ctx.shadowBlur = 0` after every glowing element
- Satellite trails use `shift()` to trim, not `splice()`
- Cloud blob projection: ~18 × 7 = 126 `project()` calls per frame — fine at 60fps, all pure math, no allocations

---

## Visual Tuning Notes

- If continent fills look blocky, add more coordinate points around tight coastal curves
- If the globe feels too flat, the double atmosphere pass (steps 3 + 13) should fix it — if not, bump the outer glow stop opacity slightly
- City lights are the showstopper — if they're too subtle, increase the `nightDepth * city.opacity * 0.8` multiplier to `1.2`
- Rotation speed `0.003 rad/s` = ~35 min per revolution. Bump to `0.008` during testing, decide on final speed after
- Cloud layer fill at `rgba(180,230,255,0.18)` is intentionally subtle — clouds hint at weather systems, they don't dominate
