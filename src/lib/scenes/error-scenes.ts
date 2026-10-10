// =============================================================================
// error-scenes.ts  –  Canvas scenes for HTTP error pages
// =============================================================================
// 404 → glitching corrupted draw (the broken Seattle skyline, finally explained)
// 500 → BLOOSHOO logo bouncing, falling apart, crashing, catching fire
// 403 → neon door with lock, red force-field pulses
// 503 → droopy slow synthwave grid, Zzz bubbles
// =============================================================================

// ---- Shared types ----

export type ErrorSceneKind = '404' | '500' | '403' | '503';

// ============================================================
// 404 — GLITCH
// ============================================================

interface GlitchSegment {
  x1: number; y1: number; x2: number; y2: number;
}

interface ScanTear {
  y: number;
  height: number;
  offsetX: number;
  life: number;
  maxLife: number;
}

interface NoiseBlock {
  x: number; y: number; w: number; h: number;
  life: number; maxLife: number;
  color: string;
}

export interface Glitch404State {
  kind: '404';
  w: number; h: number; time: number;
  segments: GlitchSegment[];
  lineIdx: number;
  lineProgress: number;
  tears: ScanTear[];
  noiseBlocks: NoiseBlock[];
  nextTear: number;
  nextNoise: number;
  glitchIntensity: number;
  glitchTarget: number;
  glitchChangeTimer: number;
}

// Simplified skyline — same segment data as CanvasBackground but we OWN the corruption here
const SKYLINE_SEGS: GlitchSegment[] = [
  { x1: 0.0, y1: 0.88, x2: 1.0, y2: 0.88 },
  { x1: 0.5, y1: 0.88, x2: 0.5, y2: 0.18 },
  { x1: 0.37, y1: 0.88, x2: 0.5, y2: 0.67 },
  { x1: 0.63, y1: 0.88, x2: 0.5, y2: 0.67 },
  { x1: 0.46, y1: 0.67, x2: 0.54, y2: 0.67 },
  { x1: 0.34, y1: 0.52, x2: 0.66, y2: 0.52 },
  { x1: 0.37, y1: 0.44, x2: 0.63, y2: 0.44 },
  { x1: 0.34, y1: 0.52, x2: 0.37, y2: 0.44 },
  { x1: 0.66, y1: 0.52, x2: 0.63, y2: 0.44 },
  { x1: 0.42, y1: 0.38, x2: 0.58, y2: 0.38 },
  { x1: 0.37, y1: 0.44, x2: 0.42, y2: 0.38 },
  { x1: 0.63, y1: 0.44, x2: 0.58, y2: 0.38 },
  { x1: 0.48, y1: 0.3, x2: 0.52, y2: 0.3 },
  { x1: 0.02, y1: 0.88, x2: 0.02, y2: 0.62 },
  { x1: 0.02, y1: 0.62, x2: 0.1, y2: 0.62 },
  { x1: 0.1, y1: 0.88, x2: 0.1, y2: 0.62 },
  { x1: 0.12, y1: 0.88, x2: 0.12, y2: 0.5 },
  { x1: 0.12, y1: 0.5, x2: 0.18, y2: 0.5 },
  { x1: 0.18, y1: 0.88, x2: 0.18, y2: 0.5 },
  { x1: 0.28, y1: 0.88, x2: 0.28, y2: 0.44 },
  { x1: 0.28, y1: 0.44, x2: 0.35, y2: 0.44 },
  { x1: 0.35, y1: 0.88, x2: 0.35, y2: 0.44 },
  { x1: 0.6, y1: 0.88, x2: 0.6, y2: 0.4 },
  { x1: 0.6, y1: 0.4, x2: 0.68, y2: 0.4 },
  { x1: 0.68, y1: 0.88, x2: 0.68, y2: 0.4 },
  { x1: 0.88, y1: 0.88, x2: 0.88, y2: 0.48 },
  { x1: 0.88, y1: 0.48, x2: 0.96, y2: 0.48 },
  { x1: 0.96, y1: 0.88, x2: 0.96, y2: 0.48 },
];

