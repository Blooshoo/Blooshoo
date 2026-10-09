// =============================================================================
// neon-field.ts  –  Bioluminescent neon grass field scene
// =============================================================================
// Perspective-projected cyberpunk grassland viewed from a low camera angle.
// Drop-in module; exports createNeonField / updateNeonField / drawNeonField.
// =============================================================================

// ---- Interfaces ----

export interface NeonFieldBlade {
  anchorX: number;
  anchorY: number;
  t: number; // depth 0 (horizon) → 1 (camera)
  height: number;
  width: number;
  naturalLean: number; // radians, slight random tilt so blades aren't uniform
  swayPhase: number;
  glowColor: string;
  coreColor: string;
  shadowBlur: number;
  opacity: number;
  currentAngle: number;
  angleVelocity: number;
}

interface NeonGust {
  x: number;
  speed: number;
  strength: number;
  direction: number; // +1 →, -1 ←
}

interface NeonPollen {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  active: boolean;
}

export interface NeonFieldState {
  w: number;
  h: number;
  horizonY: number;
  blades: NeonFieldBlade[];
  gusts: NeonGust[];
  pollen: NeonPollen[];
  gustTimer: number;
  nextGustIn: number;
}

// ---- Constants ----

const MAX_DELTA = 0.05;
const BLADE_TOTAL = 500;
const ROW_COUNT = 8;
const MAX_GUSTS = 3;
const POLLEN_POOL_SIZE = 60;

// Blade counts per row (index 0 = farthest / horizon, index 7 = closest / camera)
const ROW_BLADE_COUNTS = [95, 90, 85, 75, 60, 45, 30, 20]; // sums to 500

// Color palette by depth zone
const FAR_GLOW = "#4422aa";
const FAR_CORE = "#6644cc";
const MID_GLOW_A = "#cc44ff";
const MID_CORE_A = "#cc44ff";
const MID_GLOW_B = "#0088cc";
const MID_CORE_B = "#0088cc";
const CLOSE_GLOW_A = "#00ffcc"; // teal (60 %)
const CLOSE_CORE_A = "#00ffcc";
const CLOSE_GLOW_B = "#00aaff"; // cyan-blue (40 %)
const CLOSE_CORE_B = "#00aaff";

// ---- Helpers ----

function pickColor(
  t: number,
): { glow: string; core: string } {
  if (t < 0.3) {
    return { glow: FAR_GLOW, core: FAR_CORE };
  }
  if (t <= 0.65) {
    // 50 / 50 split
    if (Math.random() < 0.5) {
      return { glow: MID_GLOW_A, core: MID_CORE_A };
    }
    return { glow: MID_GLOW_B, core: MID_CORE_B };
  }
  // t > 0.65 — 60 % teal, 40 % cyan-blue
  if (Math.random() < 0.6) {
    return { glow: CLOSE_GLOW_A, core: CLOSE_CORE_A };
  }
  return { glow: CLOSE_GLOW_B, core: CLOSE_CORE_B };
}

// ---- Create ----

export function createNeonField(w: number, h: number): NeonFieldState {
  const horizonY = h * 0.42;
  const fieldH = h - horizonY;

  const state: NeonFieldState = {
    w,
    h,
    horizonY,
    blades: [],
    gusts: [],
    pollen: [],
    gustTimer: 0,
    nextGustIn: 2.5 + Math.random() * 3.5,
  };

  // ---- Generate blades across 8 depth rows ----
  for (let row = 0; row < ROW_COUNT; row++) {
    const rowCount = ROW_BLADE_COUNTS[row];
    const rowFrac = row / (ROW_COUNT - 1); // 0 at horizon, 1 at bottom
    const rowY = horizonY + rowFrac * fieldH;

    for (let i = 0; i < rowCount; i++) {
      // anchorX: random across canvas width ±15 % overflow for edge fill
      const anchorX = -w * 0.15 + Math.random() * w * 1.3;
      // anchorY: row Y + random ±6 px jitter
      const anchorY = rowY + (Math.random() - 0.5) * 12;
      // depth t — clamp to avoid floating edge cases
      const t = Math.max(0, Math.min(1, (anchorY - horizonY) / fieldH));

      const height = 20 + t * 180;
      const width = 0.4 + t * 2.2;
      const shadowBlur = 2 + t * 14;
      const opacity = 0.3 + t * 0.7;
      const naturalLean = (Math.random() - 0.5) * 0.6; // -0.3 to +0.3 rad
      const swayPhase = Math.random() * Math.PI * 2;
      const color = pickColor(t);

      state.blades.push({
        anchorX,
        anchorY,
        t,
        height,
        width,
        naturalLean,
        swayPhase,
        glowColor: color.glow,
        coreColor: color.core,
        shadowBlur,
        opacity,
        currentAngle: 0,
        angleVelocity: 0,
      });
    }
  }

  // ---- Sort blades ONCE by anchorY (back-to-front / far-to-close) ----
  state.blades.sort((a, b) => a.anchorY - b.anchorY);

  // ---- Pre-allocate pollen particle pool ----
  for (let i = 0; i < POLLEN_POOL_SIZE; i++) {
    state.pollen.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      radius: 0,
      active: false,
    });
  }

  return state;
}

