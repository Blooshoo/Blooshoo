// =============================================================================
// seattle-scene.ts  –  Seattle skyline neon scene
// =============================================================================
// Phase 1: buildings draw in sequentially. Phase 2: windows twinkle gently,
// glow pulses, scanlines drift.
// Drop-in module; exports createSeattle / updateSeattle / drawSeattle.
// =============================================================================

const GROUND_RATIO = 0.12;
const TEAL = '#00f5d4';
const PINK = '#ff2d78';
const BLUE = '#00b4ff';
const PURPLE = '#b044ff';
const DARK = '#0a0a1a';

interface BuildingWindow {
  x: number;
  y: number;
  phase: number;
  color: string;
}

interface Building {
  x: number;
  bw: number;
  bh: number;
  color: string;
  windows: BuildingWindow[];
  revealProgress: number;
}

interface SpaceNeedle {
  x: number;
  revealProgress: number;
}

interface StadiumDome {
  x: number;
  revealProgress: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

export interface SeattleState {
  w: number;
  h: number;
  time: number;
  alive: boolean;
  buildings: Building[];
  spaceNeedle: SpaceNeedle;
  stadiumDome: StadiumDome;
  stars: Star[];
  shootingStars: ShootingStar[];
  nextShootingStar: number;
  scanlineOffset: number;
  glowPulse: number;
}

const BUILDING_CONFIGS: Array<{ x: number; bw: number; bh: number; color: string }> = [
  { x: 20,  bw: 30, bh: 55, color: BLUE   },
  { x: 52,  bw: 22, bh: 44, color: TEAL   },
  { x: 76,  bw: 28, bh: 65, color: PURPLE },
  { x: 106, bw: 18, bh: 40, color: BLUE   },
  { x: 126, bw: 32, bh: 75, color: TEAL   },
  { x: 160, bw: 20, bh: 50, color: PINK   },
  { x: 182, bw: 26, bh: 60, color: BLUE   },
  { x: 216, bw: 28, bh: 50, color: TEAL   },
  { x: 318, bw: 30, bh: 62, color: PURPLE },
  { x: 350, bw: 20, bh: 42, color: TEAL   },
  { x: 372, bw: 36, bh: 95, color: BLUE   },
  { x: 410, bw: 24, bh: 78, color: TEAL   },
  { x: 436, bw: 30, bh: 85, color: PURPLE },
  { x: 468, bw: 20, bh: 60, color: PINK   },
  { x: 490, bw: 28, bh: 70, color: BLUE   },
  { x: 520, bw: 18, bh: 50, color: TEAL   },
  { x: 540, bw: 24, bh: 42, color: PURPLE },
  { x: 566, bw: 30, bh: 55, color: PINK   },
  { x: 668, bw: 26, bh: 52, color: BLUE   },
  { x: 696, bw: 18, bh: 38, color: PINK   },
  { x: 716, bw: 22, bh: 44, color: TEAL   },
  { x: 740, bw: 28, bh: 60, color: PURPLE },
  { x: 770, bw: 16, bh: 35, color: BLUE   },
  { x: 788, bw: 22, bh: 48, color: TEAL   },
  { x: 812, bw: 26, bh: 42, color: PINK   },
  { x: 840, bw: 18, bh: 32, color: BLUE   },
  { x: 860, bw: 20, bh: 38, color: PURPLE },
];

const WINDOW_COLORS = [TEAL, BLUE, PINK];

function makeWindows(bw: number, bh: number, phaseBase: number): BuildingWindow[] {
  const wins: BuildingWindow[] = [];
  const cols = Math.floor((bw - 10) / 8);
  const rows = Math.floor((bh - 12) / 10);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      wins.push({
        x: 5 + c * 8,
        y: 6 + r * 10,
        phase: phaseBase + (r * cols + c) * 0.47,
        color: WINDOW_COLORS[(r * cols + c) % WINDOW_COLORS.length],
      });
    }
  }
  return wins;
}

