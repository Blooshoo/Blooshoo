// ---- Revenge Scene: "BLOO SQUADRON vs BAD VIBES SAT-1" ----
// Self-contained canvas 2D scene. No external libraries.
// All drawing uses Canvas 2D API with glow via shadowBlur + bright core overlay.
// Performance: object pools, indexed for loops, no per-frame allocations.

// ---- Types ----

export interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  baseAlpha: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  active: boolean;
}

export interface Laser {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  owner: "bloo" | "badvibes";
  distanceTraveled: number;
  maxRange: number;
  radius: number;
  active: boolean;
}

export type FighterState =
  | "PATROL"
  | "ATTACK_RUN"
  | "EVADE"
  | "RETURN"
  | "DYING";

export interface Fighter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  state: FighterState;
  patrolPhase: number;
  patrolSpeed: number;
  patrolAmpX: number;
  patrolAmpY: number;
  patrolCenterX: number;
  patrolCenterY: number;
  stateTimer: number;
  attackCooldown: number;
  evadeTimer: number;
  deathTimer: number;
  deathSpin: number;
  trailX: number[];
  trailY: number[];
  respawnTimer: number;
}

export type DroneState = "GUARD" | "INTERCEPT" | "RETREAT" | "DYING";

export interface Drone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  state: DroneState;
  guardAngle: number;
  guardRadiusX: number;
  guardRadiusY: number;
  guardCenterX: number;
  guardCenterY: number;
  guardSpeed: number;
  targetFighterIdx: number;
  returnTimer: number;
  deathTimer: number;
  deathSpin: number;
  trailX: number[];
  trailY: number[];
  respawnTimer: number;
  interceptCooldown: number;
}

interface SpeedLine {
  x: number;
  y: number;
  len: number;
  alpha: number;
}

interface HUDMessage {
  text: string;
  color: string;
  timer: number;
  duration: number;
}

export interface RevengeSceneState {
  w: number;
  h: number;
  stars: Star[];
  satX: number;
  satY: number;
  satHealth: number;
  satMaxHealth: number;
  satDestroyed: boolean;
  satRespawnTimer: number;
  satDishAngle: number;
  satSweepTimer: number;
  satSweepInterval: number;
  satSweepActive: boolean;
  satSweepProgress: number;
  satSweepStartAngle: number;
  satGlitchTimer: number;
  satScreenText: string;
  satScreenFlicker: boolean;
  satDestructionCount: number;
  autoWarpTimer: number;
  momX: number;
  momY: number;
  momBaseY: number;
  momDriftTimer: number;
  momWarpTimer: number;
  momWarpPhase: "off_screen" | "warping_in" | "idle" | "warping_out";
  momSpawnTimer: number;
  momSpeedLines: SpeedLine[];
  fighters: Fighter[];
  fighterPoolSize: number;
  drones: Drone[];
  dronePoolSize: number;
  lasers: Laser[];
  laserPoolSize: number;
  particles: Particle[];
  particlePoolSize: number;
  shakeX: number;
  shakeY: number;
  shakeIntensity: number;
  shakeDuration: number;
  shakeTimer: number;
  hudMessages: HUDMessage[];
  sceneTime: number;
  sceneShouldReset: boolean;
}

// ---- Constants ----

const BLOO_TEAL = "#00ffcc";
const BLOO_LASER = "#00ccff";
const BADVIBES_RED = "#ff2244";
const BADVIBES_AMBER = "#ff8800";
const WHITE = "#ffffff";

const FIGHTER_COUNT = 6;
const DRONE_COUNT = 5;
const LASER_POOL_SIZE = 20;
const PARTICLE_POOL_SIZE = 80;
const STAR_COUNT = 80;

const MAX_DELTA = 0.05;
const FIGHTER_RESPAWN_TIME = 3;
const DRONE_RESPAWN_TIME = 4;
const SATELLITE_RESPAWN_TIME = 6;

// ---- Helpers ----

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleTo(
  from: { x: number; y: number },
  to: { x: number; y: number },
): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function steerAngle(
  current: number,
  target: number,
  maxRate: number,
  dt: number,
): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = maxRate * dt;
  if (Math.abs(diff) <= step) return target;
  return current + Math.sign(diff) * step;
}

// ---- Particle Helpers ----

function spawnParticle(
  pool: Particle[],
  x: number,
  y: number,
  vx: number,
  vy: number,
  life: number,
  radius: number,
  color: string,
): void {
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i]!;
    if (!p.active) {
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = life;
      p.maxLife = life;
      p.radius = radius;
      p.color = color;
      p.active = true;
      return;
    }
  }
  // Pool full: recycle oldest
  const p = pool[0]!;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.life = life;
  p.maxLife = life;
  p.radius = radius;
  p.color = color;
  p.active = true;
}

function spawnExplosion(
  pool: Particle[],
  x: number,
  y: number,
  count: number,
  color: string,
  speed: number,
  life: number,
): void {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = speed * (0.4 + Math.random() * 0.6);
    spawnParticle(
      pool,
      x,
      y,
      Math.cos(ang) * spd,
      Math.sin(ang) * spd,
      life * (0.5 + Math.random() * 0.5),
      0.8 + Math.random() * 2.5,
      color,
    );
  }
}

function spawnImpact(
  pool: Particle[],
  x: number,
  y: number,
  color: string,
): void {
  for (let i = 0; i < 5; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 80;
    spawnParticle(
      pool,
      x,
      y,
      Math.cos(ang) * spd,
      Math.sin(ang) * spd,
      0.15 + Math.random() * 0.25,
      0.5 + Math.random() * 1.5,
      color,
    );
  }
}

// ---- Laser Helpers ----

function spawnLaser(
  pool: Laser[],
  x: number,
  y: number,
  angle: number,
  speed: number,
  color: string,
  owner: "bloo" | "badvibes",
  maxRange: number,
): void {
  for (let i = 0; i < pool.length; i++) {
    const l = pool[i]!;
    if (!l.active) {
      l.x = x;
      l.y = y;
      l.vx = Math.cos(angle) * speed;
      l.vy = Math.sin(angle) * speed;
      l.color = color;
      l.owner = owner;
      l.distanceTraveled = 0;
      l.maxRange = maxRange;
      l.radius = 2;
      l.active = true;
      return;
    }
  }
  // Pool full: recycle oldest
  const l = pool[0]!;
  l.x = x;
  l.y = y;
  l.vx = Math.cos(angle) * speed;
  l.vy = Math.sin(angle) * speed;
  l.color = color;
  l.owner = owner;
  l.distanceTraveled = 0;
  l.maxRange = maxRange;
  l.radius = 2;
  l.active = true;
}

