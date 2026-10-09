// =============================================================================
// synthwave-scene.ts  –  Retrowave / Synthwave road scene
// =============================================================================
// Classic 80s perspective grid, neon sun with scan lines, jagged mountain
// silhouette, and twinkling stars.
// Drop-in module; exports createSynthwave / updateSynthwave / drawSynthwave.
// =============================================================================

// ---- Interfaces ----

interface SynthwaveStar {
  x: number;
  y: number;
  r: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface MountainPoint {
  xFrac: number;
  yFrac: number; // 0 = horizon top, 1 = at horizon baseline
}

export interface SynthwaveState {
  w: number;
  h: number;
  time: number;
  gridOffset: number; // 0..1 scroll cycle for horizontal grid lines
  cx: number; // vanishing point x
  hy: number; // horizon y
  sunR: number;
  stars: SynthwaveStar[];
  mountains: MountainPoint[];
}

// ---- Constants ----

const STAR_COUNT = 60;
const MOUNTAIN_POINT_COUNT = 22;
const GRID_LINES_V = 9;
const GRID_LINES_H = 10;
const GRID_SCROLL_SPEED = 0.38;

// ---- Helpers ----

function buildMountains(): MountainPoint[] {
  const pts: MountainPoint[] = [{ xFrac: 0, yFrac: 1 }];
  for (let i = 0; i <= MOUNTAIN_POINT_COUNT; i++) {
    const xFrac = i / MOUNTAIN_POINT_COUNT;
    // Base shape: two bumps via sin + random jaggedness
    const base = 0.35 + Math.sin(xFrac * Math.PI * 2.7 + 0.5) * 0.28;
    const noise = (Math.random() - 0.5) * 0.22;
    pts.push({ xFrac, yFrac: Math.max(0.05, Math.min(0.92, base + noise)) });
  }
  pts.push({ xFrac: 1, yFrac: 1 });
  return pts;
}

// ---- Public API ----

export function createSynthwave(w: number, h: number): SynthwaveState {
  const cx = w / 2;
  const hy = h * 0.44;
  const sunR = Math.min(w, h) * 0.16;

  const stars: SynthwaveStar[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * hy * 0.88,
      r: 0.5 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 1.6,
    });
  }

  return {
    w,
    h,
    time: 0,
    gridOffset: 0,
    cx,
    hy,
    sunR,
    stars,
    mountains: buildMountains(),
  };
}

export function updateSynthwave(state: SynthwaveState, dt: number): void {
  state.time += dt;
  state.gridOffset = (state.gridOffset + GRID_SCROLL_SPEED * dt) % 1;

  for (const star of state.stars) {
    star.twinklePhase += star.twinkleSpeed * dt;
  }
}

export function drawSynthwave(
  state: SynthwaveState,
  ctx: CanvasRenderingContext2D,
): void {
  const { w, h, cx, hy, sunR, stars, mountains, gridOffset } = state;

  // --- Sky ---
  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, "#0d0021");
  sky.addColorStop(0.45, "#3d0060");
  sky.addColorStop(1, "#dd005a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, hy);

  // --- Ground (below horizon) ---
  ctx.fillStyle = "#080010";
  ctx.fillRect(0, hy, w, h - hy);

  // --- Stars ---
  for (const star of stars) {
    const alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(star.twinklePhase));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 3;
    ctx.shadowColor = "#ffccff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Sun ---
  const sunCY = hy - sunR * 0.12;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, sunCY, sunR, 0, Math.PI * 2);
  ctx.clip();

  const sunGrad = ctx.createRadialGradient(cx, sunCY, 0, cx, sunCY, sunR);
  sunGrad.addColorStop(0, "#ffff88");
  sunGrad.addColorStop(0.25, "#ffcc00");
  sunGrad.addColorStop(0.55, "#ff4400");
  sunGrad.addColorStop(0.82, "#cc0066");
  sunGrad.addColorStop(1, "#660033");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(cx - sunR, sunCY - sunR, sunR * 2, sunR * 2);

  // Scan lines (black horizontal strips across the sun)
  ctx.fillStyle = "#08000f";
  const scanCount = 9;
  const scanBand = (sunR * 1.9) / scanCount;
  for (let i = 0; i < scanCount; i++) {
    const ly = sunCY - sunR + sunR * 0.08 + i * scanBand;
    ctx.fillRect(cx - sunR, ly, sunR * 2, scanBand * 0.44);
  }
  ctx.restore();

  // --- Mountain silhouette ---
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (const pt of mountains) {
    // yFrac 0 = directly at horizon, 1 = horizon baseline
    // map so that yFrac 0.0 → hy - mountainHeight, 1.0 → hy
    const mtnHeight = hy * 0.55;
    ctx.lineTo(pt.xFrac * w, hy - (1 - pt.yFrac) * mtnHeight);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  const mtnGrad = ctx.createLinearGradient(0, hy - hy * 0.35, 0, hy);
  mtnGrad.addColorStop(0, "#1a0030");
  mtnGrad.addColorStop(1, "#440070");
  ctx.fillStyle = mtnGrad;
  ctx.fill();
  ctx.restore();

  // --- Perspective grid ---
  ctx.save();

  // Vertical lines: fan from (cx, hy) to evenly-spaced bottom edge points
  for (let i = 0; i <= GRID_LINES_V; i++) {
    const t = i / GRID_LINES_V;
    const bx = t * w;
    const dist = Math.abs(t - 0.5) * 2; // 0 at center, 1 at edges
    ctx.beginPath();
    ctx.moveTo(cx, hy);
    ctx.lineTo(bx, h);
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.65 - dist * 0.35})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#00ffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Horizontal lines: depth-squared Y positions, scrolling via gridOffset
  for (let i = 0; i < GRID_LINES_H; i++) {
    const depth = ((i + gridOffset) / GRID_LINES_H) % 1;
    const y = hy + (h - hy) * depth * depth;
    // Width narrows toward the horizon
    const xLeft = cx - cx * depth;
    const xRight = cx + (w - cx) * depth;
    const alpha = 0.12 + depth * 0.55;
    ctx.beginPath();
    ctx.moveTo(xLeft, y);
    ctx.lineTo(xRight, y);
    ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
    ctx.shadowBlur = 7;
    ctx.shadowColor = "#ff00ff";
    ctx.lineWidth = 1 + depth * 1.5;
    ctx.stroke();
  }

  ctx.restore();
}