export function createSeattle(w: number, h: number): SeattleState {
  const sx = w / 900;
  const sy = h / 500;

  const buildings: Building[] = BUILDING_CONFIGS.map((cfg, i) => ({
    x:   cfg.x  * sx,
    bw:  cfg.bw * sx,
    bh:  cfg.bh * sy,
    color: cfg.color,
    windows: makeWindows(cfg.bw * sx, cfg.bh * sy, i * 0.73),
    revealProgress: 0,
  }));

  const stars: Star[] = Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: Math.random() * (h - h * GROUND_RATIO) * 0.88,
    r: Math.random() * 1.2 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.4,
  }));

  return {
    w, h, time: 0, alive: false,
    buildings,
    spaceNeedle: { x: 280 * sx, revealProgress: 0 },
    stadiumDome: { x: 620 * sx, revealProgress: 0 },
    stars,
    shootingStars: [],
    nextShootingStar: 6 + Math.random() * 10,
    scanlineOffset: 0,
    glowPulse: 0,
  };
}

const REVEAL_EACH = 0.35;   // seconds per building
const STADIUM_DUR = 0.35;
const NEEDLE_DUR  = 0.7;

export function updateSeattle(state: SeattleState, dt: number): void {
  state.time += dt;
  state.glowPulse = 0.5 + Math.sin(state.time * 0.4) * 0.5;
  state.scanlineOffset = (state.time * 18) % 4;

  const n = state.buildings.length;
  for (let i = 0; i < n; i++) {
    const start = i * REVEAL_EACH;
    state.buildings[i].revealProgress = Math.min(1, Math.max(0, (state.time - start) / REVEAL_EACH));
  }

  const stadiumStart = n * REVEAL_EACH;
  state.stadiumDome.revealProgress = Math.min(1, Math.max(0, (state.time - stadiumStart) / STADIUM_DUR));

  const needleStart = stadiumStart + STADIUM_DUR;
  state.spaceNeedle.revealProgress = Math.min(1, Math.max(0, (state.time - needleStart) / NEEDLE_DUR));

  if (!state.alive && state.spaceNeedle.revealProgress >= 1) {
    state.alive = true;
  }

  // Shooting stars (only once the scene is alive)
  if (state.alive) {
    state.nextShootingStar -= dt;
    if (state.nextShootingStar <= 0) {
      state.nextShootingStar = 8 + Math.random() * 18;
      const angle = (Math.PI / 6) + Math.random() * (Math.PI / 8); // ~30-52° downward
      const speed = 350 + Math.random() * 250;
      const maxLife = 0.6 + Math.random() * 0.5;
      state.shootingStars.push({
        x: Math.random() * state.w * 0.85,
        y: Math.random() * (state.h - state.h * GROUND_RATIO) * 0.45,
        vx:  Math.cos(angle) * speed,
        vy:  Math.sin(angle) * speed,
        life: maxLife,
        maxLife,
        length: 80 + Math.random() * 80,
      });
    }
    for (let i = state.shootingStars.length - 1; i >= 0; i--) {
      const ss = state.shootingStars[i];
      ss.x += ss.vx * dt;
      ss.y += ss.vy * dt;
      ss.life -= dt;
      if (ss.life <= 0) state.shootingStars.splice(i, 1);
    }
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function drawSeattle(state: SeattleState, ctx: CanvasRenderingContext2D): void {
  const { w, h } = state;
  const ground = h - h * GROUND_RATIO;

  // Sky
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (const s of state.stars) {
    const a = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(state.time * s.speed + s.phase));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Shooting stars
  for (const ss of state.shootingStars) {
    const progress = ss.life / ss.maxLife;
    const tailX = ss.x - (ss.vx / Math.hypot(ss.vx, ss.vy)) * ss.length * progress;
    const tailY = ss.y - (ss.vy / Math.hypot(ss.vx, ss.vy)) * ss.length * progress;
    const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.6, `rgba(255,255,255,${progress * 0.4})`);
    grad.addColorStop(1, `rgba(255,255,255,${progress})`);
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6 * progress;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(ss.x, ss.y);
    ctx.stroke();
    // Bright head
    ctx.fillStyle = `rgba(255,255,255,${progress})`;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 1.5 * progress, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sky glow blobs
  const g1 = ctx.createRadialGradient(w * 0.31, ground, 0, w * 0.31, ground, w * 0.28);
  g1.addColorStop(0, hexToRgba(TEAL,   0.10 * state.glowPulse));
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, ground);

  const g2 = ctx.createRadialGradient(w * 0.56, ground, 0, w * 0.56, ground, w * 0.24);
  g2.addColorStop(0, hexToRgba(PURPLE, 0.08 * state.glowPulse));
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, w, ground);

  // Buildings
  for (const b of state.buildings) {
    if (b.revealProgress <= 0) continue;
    const bx = b.x;
    const by = ground - b.bh;
    const revH = b.bh * b.revealProgress;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, ground - revH, b.bw, revH + 1);
    ctx.clip();

    // Fill
    ctx.fillStyle = '#111128';
    ctx.fillRect(bx, by, b.bw, b.bh);

    // Outline
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.strokeRect(bx, by, b.bw, b.bh);
    ctx.shadowBlur = 0;

    // Windows (alive phase only — gentle twinkle)
    if (state.alive) {
      for (const win of b.windows) {
        const alpha = 0.15 + 0.2 * Math.sin(state.time * 0.4 + win.phase);
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = win.color;
        ctx.fillRect(bx + win.x, by + win.y, 3, 4);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // Stadium dome
  const dome = state.stadiumDome;
  if (dome.revealProgress > 0) {
    const sx = w / 900;
    const sy = h / 500;
    const dx = dome.x;
    const dRx = 40 * sx;
    const dRy = 25 * sy * dome.revealProgress;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(dx, ground, dRx, dRy, 0, Math.PI, 0); // upper half arc
    ctx.closePath();
    ctx.fillStyle = '#111128';
    ctx.fill();
    ctx.strokeStyle = PURPLE;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = PURPLE;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arch details inside dome
    for (let i = 0; i < 4; i++) {
      const ax = dx - dRx * 0.6 + i * dRx * 0.4;
      ctx.beginPath();
      ctx.ellipse(ax, ground, 7 * sx, 12 * sy * dome.revealProgress, 0, Math.PI, 0);
      ctx.strokeStyle = hexToRgba(TEAL, 0.5);
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Space Needle
  const needle = state.spaceNeedle;
  if (needle.revealProgress > 0) {
    const sx = w / 900;
    const sy = h / 500;
    const nx = needle.x;
    const p = needle.revealProgress;

    ctx.save();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = TEAL;
    ctx.shadowBlur = 12 * p;

    // Legs
    const legTop = ground - 65 * sy * p;
    const pairs: [number, number][] = [[-18, -3], [18, 3], [-10, -3], [10, 3]];
    for (const [bx, tx] of pairs) {
      ctx.beginPath();
      ctx.moveTo(nx + bx * sx, ground);
      ctx.lineTo(nx + tx * sx, legTop);
      ctx.stroke();
    }

    // Stem
    const stemBottom = ground - 65 * sy * p;
    const stemTop    = ground - 130 * sy * p;
    ctx.fillStyle = '#111128';
    ctx.fillRect(nx - 3 * sx, stemTop, 6 * sx, stemBottom - stemTop);
    ctx.strokeRect(nx - 3 * sx, stemTop, 6 * sx, stemBottom - stemTop);

    // Saucer
    const saucerY = stemTop;
    ctx.beginPath();
    ctx.ellipse(nx, saucerY, 28 * sx * p, 12 * sy * p, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111128';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(nx, saucerY - 8 * sy * p, 22 * sx * p, 8 * sy * p, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spire
    const spireBase = saucerY - 8 * sy * p;
    const spireTop  = spireBase - 32 * sy * p;
    ctx.beginPath();
    ctx.moveTo(nx, spireBase);
    ctx.lineTo(nx, spireTop);
    ctx.stroke();

    // Glowing tip
    ctx.shadowColor = PINK;
    ctx.shadowBlur = 12 * p * state.glowPulse;
    ctx.fillStyle = PINK;
    ctx.beginPath();
    ctx.arc(nx, spireTop, 3 * p, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Ground
  ctx.fillStyle = '#0d0d22';
  ctx.fillRect(0, ground, w, h - ground);

  // Reflection shimmer
  const refGrad = ctx.createLinearGradient(0, ground, 0, h);
  refGrad.addColorStop(0, hexToRgba(TEAL, 0.07 * state.glowPulse));
  refGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = refGrad;
  ctx.fillRect(0, ground, w, h - ground);

  // Horizon line
  ctx.save();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;
  ctx.shadowColor = TEAL;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(w, ground);
  ctx.stroke();
  ctx.restore();

  // Neon horizon glow band
  const hGrad = ctx.createLinearGradient(0, ground - 2, 0, ground + 4);
  hGrad.addColorStop(0, hexToRgba(TEAL, 0.4 * state.glowPulse));
  hGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, ground - 2, w, 6);

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let y = state.scanlineOffset; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
}