// ---- Initialization ----

export function createRevengeScene(w: number, h: number): RevengeSceneState {
  const state: RevengeSceneState = {
    w,
    h,
    stars: [],
    satX: 0,
    satY: 0,
    satHealth: 20,
    satMaxHealth: 20,
    satDestroyed: false,
    satRespawnTimer: 0,
    satDishAngle: 0,
    satSweepTimer: 0,
    satSweepInterval: 5 + Math.random() * 3,
    satSweepActive: false,
    satSweepProgress: 0,
    satSweepStartAngle: 0,
    satGlitchTimer: 0,
    satScreenText: "BAD VIBES",
    satScreenFlicker: false,
    satDestructionCount: 0,
    autoWarpTimer: -1,
    momX: -200,
    momY: h * 0.45,
    momBaseY: h * 0.45,
    momDriftTimer: 0,
    momWarpTimer: 0,
    momWarpPhase: "off_screen",
    momSpawnTimer: 0,
    momSpeedLines: [],
    fighters: [],
    fighterPoolSize: FIGHTER_COUNT,
    drones: [],
    dronePoolSize: DRONE_COUNT,
    lasers: [],
    laserPoolSize: LASER_POOL_SIZE,
    particles: [],
    particlePoolSize: PARTICLE_POOL_SIZE,
    shakeX: 0,
    shakeY: 0,
    shakeIntensity: 0,
    shakeDuration: 0,
    shakeTimer: 0,
    hudMessages: [],
    sceneTime: 0,
    sceneShouldReset: false,
  };

  // Init starfield
  for (let i = 0; i < STAR_COUNT; i++) {
    state.stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 0.5 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
      baseAlpha: 0.4 + Math.random() * 0.6,
    });
  }

  // Init satellite
  state.satX = w * 0.72;
  state.satY = h * 0.45 + (Math.random() - 0.5) * h * 0.2;

  // Init mothership
  state.momX = -200;
  state.momBaseY = h * (0.3 + Math.random() * 0.35);
  state.momY = state.momBaseY;
  state.momDriftTimer = Math.random() * Math.PI * 2;

  // Init fighters pool
  for (let i = 0; i < FIGHTER_COUNT; i++) {
    state.fighters.push({
      x: state.momX,
      y: state.momY,
      vx: 0,
      vy: 0,
      radius: 8,
      state: "PATROL",
      patrolPhase: (i / FIGHTER_COUNT) * Math.PI * 2,
      patrolSpeed: 0.8 + Math.random() * 0.4,
      patrolAmpX: 60 + Math.random() * 30,
      patrolAmpY: 35 + Math.random() * 20,
      patrolCenterX: state.momX + 60,
      patrolCenterY: state.momY,
      stateTimer: 0,
      attackCooldown: 3 + Math.random() * 3,
      evadeTimer: 0,
      deathTimer: 0,
      deathSpin: 0,
      trailX: [],
      trailY: [],
      respawnTimer: 0,
    });
  }

  // Init drones pool
  for (let i = 0; i < DRONE_COUNT; i++) {
    state.drones.push({
      x: state.satX,
      y: state.satY,
      vx: 0,
      vy: 0,
      radius: 10,
      state: "GUARD",
      guardAngle: (i / DRONE_COUNT) * Math.PI * 2,
      guardRadiusX: 90,
      guardRadiusY: 65,
      guardCenterX: state.satX,
      guardCenterY: state.satY,
      guardSpeed: 0.7 + Math.random() * 0.3,
      targetFighterIdx: -1,
      returnTimer: 0,
      deathTimer: 0,
      deathSpin: 0,
      trailX: [],
      trailY: [],
      respawnTimer: 0,
      interceptCooldown: 0,
    });
  }

  // Init laser pool
  for (let i = 0; i < LASER_POOL_SIZE; i++) {
    state.lasers.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      color: BLOO_LASER,
      owner: "bloo",
      distanceTraveled: 0,
      maxRange: 280,
      radius: 2,
      active: false,
    });
  }

  // Init particle pool
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    state.particles.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      radius: 0,
      color: BLOO_TEAL,
      active: false,
    });
  }

  return state;
}

// ---- Reset for new loop ----

function resetScene(s: RevengeSceneState): void {
  const w = s.w;
  const h = s.h;

  // Reset satellite - random position
  s.satX = w * 0.72;
  s.satY = h * 0.45 + (Math.random() - 0.5) * h * 0.2;
  s.satHealth = s.satMaxHealth;
  s.satDestroyed = false;
  s.satRespawnTimer = 0;
  s.satDishAngle = 0;
  s.satSweepTimer = 0;
  s.satSweepInterval = 5 + Math.random() * 3;
  s.satSweepActive = false;
  s.satSweepProgress = 0;
  s.satGlitchTimer = 0;
  s.satScreenText = "BAD VIBES";
  s.satScreenFlicker = false;
  s.satDestructionCount = 0;
  s.autoWarpTimer = -1;

  // Reset mothership - random vertical position
  s.momX = -200;
  s.momBaseY = h * (0.3 + Math.random() * 0.35);
  s.momY = s.momBaseY;
  s.momWarpPhase = "off_screen";
  s.momWarpTimer = 0;
  s.momSpawnTimer = 0;
  s.momSpeedLines = [];
  s.momDriftTimer = Math.random() * Math.PI * 2;

  // Reset fighters
  for (let i = 0; i < s.fighters.length; i++) {
    const f = s.fighters[i]!;
    f.state = "PATROL";
    f.stateTimer = 0;
    f.attackCooldown = 3 + Math.random() * 3;
    f.evadeTimer = 0;
    f.deathTimer = 0;
    f.deathSpin = 0;
    f.respawnTimer = 0;
    f.trailX.length = 0;
    f.trailY.length = 0;
    f.patrolPhase = (i / s.fighters.length) * Math.PI * 2;
    f.patrolCenterX = s.momX + 60;
    f.patrolCenterY = s.momY;
    f.x = s.momX;
    f.y = s.momY;
    f.vx = 0;
    f.vy = 0;
  }

  // Reset drones
  for (let i = 0; i < s.drones.length; i++) {
    const d = s.drones[i]!;
    d.state = "GUARD";
    d.guardAngle = (i / s.drones.length) * Math.PI * 2;
    d.guardCenterX = s.satX;
    d.guardCenterY = s.satY;
    d.targetFighterIdx = -1;
    d.returnTimer = 0;
    d.deathTimer = 0;
    d.deathSpin = 0;
    d.respawnTimer = 0;
    d.interceptCooldown = 0;
    d.trailX.length = 0;
    d.trailY.length = 0;
    d.x = s.satX;
    d.y = s.satY;
    d.vx = 0;
    d.vy = 0;
  }

  // Reset lasers
  for (let i = 0; i < s.lasers.length; i++) {
    s.lasers[i]!.active = false;
  }

  // Reset particles
  for (let i = 0; i < s.particles.length; i++) {
    s.particles[i]!.active = false;
  }

  // Reset shake
  s.shakeX = 0;
  s.shakeY = 0;
  s.shakeIntensity = 0;
  s.shakeDuration = 0;
  s.shakeTimer = 0;

  // Reset HUD
  s.hudMessages.length = 0;
  s.sceneTime = 0;
  s.sceneShouldReset = false;
}

