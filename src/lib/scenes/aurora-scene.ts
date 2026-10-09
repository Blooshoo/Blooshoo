// =============================================================================
// aurora-scene.ts  –  Aurora Borealis scene
// =============================================================================
// Sinuous curtains of colored light ripple across a star-filled night sky.
// Drop-in module; exports createAurora / updateAurora / drawAurora.
// =============================================================================

// ---- Interfaces ----

interface AuroraStar {
  x: number;
  y: number;
  r: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface AuroraWaveComponent {
  freq: number;
  amp: number;
  phase: number;
  speed: number;
}

interface AuroraBand {
  baseYFrac: number;
  thickFrac: number;
  wave: AuroraWaveComponent[];
  hue: number;
  hueSpeed: number;
  opacityBase: number;
  opacityPhase: number;
  opacitySpeed: number;
  opacity: number;
}

export interface AuroraState {
  w: number;
  h: number;
  time: number;
  stars: AuroraStar[];
  bands: AuroraBand[];
}

// ---- Constants ----

const STAR_COUNT = 80;
const BAND_COUNT = 5;
const SAMPLES = 120;
const BASE_HUES = [140, 168, 195, 225, 278];

// ---- Public API ----

export function createAurora(w: number, h: number): AuroraState {
  const stars: AuroraStar[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.65,
      r: 0.5 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.5 + Math.random() * 2.0,
    });
  }

  const bands: AuroraBand[] = [];
  for (let i = 0; i < BAND_COUNT; i++) {
    const opacityBase = 0.20 + Math.random() * 0.22;
    bands.push({
      baseYFrac: 0.07 + i * 0.065,
      thickFrac: 0.045 + Math.random() * 0.09,
      wave: [
        {
          freq: 1.4 + Math.random() * 0.8,
          amp: 0.018 + Math.random() * 0.018,
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.30,
        },
        {
          freq: 3.0 + Math.random() * 1.2,
          amp: 0.009 + Math.random() * 0.009,
          phase: Math.random() * Math.PI * 2,
          speed: 0.45 + Math.random() * 0.45,
        },
        {
          freq: 0.6 + Math.random() * 0.5,
          amp: 0.022 + Math.random() * 0.018,
          phase: Math.random() * Math.PI * 2,
          speed: 0.12 + Math.random() * 0.18,
        },
      ],
      hue: BASE_HUES[i],
      hueSpeed: (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 4.5),
      opacityBase,
      opacityPhase: Math.random() * Math.PI * 2,
      opacitySpeed: 0.3 + Math.random() * 0.5,
      opacity: opacityBase,
    });
  }

  return { w, h, time: 0, stars, bands };
}

export function updateAurora(state: AuroraState, dt: number): void {
  state.time += dt;

  for (const star of state.stars) {
    star.twinklePhase += star.twinkleSpeed * dt;
  }

  for (const band of state.bands) {
    for (const wv of band.wave) {
      wv.phase += wv.speed * dt;
    }
    band.hue += band.hueSpeed * dt;
    band.opacityPhase += band.opacitySpeed * dt;
    band.opacity = band.opacityBase + Math.sin(band.opacityPhase) * 0.11;
    band.opacity = Math.max(0.04, Math.min(0.55, band.opacity));
  }
}

export function drawAurora(
  state: AuroraState,
  ctx: CanvasRenderingContext2D,
): void {
  const { w, h } = state;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#010109");
  bg.addColorStop(0.55, "#020316");
  bg.addColorStop(1, "#04051c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (const star of state.stars) {
    const alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(star.twinklePhase));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#99bbff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Aurora bands — additive blend so overlapping bands look luminous
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  for (const band of state.bands) {
    // Sample centerY and halfThick at each x step
    type CenterPoint = { x: number; cy: number; half: number };
    const pts: CenterPoint[] = new Array(SAMPLES + 1);

    for (let i = 0; i <= SAMPLES; i++) {
      const normX = i / SAMPLES;
      const x = normX * w;
      let offset = 0;
      for (const wv of band.wave) {
        offset += Math.sin(normX * wv.freq * Math.PI * 2 + wv.phase) * wv.amp;
      }
      const cy = (band.baseYFrac + offset) * h;
      const half = band.thickFrac * h * 0.5;
      pts[i] = { x, cy, half };
    }

    // Build closed polygon: top arc left→right, bottom arc right→left
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].cy - pts[0].half);
    for (let i = 1; i <= SAMPLES; i++) {
      ctx.lineTo(pts[i].x, pts[i].cy - pts[i].half);
    }
    for (let i = SAMPLES; i >= 0; i--) {
      ctx.lineTo(pts[i].x, pts[i].cy + pts[i].half);
    }
    ctx.closePath();

    // Vertical gradient: transparent → hsl core → transparent
    const midPt = pts[Math.floor(SAMPLES / 2)];
    const grad = ctx.createLinearGradient(
      0,
      midPt.cy - midPt.half,
      0,
      midPt.cy + midPt.half,
    );
    const hue = ((band.hue % 360) + 360) % 360;
    const op = band.opacity;
    grad.addColorStop(0, `hsla(${hue}, 100%, 70%, 0)`);
    grad.addColorStop(0.25, `hsla(${hue}, 100%, 65%, ${op * 0.65})`);
    grad.addColorStop(0.5, `hsla(${hue}, 100%, 62%, ${op})`);
    grad.addColorStop(0.75, `hsla(${hue}, 100%, 65%, ${op * 0.65})`);
    grad.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();
}