// ---- Spawn helpers (pool-based, no allocations in update) ----

function spawnPollen(
  state: NeonFieldState,
  tipX: number,
  tipY: number,
  gustDir: number,
  gustSpeed: number,
): void {
  for (let i = 0; i < POLLEN_POOL_SIZE; i++) {
    const p = state.pollen[i];
    if (!p.active) {
      p.x = tipX;
      p.y = tipY;
      p.vx = gustDir * gustSpeed * (0.3 + Math.random() * 0.5) + (Math.random() - 0.5) * 20;
      p.vy = -15 - Math.random() * 30;
      p.life = 1.5 + Math.random() * 1.5;
      p.maxLife = p.life;
      p.radius = 1 + Math.random() * 1;
      p.active = true;
      return;
    }
  }
}

function spawnGust(state: NeonFieldState): void {
  const direction = Math.random() < 0.5 ? 1 : -1;
  state.gusts.push({
    x: direction === 1 ? -20 : state.w + 20,
    speed: 90 + Math.random() * 110,
    strength: 0.3 + Math.random() * 0.7,
    direction,
  });
}

// ---- Update ----

export function updateNeonField(state: NeonFieldState, dt: number): void {
  const dtCapped = dt < MAX_DELTA ? dt : MAX_DELTA;

  // ---- Gust spawning ----
  state.gustTimer += dtCapped;
  if (state.gustTimer >= state.nextGustIn && state.gusts.length < MAX_GUSTS) {
    state.gustTimer = 0;
    state.nextGustIn = 2.5 + Math.random() * 3.5;
    spawnGust(state);
  }

  // ---- Move / despawn gusts ----
  for (let i = state.gusts.length - 1; i >= 0; i--) {
    const g = state.gusts[i];
    g.x += g.speed * g.direction * dtCapped;
    if (
      (g.direction === 1 && g.x > state.w + 200) ||
      (g.direction === -1 && g.x < -200)
    ) {
      // Swap-remove for O(1)
      state.gusts[i] = state.gusts[state.gusts.length - 1];
      state.gusts.pop();
    }
  }

  // ---- Update blades (spring physics + idle sway) ----
  const blades = state.blades;
  const gustCount = state.gusts.length;
  for (let b = 0; b < blades.length; b++) {
    const blade = blades[b];
    const t = blade.t;

    // Idle sway target
    let targetAngle =
      Math.sin(state.gustTimer * 0.7 + blade.swayPhase) * 0.04;
    // Close blades sway more
    targetAngle *= 0.8 + t * 0.5;

    // Wind gust contributions (bell curve)
    for (let gi = 0; gi < gustCount; gi++) {
      const g = state.gusts[gi];
      const dx = blade.anchorX - g.x;
      // sigma scales with depth: far = wide sigma, close = tight sigma
      const sigma = 80 + (1 - t) * 140;
      const influence = Math.exp(-(dx * dx) / (2 * sigma * sigma));
      const maxDeflection = g.strength * 60 * (0.6 + t * 0.8) * (Math.PI / 180);
      targetAngle += g.direction * influence * maxDeflection;
    }

    // Spring-damper toward target
    blade.angleVelocity += (targetAngle - blade.currentAngle) * 18 * dtCapped;
    blade.angleVelocity *= 0.72;
    blade.currentAngle += blade.angleVelocity * dtCapped;

    // Clamp angle to prevent spiraling
    if (blade.currentAngle > 0.8) blade.currentAngle = 0.8;
    if (blade.currentAngle < -0.8) blade.currentAngle = -0.8;
  }

  // ---- Pollen spawning (strong gusts near close blades) ----
  for (let gi = 0; gi < gustCount; gi++) {
    const g = state.gusts[gi];
    if (g.strength <= 0.55) continue;

    for (let b = 0; b < blades.length; b++) {
      const blade = blades[b];
      if (blade.t <= 0.5) continue;
      // 4 % chance per frame per qualifying blade
      if (Math.random() >= 0.04) continue;

      const totalAngle = blade.naturalLean + blade.currentAngle;
      const tipX = blade.anchorX + Math.sin(totalAngle) * blade.height;
      const tipY = blade.anchorY - Math.cos(totalAngle) * blade.height;
      spawnPollen(state, tipX, tipY, g.direction, g.speed);
    }
  }

  // ---- Update pollen ----
  for (let i = 0; i < POLLEN_POOL_SIZE; i++) {
    const p = state.pollen[i];
    if (!p.active) continue;
    p.life -= dtCapped;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dtCapped;
    p.y += p.vy * dtCapped;
    // slight upward acceleration
    p.vy -= 5 * dtCapped;
  }
}