function triggerShake(
  s: RevengeSceneState,
  intensity: number,
  duration: number,
): void {
  s.shakeIntensity = intensity;
  s.shakeDuration = duration;
  s.shakeTimer = 0;
}

function addHUDMessage(
  s: RevengeSceneState,
  text: string,
  color: string,
  duration: number,
): void {
  s.hudMessages.push({ text, color, timer: 0, duration });
}

// ---- Update ----

function updateFighterLissajous(f: Fighter, dt: number): void {
  f.patrolPhase += f.patrolSpeed * dt;
  const px = f.patrolCenterX + Math.sin(f.patrolPhase * 1.3) * f.patrolAmpX;
  const py = f.patrolCenterY + Math.sin(f.patrolPhase * 0.7) * f.patrolAmpY;
  f.x += (px - f.x) * Math.min(1, 4 * dt);
  f.y += (py - f.y) * Math.min(1, 4 * dt);
}

function closestFighterToSat(s: RevengeSceneState): Fighter | null {
  let best: Fighter | null = null;
  let bestDist = Infinity;
  const sat = { x: s.satX, y: s.satY };
  for (let i = 0; i < s.fighters.length; i++) {
    const f = s.fighters[i]!;
    if (f.state === "DYING") continue;
    const d = dist(f, sat);
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return best;
}

function closestFighterToDrone(
  s: RevengeSceneState,
  drone: Drone,
): { idx: number; d: number } | null {
  let bestIdx = -1;
  let bestDist = Infinity;
  for (let i = 0; i < s.fighters.length; i++) {
    const f = s.fighters[i]!;
    if (f.state === "DYING") continue;
    const d = dist(drone, f);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx >= 0 ? { idx: bestIdx, d: bestDist } : null;
}

export function updateRevengeScene(s: RevengeSceneState, dtRaw: number): void {
  const dt = Math.min(dtRaw, MAX_DELTA);
  s.sceneTime += dt;

  // ---- Screen Shake ----
  if (s.shakeTimer < s.shakeDuration) {
    s.shakeTimer += dt;
    const fade = 1 - s.shakeTimer / s.shakeDuration;
    s.shakeX = (Math.random() - 0.5) * s.shakeIntensity * fade;
    s.shakeY = (Math.random() - 0.5) * s.shakeIntensity * fade;
  } else {
    s.shakeX = 0;
    s.shakeY = 0;
  }

  // ---- HUD Messages ----
  for (let i = s.hudMessages.length - 1; i >= 0; i--) {
    const msg = s.hudMessages[i]!;
    msg.timer += dt;
    if (msg.timer >= msg.duration) {
      s.hudMessages.splice(i, 1);
    }
  }

  // ---- Particles ----
  for (let i = 0; i < s.particles.length; i++) {
    const p = s.particles[i]!;
    if (!p.active) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) p.active = false;
  }

  // ---- Engine trail particles (mothership) ----
  if (s.momWarpPhase === "idle" && Math.random() < 4 * dt) {
    const ex = s.momX - 40 - Math.random() * 10;
    const ey = s.momY + (Math.random() - 0.5) * 20;
    spawnParticle(
      s.particles,
      ex,
      ey,
      -30 - Math.random() * 40,
      (Math.random() - 0.5) * 15,
      0.4 + Math.random() * 0.4,
      0.5 + Math.random() * 1.5,
      BLOO_TEAL,
    );
  }

  // ---- Lasers ----
  for (let i = 0; i < s.lasers.length; i++) {
    const l = s.lasers[i]!;
    if (!l.active) continue;
    l.x += l.vx * dt;
    l.y += l.vy * dt;
    l.distanceTraveled += Math.sqrt(l.vx * l.vx + l.vy * l.vy) * dt;
    if (l.distanceTraveled >= l.maxRange) {
      l.active = false;
    }
  }

  // ---- Laser Collisions ----
  for (let i = 0; i < s.lasers.length; i++) {
    const l = s.lasers[i]!;
    if (!l.active) continue;

    if (l.owner === "bloo") {
      // Check satellite hit (radius 35)
      if (!s.satDestroyed) {
        const dx = l.x - s.satX;
        const dy = l.y - s.satY;
        if (dx * dx + dy * dy < 35 * 35) {
          l.active = false;
          s.satHealth--;
          spawnImpact(s.particles, l.x, l.y, BLOO_TEAL);
          triggerShake(s, 2, 0.15);
          s.satGlitchTimer = 0.6;
          s.satScreenText = "GUD VIBES";
          s.satScreenFlicker = true;
          if (s.satHealth <= 0) {
            s.satDestroyed = true;
            s.satDestructionCount++;
            if (s.satDestructionCount >= 2) {
              s.autoWarpTimer = 3.0; // 3 seconds before warp out
            }
            spawnExplosion(
              s.particles,
              s.satX,
              s.satY,
              40,
              BADVIBES_AMBER,
              200,
              1.5,
            );
            spawnExplosion(
              s.particles,
              s.satX,
              s.satY,
              20,
              BADVIBES_RED,
              150,
              1.0,
            );
            triggerShake(s, 8, 0.6);
            addHUDMessage(s, "SATELLITE DESTROYED", BLOO_TEAL, 2.0);
            s.satRespawnTimer = SATELLITE_RESPAWN_TIME;
          }
          continue;
        }
      }

      // Check drone hits (radius 8)
      for (let j = 0; j < s.drones.length; j++) {
        const d = s.drones[j]!;
        if (d.state === "DYING") continue;
        const dx = l.x - d.x;
        const dy = l.y - d.y;
        if (dx * dx + dy * dy < 8 * 8) {
          l.active = false;
          spawnImpact(s.particles, l.x, l.y, BLOO_TEAL);
          d.state = "DYING";
          d.deathTimer = 0;
          d.deathSpin = 0;
          d.respawnTimer = DRONE_RESPAWN_TIME;
          spawnExplosion(s.particles, d.x, d.y, 10, BADVIBES_RED, 120, 0.6);
          break;
        }
      }
    } else {
      // BadVibes lasers hit O-fighters (radius 8)
      for (let j = 0; j < s.fighters.length; j++) {
        const f = s.fighters[j]!;
        if (f.state === "DYING") continue;
        const dx = l.x - f.x;
        const dy = l.y - f.y;
        if (dx * dx + dy * dy < 8 * 8) {
          l.active = false;
          spawnImpact(s.particles, l.x, l.y, BADVIBES_RED);
          f.state = "DYING";
          f.deathTimer = 0;
          f.deathSpin = 0;
          f.respawnTimer = FIGHTER_RESPAWN_TIME;
          spawnExplosion(s.particles, f.x, f.y, 10, BLOO_TEAL, 120, 0.6);
          break;
        }
      }
    }
  }

  // ---- Satellite Glitch ----
  if (s.satGlitchTimer > 0) {
    s.satGlitchTimer -= dt;
    if (s.satGlitchTimer <= 0) {
      s.satScreenText = "BAD VIBES";
      s.satScreenFlicker = false;
    }
  }

  const sat = { x: s.satX, y: s.satY };

  // ---- Layer 3: Mothership ----
  if (s.momWarpPhase === "off_screen") {
    s.momWarpTimer += dt;
    const targetX = s.w * 0.18;
    const warpDuration = 1.2;
    const t = Math.min(1, s.momWarpTimer / warpDuration);
    const ease = 1 - Math.pow(1 - t, 3);
    s.momX = -200 + (targetX + 200) * ease;
    s.momY = s.momBaseY + Math.sin(s.momDriftTimer) * 18;
    s.momDriftTimer += dt;

    if (t >= 1) {
      s.momWarpPhase = "idle";
      s.momWarpTimer = 0;
      // Speed lines burst on arrival
      s.momSpeedLines = [];
      for (let i = 0; i < 5; i++) {
        s.momSpeedLines.push({
          x: s.momX - 40 - Math.random() * 60,
          y: s.momY + (Math.random() - 0.5) * 40,
          len: 40 + Math.random() * 80,
          alpha: 1,
        });
      }
      for (let i = 0; i < s.fighters.length; i++) {
        const f = s.fighters[i]!;
        f.patrolCenterX = s.momX + 60;
        f.patrolCenterY = s.momY;
      }
    }
  } else if (s.momWarpPhase === "warping_out") {
    s.momWarpTimer += dt;
    const warpDuration = 1.2;
    const t = Math.min(1, s.momWarpTimer / warpDuration);
    s.momX = s.w * 0.18 + (s.w + 200) * t * t;
    if (t >= 1) {
      s.momWarpPhase = "idle";
      s.sceneShouldReset = true;
    }
  } else {
    // Auto warp-out timer
    if (s.autoWarpTimer > 0 && s.momWarpPhase === "idle") {
      s.autoWarpTimer -= dt;
      if (s.autoWarpTimer <= 0) {
        triggerWarpOut(s);
        s.autoWarpTimer = -1;
      }
    }

    // idle: gentle drift
    s.momDriftTimer += dt;
    s.momY = s.momBaseY + Math.sin(s.momDriftTimer * ((Math.PI * 2) / 7)) * 18;

    for (let i = 0; i < s.fighters.length; i++) {
      const f = s.fighters[i]!;
      f.patrolCenterX = s.momX + 60;
      f.patrolCenterY = s.momY;
    }

    // Spawn fighters
    if (!s.satDestroyed || s.satRespawnTimer <= 0) {
      s.momSpawnTimer += dt;
      if (s.momSpawnTimer >= 4) {
        s.momSpawnTimer = 0;
        let activeCount = 0;
        for (let i = 0; i < s.fighters.length; i++) {
          if (s.fighters[i]!.state !== "DYING") activeCount++;
        }
        if (activeCount < FIGHTER_COUNT) {
          for (let i = 0; i < s.fighters.length; i++) {
            const f = s.fighters[i]!;
            if (f.state === "DYING" && f.respawnTimer <= 0) {
              f.state = "PATROL";
              f.x = s.momX;
              f.y = s.momY;
              f.vx = 0;
              f.vy = 0;
              f.trailX.length = 0;
              f.trailY.length = 0;
              f.patrolPhase = Math.random() * Math.PI * 2;
              f.patrolCenterX = s.momX + 60;
              f.patrolCenterY = s.momY;
              f.attackCooldown = 2 + Math.random() * 2;
              f.evadeTimer = 0;
              f.deathTimer = 0;
              f.deathSpin = 0;
              f.respawnTimer = 0;
              break;
            }
          }
        }
      }
    }
  }

  // Speed lines fade
  for (let i = s.momSpeedLines.length - 1; i >= 0; i--) {
    const sl = s.momSpeedLines[i]!;
    sl.alpha -= dt * 2;
    if (sl.alpha <= 0) s.momSpeedLines.splice(i, 1);
  }

  // ---- Layer 2: Satellite ----
  if (s.satDestroyed) {
    s.satRespawnTimer -= dt;
    if (s.satRespawnTimer <= 0.5 && s.satRespawnTimer + dt > 0.5) {
      addHUDMessage(s, "SAT-1 REBOOTING", BADVIBES_RED, 1.5);
    }
    if (s.satRespawnTimer <= 0) {
      s.satDestroyed = false;
      s.satHealth = s.satMaxHealth;
      s.satScreenText = "REBOOTING...";
      for (let i = 0; i < s.drones.length; i++) {
        const d = s.drones[i]!;
        d.guardCenterX = s.satX;
        d.guardCenterY = s.satY;
      }
    }
  } else {
    // Update dish angle to track nearest fighter
    const nearest = closestFighterToSat(s);
    if (nearest) {
      const targetAngle = angleTo(sat, nearest);
      s.satDishAngle = steerAngle(s.satDishAngle, targetAngle, 1.2, dt);
    }

    // Sweep laser
    s.satSweepTimer += dt;
    if (!s.satSweepActive && s.satSweepTimer >= s.satSweepInterval) {
      s.satSweepActive = true;
      s.satSweepProgress = 0;
      s.satSweepStartAngle = s.satDishAngle - 0.52;
      s.satSweepTimer = 0;
      s.satSweepInterval = 5 + Math.random() * 3;
      triggerShake(s, 4, 0.3);
    }
    if (s.satSweepActive) {
      s.satSweepProgress += dt / 1.2;
      if (s.satSweepProgress >= 1) {
        s.satSweepActive = false;
      }
      // Check sweep laser hits O-fighters
      if (s.satSweepActive) {
        const sweepAngle = s.satSweepStartAngle + s.satSweepProgress * 1.05;
        const sweepEndX = s.satX + Math.cos(sweepAngle) * 400;
        const sweepEndY = s.satY + Math.sin(sweepAngle) * 400;
        for (let j = 0; j < s.fighters.length; j++) {
          const f = s.fighters[j]!;
          if (f.state === "DYING") continue;
          const dx = sweepEndX - s.satX;
          const dy = sweepEndY - s.satY;
          const lenSq = dx * dx + dy * dy;
          let t =
            lenSq === 0
              ? 0
              : ((f.x - s.satX) * dx + (f.y - s.satY) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const closestX = s.satX + t * dx;
          const closestY = s.satY + t * dy;
          const cdx = f.x - closestX;
          const cdy = f.y - closestY;
          if (cdx * cdx + cdy * cdy < (20 + f.radius) * (20 + f.radius)) {
            f.state = "DYING";
            f.deathTimer = 0;
            f.deathSpin = 0;
            f.respawnTimer = FIGHTER_RESPAWN_TIME;
            spawnExplosion(s.particles, f.x, f.y, 10, BLOO_TEAL, 120, 0.6);
          }
        }
      }
    }
  }

  // ---- Layer 4: O-Fighters ----
  for (let i = 0; i < s.fighters.length; i++) {
    const f = s.fighters[i]!;

    if (f.state === "DYING") {
      f.respawnTimer -= dt;
      f.deathTimer += dt;
      f.deathSpin += dt * 10;
      continue;
    }

    // Trail
    f.trailX.push(f.x);
    f.trailY.push(f.y);
    if (f.trailX.length > 4) {
      f.trailX.shift();
      f.trailY.shift();
    }

    switch (f.state) {
      case "PATROL": {
        updateFighterLissajous(f, dt);
        f.attackCooldown -= dt;
        if (f.attackCooldown <= 0 && !s.satDestroyed) {
          f.state = "ATTACK_RUN";
          f.stateTimer = 0;
          f.attackCooldown = 3 + Math.random() * 3;
        }
        break;
      }

      case "ATTACK_RUN": {
        f.stateTimer += dt;
        const targetAngle = angleTo(f, sat);
        const curAngle = Math.atan2(f.vy || 0.001, f.vx || 0.001);
        const newAngle = steerAngle(curAngle, targetAngle, 2.5, dt);
        const speed = 160;
        f.vx = Math.cos(newAngle) * speed;
        f.vy = Math.sin(newAngle) * speed;
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        const d = dist(f, sat);

        // Fire laser when within 280px
        if (d < 280 && f.stateTimer > 0.15) {
          const a = angleTo(f, sat);
          spawnLaser(s.lasers, f.x, f.y, a, 320, BLOO_LASER, "bloo", 280);
        }

        // After passing near satellite, bank away
        if (d < 60 || f.stateTimer > 3.5) {
          f.state = "RETURN";
          f.stateTimer = 0;
          const awayAngle = angleTo(f, sat) + Math.PI;
          f.vx = Math.cos(awayAngle) * 130;
          f.vy = Math.sin(awayAngle) * 130;
        }
        break;
      }

      case "EVADE": {
        f.evadeTimer -= dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.evadeTimer <= 0) {
          f.state = "PATROL";
        }
        break;
      }

      case "RETURN": {
        f.stateTimer += dt;
        const homeX = f.patrolCenterX;
        const homeY = f.patrolCenterY;
        const targetAngle = angleTo(f, { x: homeX, y: homeY });
        const curAngle = Math.atan2(f.vy || 0.001, f.vx || 0.001);
        const newAngle = steerAngle(curAngle, targetAngle, 2.5, dt);
        const speed = 130;
        f.vx = Math.cos(newAngle) * speed;
        f.vy = Math.sin(newAngle) * speed;
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        if (dist(f, { x: homeX, y: homeY }) < 30) {
          f.state = "PATROL";
          f.patrolPhase = Math.random() * Math.PI * 2;
        }
        break;
      }
    }

    // EVADE check: if a drone is within 90px
    for (let j = 0; j < s.drones.length; j++) {
      const d = s.drones[j]!;
      if (d.state === "DYING" || d.state === "GUARD") continue;
      if (f.state !== "EVADE") {
        const dd = dist(f, d);
        if (dd < 90) {
          f.state = "EVADE";
          f.evadeTimer = 0.8;
          const toD = angleTo(f, d);
          const perp = toD + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
          f.vx = Math.cos(perp) * 200;
          f.vy = Math.sin(perp) * 200;
        }
      }
    }
  }

  // ---- Layer 5: Bad Vibes Drones ----
  for (let i = 0; i < s.drones.length; i++) {
    const d = s.drones[i]!;

    if (d.state === "DYING") {
      d.respawnTimer -= dt;
      d.deathTimer += dt;
      d.deathSpin += dt * 9;
      if (d.respawnTimer <= 0) {
        d.state = "GUARD";
        d.x = s.satX;
        d.y = s.satY;
        d.vx = 0;
        d.vy = 0;
        d.trailX.length = 0;
        d.trailY.length = 0;
        d.guardAngle = Math.random() * Math.PI * 2;
        d.guardCenterX = s.satX;
        d.guardCenterY = s.satY;
        d.interceptCooldown = 0;
        d.targetFighterIdx = -1;
      }
      continue;
    }

    d.interceptCooldown = Math.max(0, d.interceptCooldown - dt);

    // Trail
    d.trailX.push(d.x);
    d.trailY.push(d.y);
    if (d.trailX.length > 4) {
      d.trailX.shift();
      d.trailY.shift();
    }

    switch (d.state) {
      case "GUARD": {
        d.guardAngle += d.guardSpeed * dt;
        d.guardCenterX = s.satX;
        d.guardCenterY = s.satY;
        d.x = d.guardCenterX + Math.cos(d.guardAngle) * d.guardRadiusX;
        d.y = d.guardCenterY + Math.sin(d.guardAngle) * d.guardRadiusY;

        if (d.interceptCooldown <= 0 && !s.satDestroyed) {
          const result = closestFighterToDrone(s, d);
          if (result && result.d < 200) {
            d.state = "INTERCEPT";
            d.targetFighterIdx = result.idx;
            d.interceptCooldown = 2;
          }
        }
        break;
      }

      case "INTERCEPT": {
        const targetF = s.fighters[d.targetFighterIdx];
        if (!targetF || targetF.state === "DYING" || dist(d, targetF) > 350) {
          d.state = "RETREAT";
          d.returnTimer = 0;
          d.targetFighterIdx = -1;
          break;
        }

        const targetAngle = angleTo(d, targetF);
        const curAngle = Math.atan2(d.vy || 0.001, d.vx || 0.001);
        const newAngle = steerAngle(curAngle, targetAngle, 2.5, dt);
        const speed = 150;
        d.vx = Math.cos(newAngle) * speed;
        d.vy = Math.sin(newAngle) * speed;
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        const dd = dist(d, targetF);
        if (dd < 120 && Math.random() < 2 * dt) {
          const a = angleTo(d, targetF);
          spawnLaser(s.lasers, d.x, d.y, a, 280, BADVIBES_RED, "badvibes", 200);
        }
        break;
      }

      case "RETREAT": {
        d.returnTimer += dt;
        const homeAngle = angleTo(d, sat);
        const curAngle = Math.atan2(d.vy || 0.001, d.vx || 0.001);
        const newAngle = steerAngle(curAngle, homeAngle, 3, dt);
        const speed = 170;
        d.vx = Math.cos(newAngle) * speed;
        d.vy = Math.sin(newAngle) * speed;
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        if (dist(d, sat) < 50 || d.returnTimer > 2.5) {
          d.state = "GUARD";
          d.guardAngle = Math.atan2(d.y - s.satY, d.x - s.satX);
          d.interceptCooldown = 1.5;
          d.targetFighterIdx = -1;
        }
        break;
      }
    }
  }

  // ---- Check for scene reset ----
  if (s.sceneShouldReset) {
    resetScene(s);
  }

  // ---- Remove REBOOTING text after 1.5s if satellite respawned ----
  if (
    !s.satDestroyed &&
    s.satScreenText === "REBOOTING..." &&
    s.sceneTime > 1.5
  ) {
    // handled by tracking sceneTime - we'll check in draw
  }
}

// ---- Draw ----

function drawGlowRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  glowBlur: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowBlur;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Bright core
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = WHITE;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.3, h * 0.3);
  ctx.restore();
}