export function createGlitch404(w: number, h: number): Glitch404State {
  return {
    kind: '404', w, h, time: 0,
    segments: SKYLINE_SEGS,
    lineIdx: 0, lineProgress: 0,
    tears: [], noiseBlocks: [],
    nextTear: 0.3 + Math.random() * 0.4,
    nextNoise: 0.1 + Math.random() * 0.2,
    glitchIntensity: 0.4,
    glitchTarget: 0.4,
    glitchChangeTimer: 0,
  };
}

export function updateGlitch404(state: Glitch404State, dt: number): void {
  const dtC = Math.min(dt, 0.05);
  state.time += dtC;

  // Advance drawing progress (never finishes — keeps restarting with new corruption)
  const speed = 120;
  const seg = state.segments[state.lineIdx];
  if (seg) {
    const len = Math.hypot((seg.x2 - seg.x1) * state.w, (seg.y2 - seg.y1) * state.h);
    const t = len > 0 ? dtC / (len / speed) : 1;
    state.lineProgress += t;
    if (state.lineProgress >= 1) {
      state.lineProgress = 0;
      state.lineIdx = (state.lineIdx + 1) % state.segments.length;
      // Random reset to random position
      if (Math.random() < 0.12) {
        state.lineIdx = Math.floor(Math.random() * state.segments.length);
      }
    }
  }

  // Glitch intensity waves
  state.glitchChangeTimer += dtC;
  if (state.glitchChangeTimer > 0.6 + Math.random() * 0.8) {
    state.glitchChangeTimer = 0;
    state.glitchTarget = Math.random() < 0.3 ? 0.9 + Math.random() * 0.1 : 0.2 + Math.random() * 0.5;
  }
  state.glitchIntensity += (state.glitchTarget - state.glitchIntensity) * dtC * 4;

  // Scan tears
  state.nextTear -= dtC;
  if (state.nextTear <= 0) {
    state.nextTear = 0.15 + Math.random() * 0.5 * (1 - state.glitchIntensity * 0.5);
    const life = 0.06 + Math.random() * 0.14;
    state.tears.push({
      y: Math.random() * state.h,
      height: 2 + Math.random() * 18,
      offsetX: (Math.random() - 0.5) * 80 * state.glitchIntensity,
      life, maxLife: life,
    });
  }
  for (let i = state.tears.length - 1; i >= 0; i--) {
    state.tears[i].life -= dtC;
    if (state.tears[i].life <= 0) state.tears.splice(i, 1);
  }

  // Noise blocks
  state.nextNoise -= dtC;
  if (state.nextNoise <= 0) {
    state.nextNoise = 0.05 + Math.random() * 0.3 * (1 - state.glitchIntensity * 0.4);
    const colors = ['#00ffcc', '#ff0044', '#00aaff', '#ff44ff', '#ffffff'];
    const life = 0.04 + Math.random() * 0.12;
    state.noiseBlocks.push({
      x: Math.random() * state.w,
      y: Math.random() * state.h,
      w: 4 + Math.random() * 40 * state.glitchIntensity,
      h: 2 + Math.random() * 10,
      life, maxLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  for (let i = state.noiseBlocks.length - 1; i >= 0; i--) {
    state.noiseBlocks[i].life -= dtC;
    if (state.noiseBlocks[i].life <= 0) state.noiseBlocks.splice(i, 1);
  }
}

export function drawGlitch404(state: Glitch404State, ctx: CanvasRenderingContext2D): void {
  const { w, h, segments, lineIdx, lineProgress, glitchIntensity } = state;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  // Scan lines overlay
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
  ctx.restore();

  // Noise blocks (behind lines)
  for (const nb of state.noiseBlocks) {
    ctx.save();
    ctx.globalAlpha = (nb.life / nb.maxLife) * 0.7;
    ctx.fillStyle = nb.color;
    ctx.fillRect(nb.x, nb.y, nb.w, nb.h);
    ctx.restore();
  }

  // Draw completed segments — each potentially glitched
  const chromaShift = glitchIntensity * 6;
  for (let i = 0; i < lineIdx; i++) {
    const s = segments[i];
    const x1 = s.x1 * w; const y1 = s.y1 * h;
    const x2 = s.x2 * w; const y2 = s.y2 * h;

    const shouldGlitch = Math.random() < glitchIntensity * 0.4;
    const glitchDx = shouldGlitch ? (Math.random() - 0.5) * 20 * glitchIntensity : 0;
    const flickerAlpha = 0.6 + Math.random() * 0.4;

    // Chroma split — red channel
    if (chromaShift > 1) {
      ctx.save();
      ctx.globalAlpha = flickerAlpha * 0.5;
      ctx.strokeStyle = '#ff0044';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(x1 + glitchDx + chromaShift, y1);
      ctx.lineTo(x2 + glitchDx + chromaShift, y2);
      ctx.stroke();
      ctx.restore();

      // Cyan channel
      ctx.save();
      ctx.globalAlpha = flickerAlpha * 0.5;
      ctx.strokeStyle = '#00ffee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1 + glitchDx - chromaShift, y1);
      ctx.lineTo(x2 + glitchDx - chromaShift, y2);
      ctx.stroke();
      ctx.restore();
    }

    // Main line
    ctx.save();
    ctx.globalAlpha = flickerAlpha * (shouldGlitch ? 0.3 : 1);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = shouldGlitch ? 20 : 10;
    ctx.beginPath();
    ctx.moveTo(x1 + glitchDx, y1);
    ctx.lineTo(x2 + glitchDx, y2);
    ctx.stroke();
    ctx.restore();
  }

  // Current partial segment
  if (lineIdx < segments.length) {
    const s = segments[lineIdx];
    const x1 = s.x1 * w; const y1 = s.y1 * h;
    const cx = (s.x1 + (s.x2 - s.x1) * lineProgress) * w;
    const cy = (s.y1 + (s.y2 - s.y1) * lineProgress) * h;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    // Cursor dot
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Scan tears (drawn over everything)
  for (const tear of state.tears) {
    const progress = tear.life / tear.maxLife;
    ctx.save();
    ctx.globalAlpha = progress * 0.85;
    // Copy a horizontal band and shift it
    try {
      const imageData = ctx.getImageData(0, tear.y, w, tear.height);
      ctx.putImageData(imageData, tear.offsetX, tear.y);
      ctx.putImageData(imageData, tear.offsetX - w * Math.sign(tear.offsetX) * 0.5, tear.y);
    } catch {
      // getImageData can fail in some contexts
    }
    ctx.restore();
  }
}

// ============================================================
// 500 — EXPLOSION
// ============================================================

interface Fragment {
  x1: number; y1: number; x2: number; y2: number;
  vx: number; vy: number;
  cx: number; cy: number; // pivot center
  rotation: number; rotSpeed: number;
  alpha: number;
  landed: boolean;
  color: string;
}

interface FireParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  color: string;
}

type Explosion500Phase = 'bounce' | 'breaking' | 'explode' | 'fire';

export interface Explosion500State {
  kind: '500';
  w: number; h: number; time: number;
  phase: Explosion500Phase;
  phaseTimer: number;
  // Bounce state
  bx: number; by: number; bvx: number; bvy: number;
  sparkTimer: number;
  // Fragments (explode + fire phase)
  fragments: Fragment[];
  fire: FireParticle[];
  fireOriginX: number;
  fireOriginY: number;
  // Breaking phase shake
  shakeAmp: number;
}

const LOGO_W = 110;
const LOGO_H = 66;

function getLogoLines(): Array<{ x1: number; y1: number; x2: number; y2: number }> {
  const pad = 0.04; const r = 0.06; const re = 0.82;
  return [
    // border
    { x1: pad + r, y1: pad, x2: re, y2: pad },
    { x1: pad + r, y1: 1 - pad, x2: re, y2: 1 - pad },
    { x1: pad, y1: pad + r, x2: pad, y2: 1 - pad - r },
    { x1: re, y1: pad + r, x2: re, y2: 1 - pad - r },
    { x1: pad, y1: pad + r, x2: pad + r * 0.3, y2: pad },
    { x1: re, y1: pad + r, x2: re - r * 0.3, y2: pad },
    { x1: pad, y1: 1 - pad - r, x2: pad + r * 0.3, y2: 1 - pad },
    { x1: re, y1: 1 - pad - r, x2: re - r * 0.3, y2: 1 - pad },
    // B
    { x1: 0.06, y1: 0.2, x2: 0.06, y2: 0.48 },
    { x1: 0.06, y1: 0.2, x2: 0.18, y2: 0.2 },
    { x1: 0.18, y1: 0.2, x2: 0.18, y2: 0.33 },
    { x1: 0.06, y1: 0.33, x2: 0.18, y2: 0.33 },
    { x1: 0.18, y1: 0.33, x2: 0.18, y2: 0.48 },
    { x1: 0.06, y1: 0.48, x2: 0.18, y2: 0.48 },
    // L
    { x1: 0.23, y1: 0.2, x2: 0.23, y2: 0.48 },
    { x1: 0.23, y1: 0.48, x2: 0.35, y2: 0.48 },
    // O
    { x1: 0.4, y1: 0.2, x2: 0.54, y2: 0.2 },
    { x1: 0.4, y1: 0.2, x2: 0.4, y2: 0.48 },
    { x1: 0.4, y1: 0.48, x2: 0.54, y2: 0.48 },
    { x1: 0.54, y1: 0.2, x2: 0.54, y2: 0.48 },
    // O
    { x1: 0.59, y1: 0.2, x2: 0.73, y2: 0.2 },
    { x1: 0.59, y1: 0.2, x2: 0.59, y2: 0.48 },
    { x1: 0.59, y1: 0.48, x2: 0.73, y2: 0.48 },
    { x1: 0.73, y1: 0.2, x2: 0.73, y2: 0.48 },
    // S
    { x1: 0.06, y1: 0.52, x2: 0.18, y2: 0.52 },
    { x1: 0.06, y1: 0.52, x2: 0.06, y2: 0.65 },
    { x1: 0.06, y1: 0.65, x2: 0.18, y2: 0.65 },
    { x1: 0.18, y1: 0.65, x2: 0.18, y2: 0.8 },
    { x1: 0.06, y1: 0.8, x2: 0.18, y2: 0.8 },
    // H
    { x1: 0.23, y1: 0.52, x2: 0.23, y2: 0.8 },
    { x1: 0.23, y1: 0.65, x2: 0.35, y2: 0.65 },
    { x1: 0.35, y1: 0.52, x2: 0.35, y2: 0.8 },
    // O
    { x1: 0.4, y1: 0.52, x2: 0.54, y2: 0.52 },
    { x1: 0.4, y1: 0.52, x2: 0.4, y2: 0.8 },
    { x1: 0.4, y1: 0.8, x2: 0.54, y2: 0.8 },
    { x1: 0.54, y1: 0.52, x2: 0.54, y2: 0.8 },
    // O
    { x1: 0.59, y1: 0.52, x2: 0.73, y2: 0.52 },
    { x1: 0.59, y1: 0.52, x2: 0.59, y2: 0.8 },
    { x1: 0.59, y1: 0.8, x2: 0.73, y2: 0.8 },
    { x1: 0.73, y1: 0.52, x2: 0.73, y2: 0.8 },
  ];
}

export function createExplosion500(w: number, h: number): Explosion500State {
  return {
    kind: '500', w, h, time: 0,
    phase: 'bounce', phaseTimer: 0,
    bx: w * 0.3, by: h * 0.3,
    bvx: 90 + Math.random() * 40, bvy: 65 + Math.random() * 30,
    sparkTimer: 0,
    fragments: [], fire: [],
    fireOriginX: w / 2, fireOriginY: h * 0.75,
    shakeAmp: 0,
  };
}

function spawnFragments(state: Explosion500State): void {
  const lines = getLogoLines();
  const ox = state.bx; const oy = state.by;
  const cx = ox + LOGO_W / 2; const cy = oy + LOGO_H / 2;
  const colors = ['#00ffcc', '#ff4400', '#ffaa00', '#ff44ff', '#ffffff'];
  state.fragments = lines.map(l => {
    const wx1 = ox + l.x1 * LOGO_W; const wy1 = oy + l.y1 * LOGO_H;
    const wx2 = ox + l.x2 * LOGO_W; const wy2 = oy + l.y2 * LOGO_H;
    const fcx = (wx1 + wx2) / 2; const fcy = (wy1 + wy2) / 2;
    const dx = fcx - cx; const dy = fcy - cy;
    const dist = Math.hypot(dx, dy) + 1;
    const speed = 80 + Math.random() * 220;
    return {
      x1: wx1, y1: wy1, x2: wx2, y2: wy2,
      vx: (dx / dist) * speed + (Math.random() - 0.5) * 60,
      vy: (dy / dist) * speed + (Math.random() - 0.5) * 60 - 40,
      cx: fcx, cy: fcy,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 8,
      alpha: 1,
      landed: false,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });
}

export function updateExplosion500(state: Explosion500State, dt: number): void {
  const dtC = Math.min(dt, 0.05);
  state.time += dtC;
  state.phaseTimer += dtC;

  if (state.phase === 'bounce') {
    state.bx += state.bvx * dtC;
    state.by += state.bvy * dtC;
    if (state.bx <= 0) { state.bx = 0; state.bvx = Math.abs(state.bvx); }
    if (state.bx + LOGO_W >= state.w) { state.bx = state.w - LOGO_W; state.bvx = -Math.abs(state.bvx); }
    if (state.by <= 0) { state.by = 0; state.bvy = Math.abs(state.bvy); }
    if (state.by + LOGO_H >= state.h) { state.by = state.h - LOGO_H; state.bvy = -Math.abs(state.bvy); }
    if (state.phaseTimer > 2.5) { state.phase = 'breaking'; state.phaseTimer = 0; }
  }

  if (state.phase === 'breaking') {
    // Keep bouncing but with increasing shake
    state.bx += state.bvx * dtC;
    state.by += state.bvy * dtC;
    if (state.bx <= 0) { state.bx = 0; state.bvx = Math.abs(state.bvx); }
    if (state.bx + LOGO_W >= state.w) { state.bx = state.w - LOGO_W; state.bvx = -Math.abs(state.bvx); }
    if (state.by <= 0) { state.by = 0; state.bvy = Math.abs(state.bvy); }
    if (state.by + LOGO_H >= state.h) { state.by = state.h - LOGO_H; state.bvy = -Math.abs(state.bvy); }
    state.shakeAmp = state.phaseTimer * 3;
    if (state.phaseTimer > 1.5) {
      state.phase = 'explode';
      state.phaseTimer = 0;
      state.fireOriginX = state.bx + LOGO_W / 2;
      state.fireOriginY = state.by + LOGO_H / 2;
      spawnFragments(state);
    }
  }

  if (state.phase === 'explode') {
    let anyAirborne = false;
    for (const f of state.fragments) {
      if (f.landed) continue;
      anyAirborne = true;
      f.vx *= 0.995;
      f.vy += 200 * dtC; // gravity
      const dx = f.x2 - f.x1; const dy = f.y2 - f.y1;
      f.x1 += f.vx * dtC; f.y1 += f.vy * dtC;
      f.x2 = f.x1 + dx; f.y2 = f.y1 + dy;
      f.cx += f.vx * dtC; f.cy += f.vy * dtC;
      f.rotation += f.rotSpeed * dtC;
      if (f.cy > state.h * 0.85 || f.y2 > state.h * 0.9) {
        f.landed = true;
        f.vy = 0; f.vx = 0;
      }
    }
    if (!anyAirborne || state.phaseTimer > 3) {
      state.phase = 'fire';
      state.phaseTimer = 0;
      state.fireOriginX = state.fragments.length > 0
        ? state.fragments.reduce((s, f) => s + f.cx, 0) / state.fragments.length
        : state.w / 2;
      state.fireOriginY = state.h * 0.82;
    }
  }

  if (state.phase === 'fire') {
    // Spawn fire particles
    const rate = 40 + state.phaseTimer * 5;
    state.sparkTimer += dtC;
    while (state.sparkTimer > 1 / rate) {
      state.sparkTimer -= 1 / rate;
      const spread = 40 + Math.min(state.phaseTimer * 20, 80);
      const fireColors = ['#ff6600', '#ff3300', '#ffaa00', '#ffdd00', '#ff8800'];
      state.fire.push({
        x: state.fireOriginX + (Math.random() - 0.5) * spread,
        y: state.fireOriginY + Math.random() * 10,
        vx: (Math.random() - 0.5) * 25,
        vy: -(30 + Math.random() * 60),
        life: 0.6 + Math.random() * 0.8,
        maxLife: 1.4,
        size: 3 + Math.random() * 6,
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
      });
    }
    // Update fire particles
    for (let i = state.fire.length - 1; i >= 0; i--) {
      const p = state.fire[i];
      p.x += p.vx * dtC;
      p.y += p.vy * dtC;
      p.vy += 15 * dtC; // slight pull down at top
      p.vx *= 0.98;
      p.size *= 0.985;
      p.life -= dtC;
      if (p.life <= 0) state.fire.splice(i, 1);
    }
    // Also continue updating fragment alpha
    for (const f of state.fragments) {
      if (f.alpha > 0.2) f.alpha -= dtC * 0.05;
    }
  }
}

export function drawExplosion500(state: Explosion500State, ctx: CanvasRenderingContext2D): void {
  const { w, h } = state;
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  const lines = getLogoLines();

  if (state.phase === 'bounce' || state.phase === 'breaking') {
    const shake = state.phase === 'breaking'
      ? { x: (Math.random() - 0.5) * state.shakeAmp, y: (Math.random() - 0.5) * state.shakeAmp }
      : { x: 0, y: 0 };
    const ox = state.bx + shake.x;
    const oy = state.by + shake.y;
    const breakFlicker = state.phase === 'breaking' ? Math.random() : 1;
    const color = state.phase === 'breaking'
      ? (Math.random() < 0.3 ? '#ff4400' : '#00ffcc')
      : '#00ffcc';

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(LOGO_W, LOGO_H);
    ctx.globalAlpha = breakFlicker;
    for (const l of lines) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.025;
      ctx.shadowColor = color;
      ctx.shadowBlur = state.phase === 'breaking' ? 20 : 10;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // Fragments (explode + fire phase)
  if (state.fragments.length > 0) {
    for (const f of state.fragments) {
      ctx.save();
      ctx.translate(f.cx, f.cy);
      ctx.rotate(f.rotation);
      ctx.globalAlpha = f.alpha;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(f.x1 - f.cx, f.y1 - f.cy);
      ctx.lineTo(f.x2 - f.cx, f.y2 - f.cy);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Fire particles
  for (const p of state.fire) {
    const progress = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = progress * 0.9;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fire glow on ground
  if (state.phase === 'fire') {
    const glowIntensity = Math.min(state.phaseTimer / 1.5, 1);
    const glow = ctx.createRadialGradient(
      state.fireOriginX, state.fireOriginY, 0,
      state.fireOriginX, state.fireOriginY, 80 + glowIntensity * 40,
    );
    glow.addColorStop(0, `rgba(255,80,0,${0.18 * glowIntensity})`);
    glow.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.save();
    ctx.fillStyle = glow;
    ctx.fillRect(state.fireOriginX - 130, state.fireOriginY - 60, 260, 120);
    ctx.restore();
  }
}

// ============================================================
// 403 — FORBIDDEN DOOR
// ============================================================

interface ForceRing {
  radius: number;
  maxRadius: number;
  opacity: number;
}

export interface Forbidden403State {
  kind: '403';
  w: number; h: number; time: number;
  rings: ForceRing[];
  nextRing: number;
  lockScale: number; // 0→1 on spawn
  lockPhase: number;
  deniedFlash: number; // flashes "ACCESS DENIED"
  nextDenied: number;
}

export function createForbidden403(w: number, h: number): Forbidden403State {
  return {
    kind: '403', w, h, time: 0,
    rings: [],
    nextRing: 0.3,
    lockScale: 0, lockPhase: 0,
    deniedFlash: 0, nextDenied: 2 + Math.random() * 2,
  };
}

export function updateForbidden403(state: Forbidden403State, dt: number): void {
  const dtC = Math.min(dt, 0.05);
  state.time += dtC;
  state.lockPhase += dtC;

  // Animate lock snapping in
  if (state.lockScale < 1) state.lockScale = Math.min(1, state.lockScale + dtC * 3);

  // Force rings
  state.nextRing -= dtC;
  if (state.nextRing <= 0) {
    state.nextRing = 0.8 + Math.random() * 0.6;
    state.rings.push({ radius: 5, maxRadius: 100 + Math.random() * 60, opacity: 0.8 });
  }
  for (let i = state.rings.length - 1; i >= 0; i--) {
    const r = state.rings[i];
    r.radius += (r.maxRadius / 1.2) * dtC;
    r.opacity = (1 - r.radius / r.maxRadius) * 0.8;
    if (r.radius >= r.maxRadius) state.rings.splice(i, 1);
  }

  // ACCESS DENIED flash
  state.nextDenied -= dtC;
  if (state.nextDenied <= 0) {
    state.nextDenied = 2.5 + Math.random() * 3;
    state.deniedFlash = 0.5;
  }
  if (state.deniedFlash > 0) state.deniedFlash -= dtC * 2.5;
}

export function drawForbidden403(state: Forbidden403State, ctx: CanvasRenderingContext2D): void {
  const { w, h } = state;
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const doorTop = h * 0.22;
  const doorH = h * 0.52;
  const doorW = Math.min(w * 0.28, 200);
  const doorLeft = cx - doorW / 2;
  const color = '#ff2244';

  // Draw door frame
  function drawGlowLine(x1: number, y1: number, x2: number, y2: number, lw = 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = lw * 0.3;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  // Door outline
  drawGlowLine(doorLeft, doorTop + doorH * 0.06, doorLeft, doorTop + doorH); // left
  drawGlowLine(doorLeft + doorW, doorTop + doorH * 0.06, doorLeft + doorW, doorTop + doorH); // right
  drawGlowLine(doorLeft, doorTop + doorH, doorLeft + doorW, doorTop + doorH); // bottom
  // Arch at top
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, doorTop + doorH * 0.06, doorW / 2, Math.PI, 0);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.6;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, doorTop + doorH * 0.06, doorW / 2, Math.PI, 0);
  ctx.stroke();
  ctx.restore();

  // Vertical bars (prison-door vibes)
  const barCount = 4;
  for (let i = 0; i < barCount; i++) {
    const bx = doorLeft + doorW * ((i + 1) / (barCount + 1));
    drawGlowLine(bx, doorTop + doorH * 0.08, bx, doorTop + doorH - 2, 1.2);
  }

  // Horizontal crossbar
  drawGlowLine(doorLeft, doorTop + doorH * 0.5, doorLeft + doorW, doorTop + doorH * 0.5, 1.2);

  // Force field rings (radiating from door center)
  const ringCX = cx;
  const ringCY = doorTop + doorH * 0.5;
  for (const ring of state.rings) {
    ctx.save();
    ctx.globalAlpha = ring.opacity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(ringCX, ringCY, ring.radius * 1.4, ring.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Lock
  if (state.lockScale > 0) {
    const lcy = doorTop + doorH * 0.5;
    const ls = state.lockScale;
    const pulse = 0.85 + Math.sin(state.lockPhase * 2.5) * 0.15;
    ctx.save();
    ctx.translate(cx, lcy);
    ctx.scale(ls * pulse, ls * pulse);
    // Lock body
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(20,0,8,0.85)';
    const bw = 26; const bh = 20; const br = 4;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, 2, bw, bh, br);
    ctx.fill();
    ctx.stroke();
    // Lock shackle (arch)
    ctx.beginPath();
    ctx.arc(0, 2, 10, Math.PI, 0);
    ctx.stroke();
    // Keyhole
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 11, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-1.5, 11, 3, 7);
    ctx.restore();
  }

  // ACCESS DENIED flash text
  if (state.deniedFlash > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(state.deniedFlash, 1);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.font = `bold ${Math.min(w * 0.05, 28)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ACCESS DENIED', cx, doorTop + doorH + 40);
    ctx.restore();
  }
}

// ============================================================
// 503 — SLEEPING
// ============================================================

interface ZzzBubble {
  x: number; y: number;
  vy: number; size: number;
  opacity: number; life: number; maxLife: number;
}

export interface Sleep503State {
  kind: '503';
  w: number; h: number; time: number;
  gridOffset: number;
  zzzBubbles: ZzzBubble[];
  nextZzz: number;
  droopPhase: number;
}

export function createSleep503(w: number, h: number): Sleep503State {
  return {
    kind: '503', w, h, time: 0,
    gridOffset: 0,
    zzzBubbles: [],
    nextZzz: 0.8,
    droopPhase: 0,
  };
}

export function updateSleep503(state: Sleep503State, dt: number): void {
  const dtC = Math.min(dt, 0.05);
  state.time += dtC;
  state.droopPhase += dtC * 0.3;
  state.gridOffset = (state.gridOffset + dtC * 0.04) % 1;

  // Zzz bubbles
  state.nextZzz -= dtC;
  if (state.nextZzz <= 0) {
    state.nextZzz = 1.2 + Math.random() * 1.5;
    const life = 3 + Math.random() * 2;
    state.zzzBubbles.push({
      x: state.w / 2 + (Math.random() - 0.5) * 60,
      y: state.h * 0.38,
      vy: -(18 + Math.random() * 12),
      size: 14 + Math.random() * 10,
      opacity: 0.8,
      life, maxLife: life,
    });
  }
  for (let i = state.zzzBubbles.length - 1; i >= 0; i--) {
    const z = state.zzzBubbles[i];
    z.y += z.vy * dtC;
    z.x += Math.sin(state.time * 0.8 + i) * 8 * dtC;
    z.opacity = (z.life / z.maxLife) * 0.85;
    z.size *= 1 + dtC * 0.08;
    z.life -= dtC;
    if (z.life <= 0) state.zzzBubbles.splice(i, 1);
  }
}

export function drawSleep503(state: Sleep503State, ctx: CanvasRenderingContext2D): void {
  const { w, h } = state;

  // Dark sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#050508');
  sky.addColorStop(0.55, '#080b14');
  sky.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const hy = h * 0.48; // horizon
  const cx = w / 2;
  const dimColor = '#4422aa';
  const dimGlow = '#331188';

  // Dim sun (sleeping — no scanlines, just a dull disc)
  const sunR = Math.min(w, h) * 0.1;
  const sunGrad = ctx.createRadialGradient(cx, hy, 0, cx, hy, sunR);
  sunGrad.addColorStop(0, 'rgba(80,50,160,0.6)');
  sunGrad.addColorStop(0.5, 'rgba(50,30,100,0.3)');
  sunGrad.addColorStop(1, 'rgba(20,10,50,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, hy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Droopy perspective grid
  const VLINES = 9;
  const HLINES = 8;
  ctx.save();
  ctx.strokeStyle = dimColor;
  ctx.lineWidth = 0.8;
  ctx.shadowColor = dimGlow;
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.5;

  // Vertical lines converging at vanishing point (droopy — they sag via quadratic bezier)
  for (let i = 0; i <= VLINES; i++) {
    const t = i / VLINES;
    const bx = w * t;
    const droopAmt = Math.sin(state.droopPhase + t * Math.PI) * 15;
    ctx.beginPath();
    ctx.moveTo(cx, hy); // vanishing point
    const cpX = (cx + bx) / 2;
    const cpY = hy + (h - hy) * 0.4 + droopAmt;
    ctx.quadraticCurveTo(cpX, cpY, bx, h + 5);
    ctx.stroke();
  }

  // Horizontal lines (perspective, with vertical droop)
  for (let j = 0; j <= HLINES; j++) {
    const t = ((j / HLINES) + state.gridOffset) % 1;
    // Perspective: closer to bottom = wider gap
    const perspY = hy + (h - hy) * (t * t);
    // Width of line at this depth
    const depthT = t;
    const lx = cx - (cx) * depthT;
    const rx = cx + (cx) * depthT;
    const droop = Math.sin(state.droopPhase * 0.7 + j) * (6 * t);
    ctx.beginPath();
    ctx.moveTo(lx, perspY);
    ctx.quadraticCurveTo(cx, perspY + droop, rx, perspY);
    ctx.stroke();
  }
  ctx.restore();

  // Zzz bubbles
  ctx.save();
  ctx.font = 'bold var(--size)px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#8866cc';
  ctx.shadowColor = '#6644aa';
  for (const z of state.zzzBubbles) {
    ctx.save();
    ctx.globalAlpha = z.opacity;
    ctx.shadowBlur = 12;
    ctx.font = `bold ${z.size}px "Courier New", monospace`;
    ctx.fillText('z', z.x, z.y);
    ctx.restore();
  }
  ctx.restore();
}
