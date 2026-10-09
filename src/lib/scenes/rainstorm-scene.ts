// =============================================================================
// rainstorm-scene.ts  –  Stormy rainstorm with depth, wind, and lightning
// =============================================================================
// Three parallax rain layers, puddle rings on the ground, rolling thunder
// flashes, and forked lightning bolts.
// Drop-in module; exports createRainstorm / updateRainstorm / drawRainstorm.
// =============================================================================

// ---- Interfaces ----

interface RainDrop {
  x: number;
  y: number;
  speed: number;    // px/sec
  length: number;   // pixels
  opacity: number;
  layer: 0 | 1 | 2; // 0=far, 1=mid, 2=near
}

interface PuddleRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface LightningBolt {
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  age: number;
  maxAge: number;
  brightness: number;
}

export interface RainstormState {
  w: number;
  h: number;
  time: number;
  windAngle: number;       // radians, tilt of rain (positive = right lean)
  windTarget: number;
  windChangeTimer: number;
  windChangePeriod: number;
  drops: RainDrop[];
  puddles: PuddleRing[];
  lightning: LightningBolt | null;
  flashAlpha: number;      // full-screen flash overlay
  nextLightningIn: number; // seconds until next strike
  lastLightningTime: number;
  fogLayers: Array<{ xOffset: number; speed: number; opacity: number }>;
}

// ---- Constants ----

const DROP_COUNTS = [280, 160, 80]; // far, mid, near
const DROP_SPEEDS = [600, 380, 220];
const DROP_LENGTHS = [8, 14, 22];
const DROP_OPACITIES = [0.18, 0.38, 0.65];
const PUDDLE_COUNT = 40;
const FOG_LAYER_COUNT = 3;

// ---- Helpers ----

function buildLightning(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  depth: number,
): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  if (depth === 0 || Math.hypot(targetX - x, targetY - y) < 8) {
    return [{ x1: x, y1: y, x2: targetX, y2: targetY }];
  }
  const midX = (x + targetX) / 2 + (Math.random() - 0.5) * 60 * (depth / 4);
  const midY = (y + targetY) / 2 + (Math.random() - 0.5) * 20 * (depth / 4);
  const segs = [
    ...buildLightning(x, y, midX, midY, depth - 1),
    ...buildLightning(midX, midY, targetX, targetY, depth - 1),
  ];
  // Random fork branch
  if (depth >= 3 && Math.random() < 0.45) {
    const forkEndX = midX + (Math.random() - 0.5) * 120;
    const forkEndY = midY + Math.random() * 80 + 40;
    segs.push(...buildLightning(midX, midY, forkEndX, forkEndY, depth - 2));
  }
  return segs;
}

function spawnLightning(w: number, h: number): LightningBolt {
  const x = w * (0.1 + Math.random() * 0.8);
  const targetX = x + (Math.random() - 0.5) * w * 0.3;
  const targetY = h * (0.55 + Math.random() * 0.3);
  const segs = buildLightning(x, 0, targetX, targetY, 5);
  return {
    segments: segs,
    age: 0,
    maxAge: 0.18 + Math.random() * 0.14,
    brightness: 0.85 + Math.random() * 0.15,
  };
}

// ---- Public API ----

export function createRainstorm(w: number, h: number): RainstormState {
  const drops: RainDrop[] = [];

  for (let layer = 0 as 0 | 1 | 2; layer < 3; layer++) {
    const count = DROP_COUNTS[layer];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * (w * 1.4) - w * 0.2,
        y: Math.random() * h,
        speed: DROP_SPEEDS[layer] * (0.8 + Math.random() * 0.4),
        length: DROP_LENGTHS[layer] * (0.7 + Math.random() * 0.6),
        opacity: DROP_OPACITIES[layer] * (0.7 + Math.random() * 0.6),
        layer,
      });
    }
  }

  const puddles: PuddleRing[] = [];
  for (let i = 0; i < PUDDLE_COUNT; i++) {
    const max = 6 + Math.random() * 12;
    puddles.push({
      x: Math.random() * w,
      y: h,
      radius: Math.random() * max,
      maxRadius: max,
      opacity: 0,
    });
  }

  const fogLayers = Array.from({ length: FOG_LAYER_COUNT }, (_, i) => ({
    xOffset: Math.random() * w,
    speed: (8 + i * 5) * (Math.random() < 0.5 ? 1 : -1),
    opacity: 0.04 + i * 0.02,
  }));

  return {
    w,
    h,
    time: 0,
    windAngle: 0.18,
    windTarget: 0.18,
    windChangeTimer: 0,
    windChangePeriod: 4 + Math.random() * 4,
    drops,
    puddles,
    lightning: null,
    flashAlpha: 0,
    nextLightningIn: 3 + Math.random() * 5,
    lastLightningTime: -99,
    fogLayers,
  };
}