function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  glowBlur: number,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowBlur;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  glowBlur: number,
  alpha: number,
  lineWidth: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = glowBlur;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawSatellite(
  s: RevengeSceneState,
  ctx: CanvasRenderingContext2D,
): void {
  const sx = s.satX;
  const sy = s.satY;

  const bodyW = 60;
  const bodyH = 70;
  const bodyX = sx - bodyW / 2;
  const bodyY = sy - bodyH / 2;

  let alpha = 1;
  if (s.satScreenFlicker && s.satGlitchTimer > 0) {
    alpha = Math.random() > 0.4 ? 1 : 0.1;
  }

  // Dark body with red glow
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#1a0a0a";
  ctx.shadowColor = BADVIBES_RED;
  ctx.shadowBlur = 15;
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
  ctx.restore();

  // Body outline
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = BADVIBES_RED;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = BADVIBES_RED;
  ctx.shadowBlur = 8;
  ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);
  ctx.restore();

  // Solar panels - left
  const panelH = 16;
  const panelW = 80;
  const leftPanelX = sx - bodyW / 2 - panelW;
  const panelY = sy - panelH / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = BADVIBES_AMBER;
  ctx.shadowColor = BADVIBES_AMBER;
  ctx.shadowBlur = 6;
  ctx.fillRect(leftPanelX, panelY, panelW, panelH);
  ctx.restore();

  // Solar panel - right
  const rightPanelX = sx + bodyW / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = BADVIBES_AMBER;
  ctx.shadowColor = BADVIBES_AMBER;
  ctx.shadowBlur = 6;
  ctx.fillRect(rightPanelX, panelY, panelW, panelH);
  ctx.restore();

  // Panel cell lines - left panel
  const cellW = panelW / 4;
  for (let c = 1; c < 4; c++) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 0.8;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(leftPanelX + c * cellW, panelY);
    ctx.lineTo(leftPanelX + c * cellW, panelY + panelH);
    ctx.stroke();
    ctx.restore();
  }

  // Panel cell lines - right panel
  for (let c = 1; c < 4; c++) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = "#ff6600";
    ctx.lineWidth = 0.8;
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(rightPanelX + c * cellW, panelY);
    ctx.lineTo(rightPanelX + c * cellW, panelY + panelH);
    ctx.stroke();
    ctx.restore();
  }

  // Rotating dish on top
  const dishCenterX = sx;
  const dishCenterY = bodyY - 5;
  const dishRadius = 12;

  ctx.save();
  ctx.translate(dishCenterX, dishCenterY);
  ctx.rotate(s.satDishAngle);
  ctx.globalAlpha = alpha;
  // Dish stalk
  ctx.strokeStyle = BADVIBES_RED;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = BADVIBES_RED;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -dishRadius);
  ctx.stroke();
  // Dish arc
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, -dishRadius, dishRadius * 0.5, -Math.PI * 0.7, Math.PI * 0.7);
  ctx.stroke();
  ctx.restore();

  // Screen on front face with scrolling text
  const screenW = 28;
  const screenH = 12;
  const screenX = sx - screenW / 2;
  const screenY = sy - 5;

  // Screen background
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#110000";
  ctx.shadowColor = BADVIBES_RED;
  ctx.shadowBlur = 4;
  ctx.fillRect(screenX, screenY, screenW, screenH);
  ctx.restore();

  // Scrolling text with clip region
  ctx.save();
  ctx.beginPath();
  ctx.rect(screenX, screenY, screenW, screenH);
  ctx.clip();

  const scrollOffset = (s.sceneTime * 30) % (screenW + 80);
  const text = s.satScreenText;
  ctx.font = "7px monospace";
  ctx.fillStyle = BADVIBES_RED;
  ctx.shadowColor = BADVIBES_RED;
  ctx.shadowBlur = 2;
  ctx.globalAlpha = alpha;
  for (let rep = -1; rep <= 1; rep++) {
    ctx.fillText(
      text,
      screenX +
        screenW -
        scrollOffset +
        rep * (ctx.measureText(text).width + 20),
      screenY + screenH - 3,
    );
  }
  ctx.restore();
}