// ---- Draw ----

export function drawNeonField(
  state: NeonFieldState,
  ctx: CanvasRenderingContext2D,
): void {
  const { w, h, horizonY, blades, pollen } = state;

  // ===========================================================================
  // LAYER 0 — Horizon atmospheric glow
  // ===========================================================================

  // Wide elliptical radial gradient
  ctx.save();
  const hGlow = ctx.createRadialGradient(
    w * 0.5,
    horizonY,
    0,
    w * 0.5,
    horizonY,
    w * 0.45,
  );
  hGlow.addColorStop(0, "rgba(180, 80, 255, 0.18)");
  hGlow.addColorStop(0.5, "rgba(0, 180, 200, 0.08)");
  hGlow.addColorStop(1, "rgba(0, 180, 200, 0)");
  ctx.fillStyle = hGlow;
  // Stretch into ellipse: canvas.width * 0.9 wide, canvas.height * 0.18 tall
  ctx.scale(1, 0.18);
  ctx.fillRect(0, horizonY / 0.18 - h * 0.09, w, h * 0.18);
  ctx.restore();

  // Thin horizon glow line
  ctx.save();
  ctx.fillStyle = "rgba(100, 220, 255, 0.12)";
  ctx.fillRect(0, horizonY, w, 2);
  ctx.restore();

  // ===========================================================================
  // LAYER 1 — Grass blades (already sorted back-to-front by anchorY)
  // ===========================================================================

  for (let b = 0; b < blades.length; b++) {
    const blade = blades[b];

    // Skip blades that are visually negligible
    if (blade.opacity < 0.05) continue;

    const startX = blade.anchorX;
    const startY = blade.anchorY;

    // Total deflection = natural lean + wind angle
    const angle = blade.naturalLean + blade.currentAngle;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    const tipX = startX + sinA * blade.height;
    const tipY = startY - cosA * blade.height;

    // Control point halfway up, offset horizontally
    const cpX = startX + sinA * blade.height * 0.5 + sinA * blade.height * 0.4;
    const cpY = startY - cosA * blade.height * 0.5;

    // --- Glow pass ---
    ctx.save();
    ctx.strokeStyle = blade.glowColor;
    ctx.lineWidth = blade.width;
    ctx.shadowColor = blade.glowColor;
    ctx.shadowBlur = blade.shadowBlur;
    ctx.globalAlpha = blade.opacity * 0.55;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.stroke();
    ctx.restore();

    // --- Core pass (tip → white gradient) ---
    const grad = ctx.createLinearGradient(startX, startY, tipX, tipY);
    grad.addColorStop(0, blade.coreColor);
    grad.addColorStop(1, "#ffffff");
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = blade.width * 0.35;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = blade.opacity;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
    ctx.stroke();
    ctx.restore();
  }

  // ===========================================================================
  // LAYER 2 — Pollen particles
  // ===========================================================================

  for (let i = 0; i < POLLEN_POOL_SIZE; i++) {
    const p = pollen[i];
    if (!p.active) continue;

    const progress = p.life / p.maxLife; // 1 → 0
    const alpha = progress * 0.9;
    if (alpha < 0.02) continue;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