export function updateRainstorm(state: RainstormState, dt: number): void {
  const { w, h } = state;
  state.time += dt;
  const dtCapped = Math.min(dt, 0.05);

  // Wind
  state.windChangeTimer += dtCapped;
  if (state.windChangeTimer >= state.windChangePeriod) {
    state.windChangeTimer = 0;
    state.windChangePeriod = 4 + Math.random() * 4;
    state.windTarget = 0.08 + Math.random() * 0.3;
    if (Math.random() < 0.2) state.windTarget *= -1;
  }
  state.windAngle += (state.windTarget - state.windAngle) * dtCapped * 0.8;

  // Rain drops
  const sinWind = Math.sin(state.windAngle);
  const cosWind = Math.cos(state.windAngle);
  for (const d of state.drops) {
    const speedScale = [1.0, 0.72, 0.45][d.layer];
    d.x += sinWind * d.speed * speedScale * dtCapped;
    d.y += cosWind * d.speed * speedScale * dtCapped;

    if (d.y > h + d.length) {
      // Spawn a puddle ring when a mid/near drop hits ground
      if (d.layer >= 1 && Math.random() < 0.3) {
        const oldest = state.puddles.reduce((a, b) => (a.opacity < b.opacity ? a : b));
        const max = d.layer === 2 ? 10 + Math.random() * 8 : 6 + Math.random() * 6;
        oldest.x = d.x;
        oldest.y = h - 1;
        oldest.radius = 1;
        oldest.maxRadius = max;
        oldest.opacity = d.layer === 2 ? 0.55 : 0.35;
      }
      d.y = -d.length - Math.random() * h * 0.3;
      d.x = Math.random() * (w * 1.4) - w * 0.2;
    }
    if (d.x > w + 60) d.x -= w + 120;
    if (d.x < -60) d.x += w + 120;
  }

  // Puddle rings
  for (const p of state.puddles) {
    if (p.opacity <= 0) continue;
    p.radius += (p.maxRadius / 0.6) * dtCapped;
    p.opacity -= (p.opacity / 0.5) * dtCapped;
    if (p.radius >= p.maxRadius) p.opacity = 0;
  }

  // Fog drift
  for (const fog of state.fogLayers) {
    fog.xOffset += fog.speed * dtCapped;
    if (fog.xOffset > w * 2) fog.xOffset -= w * 2;
    if (fog.xOffset < -w * 2) fog.xOffset += w * 2;
  }

  // Lightning countdown
  state.nextLightningIn -= dtCapped;
  if (state.nextLightningIn <= 0 && !state.lightning) {
    state.lightning = spawnLightning(w, h);
    state.flashAlpha = state.lightning.brightness * 0.55;
    state.lastLightningTime = state.time;
    state.nextLightningIn = 6 + Math.random() * 12;
  }

  // Advance active lightning
  if (state.lightning) {
    state.lightning.age += dtCapped;
    if (state.lightning.age >= state.lightning.maxAge) {
      state.lightning = null;
    }
  }

  // Fade flash
  if (state.flashAlpha > 0) {
    state.flashAlpha -= dtCapped * 3.5;
    if (state.flashAlpha < 0) state.flashAlpha = 0;
  }
}