function drawMothership(
  s: RevengeSceneState,
  ctx: CanvasRenderingContext2D,
): void {
  const mx = s.momX;
  const my = s.momY;
  const hullW = 80;
  const hullH = 40;

  if (s.momWarpPhase === "off_screen" && mx < -100) return;

  // Trapezoid hull
  const topLeftX = mx - hullW * 0.35;
  const topRightX = mx + hullW * 0.45;
  const bottomLeftX = mx - hullW * 0.5;
  const bottomRightX = mx + hullW * 0.5;
  const topY = my - hullH * 0.5;
  const bottomY = my + hullH * 0.5;

  // Glow pass
  ctx.save();
  ctx.fillStyle = BLOO_TEAL;
  ctx.shadowColor = BLOO_TEAL;
  ctx.shadowBlur = 18;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(topLeftX, topY);
  ctx.lineTo(topRightX, topY);
  ctx.lineTo(bottomRightX, bottomY);
  ctx.lineTo(bottomLeftX, bottomY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Core hull
  ctx.save();
  ctx.fillStyle = "#0a2a2a";
  ctx.shadowColor = BLOO_TEAL;
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(topLeftX + 2, topY + 2);
  ctx.lineTo(topRightX - 2, topY + 2);
  ctx.lineTo(bottomRightX - 2, bottomY - 2);
  ctx.lineTo(bottomLeftX + 2, bottomY - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Hull outline
  ctx.save();
  ctx.strokeStyle = BLOO_TEAL;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = BLOO_TEAL;
  ctx.shadowBlur = 6;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(topLeftX, topY);
  ctx.lineTo(topRightX, topY);
  ctx.lineTo(bottomRightX, bottomY);
  ctx.lineTo(bottomLeftX, bottomY);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Engine nozzles at back (left side)
  const nozzleW = 10;
  const nozzleH = 6;
  const nozzle1X = bottomLeftX - 2;
  const nozzle1Y = my - nozzleH * 1.5;
  const nozzle2X = bottomLeftX - 2;
  const nozzle2Y = my + nozzleH * 0.5;

  drawGlowRect(ctx, nozzle1X, nozzle1Y, nozzleW, nozzleH, BLOO_TEAL, 6, 0.8);
  drawGlowRect(ctx, nozzle2X, nozzle2Y, nozzleW, nozzleH, BLOO_TEAL, 6, 0.8);

  // Thrust flames (flickering)
  const flicker1 = 0.6 + Math.random() * 0.4;
  const flicker2 = 0.6 + Math.random() * 0.4;

  ctx.save();
  ctx.globalAlpha = flicker1 * 0.7;
  ctx.fillStyle = WHITE;
  ctx.shadowColor = BLOO_TEAL;
  ctx.shadowBlur = 8;
  ctx.fillRect(
    nozzle1X - 8 - Math.random() * 4,
    nozzle1Y + 1,
    6 + Math.random() * 4,
    nozzleH - 2,
  );
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = flicker2 * 0.7;
  ctx.fillStyle = WHITE;
  ctx.shadowColor = BLOO_TEAL;
  ctx.shadowBlur = 8;
  ctx.fillRect(
    nozzle2X - 8 - Math.random() * 4,
    nozzle2Y + 1,
    6 + Math.random() * 4,
    nozzleH - 2,
  );
  ctx.restore();
}

function drawFighter(
  s: RevengeSceneState,
  ctx: CanvasRenderingContext2D,
  f: Fighter,
): void {
  if (f.state === "DYING") {
    const scale = Math.max(0, 1 - f.deathTimer / 0.8);
    if (scale <= 0) return;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.deathSpin);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 1 - f.deathTimer / 0.8;
    ctx.strokeStyle = BLOO_TEAL;
    ctx.lineWidth = 2;
    ctx.shadowColor = BLOO_TEAL;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Directional trail
  for (let t = 0; t < f.trailX.length; t++) {
    const tx = f.trailX[t];
    const ty = f.trailY[t];
    if (tx === undefined || ty === undefined) continue;
    const trailAlpha = ((t + 1) / f.trailX.length) * 0.25;
    drawGlowCircle(ctx, tx, ty, f.radius * 0.5, BLOO_TEAL, 4, trailAlpha);
  }

  // Glow halo
  drawGlowCircle(ctx, f.x, f.y, f.radius * 1.6, BLOO_TEAL, 14, 0.2);

  // Main circle outline
  ctx.save();
  ctx.strokeStyle = BLOO_TEAL;
  ctx.lineWidth = 2;
  ctx.shadowColor = BLOO_TEAL;
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Bright core
  drawGlowCircle(ctx, f.x, f.y, 2.5, WHITE, 3, 0.9);
}

function drawDrone(
  s: RevengeSceneState,
  ctx: CanvasRenderingContext2D,
  d: Drone,
): void {
  if (d.state === "DYING") {
    const scale = Math.max(0, 1 - d.deathTimer / 0.8);
    if (scale <= 0) return;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.deathSpin);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 1 - d.deathTimer / 0.8;
    ctx.strokeStyle = BADVIBES_RED;
    ctx.lineWidth = 2;
    ctx.shadowColor = BADVIBES_RED;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -d.radius * 0.7);
    ctx.lineTo(d.radius * 0.5, 0);
    ctx.lineTo(0, d.radius * 0.7);
    ctx.lineTo(-d.radius * 0.5, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Trail
  for (let t = 0; t < d.trailX.length; t++) {
    const tx = d.trailX[t];
    const ty = d.trailY[t];
    if (tx === undefined || ty === undefined) continue;
    const trailAlpha = ((t + 1) / d.trailX.length) * 0.2;
    drawGlowCircle(ctx, tx, ty, 3, BADVIBES_RED, 3, trailAlpha);
  }

  // Diamond shape with glow
  ctx.save();
  ctx.translate(d.x, d.y);
  // Fill glow
  ctx.fillStyle = BADVIBES_RED;
  ctx.shadowColor = BADVIBES_RED;
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(0, -d.radius * 0.7);
  ctx.lineTo(d.radius * 0.5, 0);
  ctx.lineTo(0, d.radius * 0.7);
  ctx.lineTo(-d.radius * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  // Outline
  ctx.strokeStyle = BADVIBES_RED;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(0, -d.radius * 0.7);
  ctx.lineTo(d.radius * 0.5, 0);
  ctx.lineTo(0, d.radius * 0.7);
  ctx.lineTo(-d.radius * 0.5, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Bright center core
  drawGlowCircle(ctx, d.x, d.y, 1.8, WHITE, 2, 0.8);
}

function drawHUD(s: RevengeSceneState, ctx: CanvasRenderingContext2D): void {
  // Base dim text
  ctx.save();
  ctx.font = "9px monospace";
  ctx.fillStyle = WHITE;
  ctx.globalAlpha = 0.2;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.fillText("BLOO SQUADRON vs BAD VIBES SAT-1", 10, s.h - 14);
  ctx.restore();

  // Flash messages
  for (let i = 0; i < s.hudMessages.length; i++) {
    const msg = s.hudMessages[i]!;
    const progress = msg.timer / msg.duration;
    const alpha =
      progress < 0.2
        ? progress / 0.2
        : progress > 0.8
          ? (1 - progress) / 0.2
          : 1;
    ctx.save();
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = msg.color;
    ctx.shadowColor = msg.color;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillText(msg.text, s.w / 2, s.h * 0.3);
    ctx.restore();
  }
}

// ---- Main draw entry point ----

export function drawRevengeScene(
  s: RevengeSceneState,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.save();

  // Apply screen shake
  if (s.shakeX !== 0 || s.shakeY !== 0) {
    ctx.translate(s.shakeX, s.shakeY);
  }

  // ---- LAYER 1: Starfield ----
  for (let i = 0; i < s.stars.length; i++) {
    const star = s.stars[i]!;
    const sx = star.x - s.shakeX * 0.02;
    const sy = star.y - s.shakeY * 0.02;
    const twinkle =
      star.baseAlpha * (0.6 + 0.4 * Math.sin(s.sceneTime * 2.5 + star.phase));
    ctx.save();
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = WHITE;
    ctx.shadowColor = WHITE;
    ctx.shadowBlur = 1;
    ctx.fillRect(
      sx - star.radius / 2,
      sy - star.radius / 2,
      star.radius,
      star.radius,
    );
    ctx.restore();
  }

  // ---- LAYER 2: Bad Vibes Satellite ----
  if (!s.satDestroyed || s.satRespawnTimer > 0) {
    drawSatellite(s, ctx);
  }

  // ---- LAYER 3: Bloo Mothership ----
  drawMothership(s, ctx);

  // Speed lines
  for (let i = 0; i < s.momSpeedLines.length; i++) {
    const sl = s.momSpeedLines[i]!;
    drawGlowLine(
      ctx,
      sl.x,
      sl.y,
      sl.x + sl.len,
      sl.y,
      BLOO_TEAL,
      4,
      sl.alpha,
      1.5,
    );
  }

  // ---- LAYER 5: Drones (draw behind fighters) ----
  for (let i = 0; i < s.drones.length; i++) {
    const d = s.drones[i]!;
    if (d.state === "DYING" && d.deathTimer > 1) continue;
    drawDrone(s, ctx, d);
  }

  // ---- LAYER 4: O-Fighters ----
  for (let i = 0; i < s.fighters.length; i++) {
    const f = s.fighters[i]!;
    if (f.state === "DYING" && f.deathTimer > 1) continue;
    drawFighter(s, ctx, f);
  }

  // ---- Lasers ----
  for (let i = 0; i < s.lasers.length; i++) {
    const l = s.lasers[i]!;
    if (!l.active) continue;
    drawGlowCircle(ctx, l.x, l.y, l.radius, l.color, 8, 1);
  }

  // ---- Satellite Sweep Laser ----
  if (s.satSweepActive && !s.satDestroyed) {
    const sweepAngle = s.satSweepStartAngle + s.satSweepProgress * 1.05;
    const sweepFar = 400;
    ctx.save();
    ctx.strokeStyle = BADVIBES_RED;
    ctx.lineWidth = 3;
    ctx.shadowColor = BADVIBES_RED;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(s.satX, s.satY);
    ctx.lineTo(
      s.satX + Math.cos(sweepAngle) * sweepFar,
      s.satY + Math.sin(sweepAngle) * sweepFar,
    );
    ctx.stroke();
    ctx.restore();
  }

  // ---- Particles ----
  for (let i = 0; i < s.particles.length; i++) {
    const p = s.particles[i]!;
    if (!p.active) continue;
    const progress = p.life / p.maxLife;
    drawGlowCircle(ctx, p.x, p.y, p.radius * progress, p.color, 3, progress);
  }

  // ---- HUD Text ----
  drawHUD(s, ctx);

  ctx.restore();
}

// ---- Trigger warp out ----

export function triggerWarpOut(s: RevengeSceneState): void {
  if (s.momWarpPhase === "idle") {
    s.momWarpPhase = "warping_out";
    s.momWarpTimer = 0;
  }
}