export function drawRainstorm(state: RainstormState, ctx: CanvasRenderingContext2D): void {
  const { w, h } = state;

  // Sky gradient — stormy dark blue-grey
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#06080f');
  skyGrad.addColorStop(0.6, '#0a0e1a');
  skyGrad.addColorStop(1, '#080c14');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Lightning flash overlay
  if (state.flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = state.flashAlpha * 0.35;
    ctx.fillStyle = '#b8d4ff';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Fog bands (horizontal wisps drifting across)
  for (const fog of state.fogLayers) {
    const fogGrad = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.75);
    fogGrad.addColorStop(0, 'rgba(30,50,80,0)');
    fogGrad.addColorStop(0.4, `rgba(30,50,80,${fog.opacity})`);
    fogGrad.addColorStop(0.6, `rgba(30,50,80,${fog.opacity})`);
    fogGrad.addColorStop(1, 'rgba(30,50,80,0)');
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = fogGrad;
    // Offset horizontally to simulate drift
    const offset = (fog.xOffset % w) - w;
    ctx.fillRect(offset, 0, w * 2, h);
    ctx.restore();
  }

  // Rain — far layer
  ctx.save();
  ctx.lineCap = 'round';
  for (const d of state.drops) {
    if (d.layer !== 0) continue;
    const sinA = Math.sin(state.windAngle);
    const cosA = Math.cos(state.windAngle);
    ctx.globalAlpha = d.opacity;
    ctx.strokeStyle = '#8ab4cc';
    ctx.lineWidth = 0.6;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - sinA * d.length, d.y - cosA * d.length);
    ctx.stroke();
  }
  ctx.restore();

  // Rain — mid layer
  ctx.save();
  ctx.lineCap = 'round';
  for (const d of state.drops) {
    if (d.layer !== 1) continue;
    const sinA = Math.sin(state.windAngle);
    const cosA = Math.cos(state.windAngle);
    ctx.globalAlpha = d.opacity;
    ctx.strokeStyle = '#a8cce0';
    ctx.lineWidth = 1.1;
    ctx.shadowColor = '#a8cce0';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - sinA * d.length, d.y - cosA * d.length);
    ctx.stroke();
  }
  ctx.restore();

  // Rain — near layer (brightest, with slight glow)
  ctx.save();
  ctx.lineCap = 'round';
  for (const d of state.drops) {
    if (d.layer !== 2) continue;
    const sinA = Math.sin(state.windAngle);
    const cosA = Math.cos(state.windAngle);
    ctx.globalAlpha = d.opacity;
    ctx.strokeStyle = '#cce4f5';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#aad4f0';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - sinA * d.length, d.y - cosA * d.length);
    ctx.stroke();
  }
  ctx.restore();

  // Puddle rings on ground
  ctx.save();
  for (const p of state.puddles) {
    if (p.opacity <= 0.01) continue;
    ctx.globalAlpha = p.opacity;
    ctx.strokeStyle = '#88bbdd';
    ctx.lineWidth = 0.8;
    ctx.shadowColor = '#88bbdd';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // City glow rising from below — warm orange/amber light from unseen buildings
  const cityGlow = ctx.createLinearGradient(0, h, 0, h * 0.55);
  cityGlow.addColorStop(0,   'rgba(180,90,20,0.18)');
  cityGlow.addColorStop(0.3, 'rgba(140,60,10,0.10)');
  cityGlow.addColorStop(0.7, 'rgba(80,30,5,0.04)');
  cityGlow.addColorStop(1,   'transparent');
  ctx.fillStyle = cityGlow;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Ground wet sheen — subtle horizontal gradient near bottom
  const groundGrad = ctx.createLinearGradient(0, h * 0.88, 0, h);
  groundGrad.addColorStop(0, 'rgba(10,20,40,0)');
  groundGrad.addColorStop(1, 'rgba(20,40,70,0.22)');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);

  // Lightning bolt
  if (state.lightning) {
    const bolt = state.lightning;
    const progress = bolt.age / bolt.maxAge;
    // Flicker: bright at first, fades and flickers
    const flicker = progress > 0.5 ? Math.random() * 0.6 + 0.2 : 1;
    const alpha = (1 - progress) * flicker * bolt.brightness;

    ctx.save();
    // Thick outer glow
    ctx.globalAlpha = alpha * 0.4;
    ctx.strokeStyle = '#88aaff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#8899ff';
    ctx.shadowBlur = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const seg of bolt.segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();

    // Mid glow
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = '#bbccff';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    for (const seg of bolt.segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();

    // Bright core
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (const seg of bolt.segments) {
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
    }
    ctx.stroke();
    ctx.restore();
  }
}
