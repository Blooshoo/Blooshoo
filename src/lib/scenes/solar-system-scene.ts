// =============================================================================
// solar-system-scene.ts  –  Animated solar system with isometric tilt
// =============================================================================
// Top-down solar system with subtle 3D squish, orbiting planets with moons,
// asteroid belt, and chaotic events (shooting stars, meteors, UFOs, comets,
// solar flares, satellites, warp flashes).
// Drop-in module; exports create / update / draw.
// =============================================================================

// ---- Interfaces ----

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Moon {
  orbitRadius: number;
  orbitalPeriod: number;
  angle: number;
  radius: number;
  color: string;
}

interface Planet {
  name: string;
  radius: number;
  orbitRadius: number; // base px, multiplied by state.orbitScale
  orbitalPeriod: number; // seconds for one full orbit
  color: string;
  glowColor: string;
  angle: number; // current angle in radians
  trail: Array<{ x: number; y: number }>;
  trailLength: number;
  moons: Moon[];
}

interface Asteroid {
  angle: number;
  orbitRadius: number; // already multiplied by orbitScale
  speed: number; // radians/sec
  radius: number;
  opacity: number;
}

interface ShootingStar {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds remaining
  maxLife: number;
  trail: Array<{ x: number; y: number }>;
}

interface Meteor {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  points: Array<{ x: number; y: number }>;
  trail: Array<{ x: number; y: number; opacity: number }>;
}

interface UFO {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseY: number;
  wobblePhase: number;
  life: number;
  maxLife: number;
  lightPhase: number;
}

interface Comet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: Array<{ x: number; y: number }>;
}

interface SolarFlareStrand {
  angleOffset: number;
  speed: number;
}

interface SolarFlare {
  active: boolean;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
  strands: SolarFlareStrand[];
}

interface Satellite {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  blinkPhase: number;
}

interface WarpFlash {
  active: boolean;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface SolarSystemState {
  w: number;
  h: number;
  stars: Star[];
  planets: Planet[];
  asteroids: Asteroid[];
  shootingStars: ShootingStar[];
  meteors: Meteor[];
  ufos: UFO[];
  comets: Comet[];
  solarFlares: SolarFlare[];
  satellites: Satellite[];
  warpFlashes: WarpFlash[];
  sceneTime: number;
  orbitScale: number;
  cx: number;
  cy: number;
}

// ---- Constants ----

const MAX_DELTA = 0.05;
const STAR_COUNT = 200;
const ASTEROID_COUNT = 120;
const SHOOTING_STAR_POOL = 3;
const METEOR_POOL = 1;
const UFO_POOL = 1;
const COMET_POOL = 1;
const SOLAR_FLARE_POOL = 2;
const SATELLITE_POOL = 2;
const WARP_FLASH_POOL = 2;
const MAX_ACTIVE_EVENTS = 10;
const ORBIT_Y_SQUISH = 0.85;

const SHOOTING_STAR_SPAWN_RATE = 0.008;
const METEOR_SPAWN_RATE = 0.004;
const UFO_SPAWN_RATE = 0.002;
const COMET_SPAWN_RATE = 0.001;
const SOLAR_FLARE_SPAWN_RATE = 0.005;
const SATELLITE_SPAWN_RATE = 0.003;
const WARP_FLASH_SPAWN_RATE = 0.0008;

const PLANET_DATA: Array<{
  name: string;
  radius: number;
  orbitRadius: number;
  orbitalPeriod: number;
  color: string;
  glowColor: string;
  trailLength: number;
}> = [
  {
    name: "Mercury",
    radius: 3,
    orbitRadius: 65,
    orbitalPeriod: 14,
    color: "#aaaaaa",
    glowColor: "#cccccc",
    trailLength: 40,
  },
  {
    name: "Venus",
    radius: 5,
    orbitRadius: 95,
    orbitalPeriod: 37,
    color: "#ffcc88",
    glowColor: "#ffaa44",
    trailLength: 45,
  },
  {
    name: "Earth",
    radius: 5,
    orbitRadius: 130,
    orbitalPeriod: 60,
    color: "#4488ff",
    glowColor: "#00aaff",
    trailLength: 50,
  },
  {
    name: "Mars",
    radius: 4,
    orbitRadius: 170,
    orbitalPeriod: 113,
    color: "#ff6644",
    glowColor: "#ff4422",
    trailLength: 50,
  },
  {
    name: "Jupiter",
    radius: 12,
    orbitRadius: 230,
    orbitalPeriod: 710,
    color: "#cc9966",
    glowColor: "#ffaa66",
    trailLength: 60,
  },
  {
    name: "Saturn",
    radius: 10,
    orbitRadius: 295,
    orbitalPeriod: 1760,
    color: "#ddcc88",
    glowColor: "#ffdd66",
    trailLength: 65,
  },
  {
    name: "Uranus",
    radius: 7,
    orbitRadius: 350,
    orbitalPeriod: 5040,
    color: "#88ffee",
    glowColor: "#00ffcc",
    trailLength: 65,
  },
  {
    name: "Neptune",
    radius: 7,
    orbitRadius: 400,
    orbitalPeriod: 9880,
    color: "#4466ff",
    glowColor: "#00aaff",
    trailLength: 70,
  },
];

const SHOOTING_STAR_SPEED_MIN = 600;
const SHOOTING_STAR_SPEED_MAX = 900;
const SHOOTING_STAR_LIFE_MIN = 0.6;
const SHOOTING_STAR_LIFE_MAX = 0.9;
const SHOOTING_STAR_TRAIL_LEN = 8;

const METEOR_SPEED_MIN = 200;
const METEOR_SPEED_MAX = 350;
const METEOR_ROTATION_MIN = 1.5;
const METEOR_ROTATION_MAX = 3.5;
const METEOR_TRAIL_LEN = 3;

const UFO_SPEED_MIN = 400;
const UFO_SPEED_MAX = 600;
const UFO_WOBBLE_FREQ = 8;
const UFO_LIGHT_FREQ = 4;

const COMET_SPEED = 90;
const COMET_LIFE = 12;
const COMET_TRAIL_LEN = 60;

const SOLAR_FLARE_LIFE_MIN = 2;
const SOLAR_FLARE_LIFE_MAX = 3;
const SOLAR_FLARE_STRANDS = 5;

const SATELLITE_SPEED_MIN = 150;
const SATELLITE_SPEED_MAX = 250;
const SATELLITE_LIFE_MIN = 5;
const SATELLITE_LIFE_MAX = 8;
const SATELLITE_BLINK_FREQ = 6;

const WARP_FLASH_LIFE_MIN = 0.4;
const WARP_FLASH_LIFE_MAX = 0.7;

// ---- Helpers ----

function rngRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomEdge(w: number, h: number): { x: number; y: number } {
  // Pick a random edge: 0=top, 1=right, 2=bottom, 3=left
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0:
      return { x: Math.random() * w, y: -20 };
    case 1:
      return { x: w + 20, y: Math.random() * h };
    case 2:
      return { x: Math.random() * w, y: h + 20 };
    default:
      return { x: -20, y: Math.random() * h };
  }
}

// ---- Create ----

export function createSolarSystem(w: number, h: number): SolarSystemState {
  const cx = w / 2;
  const cy = h / 2;
  const orbitScale = Math.min(1.4, Math.min(w, h) / 650);

  // ---- Stars ----
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 0.5 + Math.random() * 1.0,
      baseOpacity: 0.3 + Math.random() * 0.6,
      opacity: 0,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 0.8,
    });
  }

  // ---- Planets ----
  const planets: Planet[] = [];
  for (let i = 0; i < PLANET_DATA.length; i++) {
    const pd = PLANET_DATA[i];
    const moons: Moon[] = [];

    if (pd.name === "Earth") {
      moons.push({
        orbitRadius: 14,
        orbitalPeriod: 8,
        angle: Math.random() * Math.PI * 2,
        radius: 2,
        color: "#aaaaaa",
      });
    }
    if (pd.name === "Jupiter") {
      moons.push({
        orbitRadius: 18,
        orbitalPeriod: 3,
        angle: Math.random() * Math.PI * 2,
        radius: 2,
        color: "#999999",
      });
      moons.push({
        orbitRadius: 25,
        orbitalPeriod: 6,
        angle: Math.random() * Math.PI * 2,
        radius: 2,
        color: "#999999",
      });
    }

    planets.push({
      name: pd.name,
      radius: pd.radius,
      orbitRadius: pd.orbitRadius,
      orbitalPeriod: pd.orbitalPeriod,
      color: pd.color,
      glowColor: pd.glowColor,
      angle: Math.random() * Math.PI * 2,
      trail: [],
      trailLength: pd.trailLength,
      moons,
    });
  }

  // ---- Asteroid Belt ----
  const asteroids: Asteroid[] = [];
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    asteroids.push({
      angle: Math.random() * Math.PI * 2,
      orbitRadius: (195 + Math.random() * 20) * orbitScale,
      speed: 0.04 + Math.random() * 0.03,
      radius: 0.5 + Math.random() * 1.0,
      opacity: 0.3 + Math.random() * 0.3,
    });
  }

  // ---- Shooting Star Pool ----
  const shootingStars: ShootingStar[] = [];
  for (let i = 0; i < SHOOTING_STAR_POOL; i++) {
    shootingStars.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      trail: [],
    });
  }

  // ---- Meteor Pool ----
  const meteors: Meteor[] = [];
  for (let i = 0; i < METEOR_POOL; i++) {
    const points: Array<{ x: number; y: number }> = [];
    const pointCount = 4 + Math.floor(Math.random() * 3); // 4–6
    for (let j = 0; j < pointCount; j++) {
      const a = (j / pointCount) * Math.PI * 2;
      const r = 4 + Math.random() * 3;
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    meteors.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      rotationSpeed: 0,
      life: 0,
      maxLife: 0,
      points,
      trail: [],
    });
  }

  // ---- UFO Pool ----
  const ufos: UFO[] = [];
  for (let i = 0; i < UFO_POOL; i++) {
    ufos.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      baseY: 0,
      wobblePhase: 0,
      life: 0,
      maxLife: 0,
      lightPhase: 0,
    });
  }

  // ---- Comet Pool ----
  const comets: Comet[] = [];
  for (let i = 0; i < COMET_POOL; i++) {
    comets.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      trail: [],
    });
  }

  // ---- Solar Flare Pool ----
  const solarFlares: SolarFlare[] = [];
  for (let i = 0; i < SOLAR_FLARE_POOL; i++) {
    const strands: SolarFlareStrand[] = [];
    for (let j = 0; j < SOLAR_FLARE_STRANDS; j++) {
      strands.push({
        angleOffset: (Math.random() - 0.5) * 0.6,
        speed: 40 + Math.random() * 60,
      });
    }
    solarFlares.push({
      active: false,
      angle: 0,
      life: 0,
      maxLife: 0,
      color: "teal",
      strands,
    });
  }

  // ---- Satellite Pool ----
  const satellites: Satellite[] = [];
  for (let i = 0; i < SATELLITE_POOL; i++) {
    satellites.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      blinkPhase: 0,
    });
  }

  // ---- Warp Flash Pool ----
  const warpFlashes: WarpFlash[] = [];
  for (let i = 0; i < WARP_FLASH_POOL; i++) {
    warpFlashes.push({
      active: false,
      x: 0,
      y: 0,
      life: 0,
      maxLife: 0,
    });
  }

  return {
    w,
    h,
    stars,
    planets,
    asteroids,
    shootingStars,
    meteors,
    ufos,
    comets,
    solarFlares,
    satellites,
    warpFlashes,
    sceneTime: 0,
    orbitScale,
    cx,
    cy,
  };
}

// ---- Helpers (cont.) ----

function countActiveEvents(state: SolarSystemState): number {
  let count = 0;
  const pools = [state.shootingStars, state.meteors, state.ufos, state.comets, state.solarFlares, state.satellites, state.warpFlashes];
  for (let pi = 0; pi < pools.length; pi++) {
    const pool = pools[pi];
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].active) count++;
    }
  }
  return count;
}

// ---- Spawn Helpers ----

function spawnShootingStar(state: SolarSystemState): void {
  const pool = state.shootingStars;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const ss = pool[i];
    const edge = randomEdge(state.w, state.h);
    ss.x = edge.x;
    ss.y = edge.y;
    // Aim toward opposite side with random spread
    const tx = state.w - edge.x + (Math.random() - 0.5) * state.w * 0.6;
    const ty = state.h - edge.y + (Math.random() - 0.5) * state.h * 0.6;
    const dx = tx - edge.x;
    const dy = ty - edge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = rngRange(SHOOTING_STAR_SPEED_MIN, SHOOTING_STAR_SPEED_MAX);
    ss.vx = (dx / dist) * speed;
    ss.vy = (dy / dist) * speed;
    ss.life = rngRange(SHOOTING_STAR_LIFE_MIN, SHOOTING_STAR_LIFE_MAX);
    ss.maxLife = ss.life;
    ss.trail.length = 0;
    ss.active = true;
    return;
  }
}

function spawnMeteor(state: SolarSystemState): void {
  const pool = state.meteors;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const m = pool[i];
    const edge = randomEdge(state.w, state.h);
    m.x = edge.x;
    m.y = edge.y;
    const tx = state.w - edge.x + (Math.random() - 0.5) * state.w * 0.4;
    const ty = state.h - edge.y + (Math.random() - 0.5) * state.h * 0.4;
    const dx = tx - edge.x;
    const dy = ty - edge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = rngRange(METEOR_SPEED_MIN, METEOR_SPEED_MAX);
    m.vx = (dx / dist) * speed;
    m.vy = (dy / dist) * speed;
    m.rotationSpeed =
      rngRange(METEOR_ROTATION_MIN, METEOR_ROTATION_MAX) *
      (Math.random() < 0.5 ? 1 : -1);
    m.rotation = Math.random() * Math.PI * 2;
    // maxLife = time to cross canvas + 1s buffer
    m.maxLife = dist / speed + 1;
    m.life = m.maxLife;
    m.trail.length = 0;
    m.active = true;
    return;
  }
}

function spawnUFO(state: SolarSystemState): void {
  const pool = state.ufos;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const u = pool[i];
    // Random entry edge, travel to opposite side
    const edge = randomEdge(state.w, state.h);
    u.x = edge.x;
    u.y = edge.y;
    u.baseY = edge.y;
    const tx = state.w - edge.x;
    const ty = state.h - edge.y;
    const dx = tx - edge.x;
    const dy = ty - edge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = rngRange(UFO_SPEED_MIN, UFO_SPEED_MAX);
    u.vx = (dx / dist) * speed;
    u.vy = (dy / dist) * speed;
    u.maxLife = dist / speed + 1;
    u.life = u.maxLife;
    u.wobblePhase = Math.random() * Math.PI * 2;
    u.lightPhase = Math.random() * Math.PI * 2;
    u.active = true;
    console.log("👽 they're here");
    return;
  }
}

function spawnComet(state: SolarSystemState): void {
  const pool = state.comets;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const c = pool[i];
    const edge = randomEdge(state.w, state.h);
    c.x = edge.x;
    c.y = edge.y;
    // Aim to pass through inner system (near center)
    const innerX = state.cx + (Math.random() - 0.5) * 100;
    const innerY = state.cy + (Math.random() - 0.5) * 100;
    const dx = innerX - edge.x;
    const dy = innerY - edge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = COMET_SPEED + Math.random() * 30;
    c.vx = (dx / dist) * speed;
    c.vy = (dy / dist) * speed;
    c.life = COMET_LIFE + Math.random() * 4;
    c.maxLife = c.life;
    c.trail.length = 0;
    c.active = true;
    return;
  }
}

function spawnSolarFlare(state: SolarSystemState): void {
  const pool = state.solarFlares;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const sf = pool[i];
    sf.angle = Math.random() * Math.PI * 2;
    sf.life = rngRange(SOLAR_FLARE_LIFE_MIN, SOLAR_FLARE_LIFE_MAX);
    sf.maxLife = sf.life;
    sf.color = Math.random() < 0.5 ? "teal" : "amber";
    // Randomize strand offsets and speeds
    for (let j = 0; j < sf.strands.length; j++) {
      sf.strands[j].angleOffset = (Math.random() - 0.5) * 0.6;
      sf.strands[j].speed = 40 + Math.random() * 60;
    }
    sf.active = true;
    return;
  }
}

function spawnSatellite(state: SolarSystemState): void {
  const pool = state.satellites;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const s = pool[i];
    const edge = randomEdge(state.w, state.h);
    s.x = edge.x;
    s.y = edge.y;
    const tx = state.w - edge.x;
    const ty = state.h - edge.y;
    const dx = tx - edge.x;
    const dy = ty - edge.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = rngRange(SATELLITE_SPEED_MIN, SATELLITE_SPEED_MAX);
    s.vx = (dx / dist) * speed;
    s.vy = (dy / dist) * speed;
    s.life = rngRange(SATELLITE_LIFE_MIN, SATELLITE_LIFE_MAX);
    s.maxLife = s.life;
    s.blinkPhase = Math.random() * Math.PI * 2;
    s.active = true;
    return;
  }
}

function spawnWarpFlash(state: SolarSystemState): void {
  const pool = state.warpFlashes;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].active) continue;
    const wf = pool[i];
    wf.x = Math.random() * state.w;
    wf.y = Math.random() * state.h;
    wf.life = rngRange(WARP_FLASH_LIFE_MIN, WARP_FLASH_LIFE_MAX);
    wf.maxLife = wf.life;
    wf.active = true;
    return;
  }
}

// ---- Update ----

export function updateSolarSystem(state: SolarSystemState, dt: number): void {
  const dtCapped = dt < MAX_DELTA ? dt : MAX_DELTA;
  state.sceneTime += dtCapped;

  // ---- Update Stars ----
  const stars = state.stars;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.opacity =
      s.baseOpacity *
      (0.6 + 0.4 * Math.sin(state.sceneTime * s.twinkleSpeed + s.twinklePhase));
  }

  // ---- Update Planets ----
  const planets = state.planets;
  for (let p = 0; p < planets.length; p++) {
    const planet = planets[p];
    planet.angle += ((Math.PI * 2) / planet.orbitalPeriod) * dtCapped;

    const orbitRX = planet.orbitRadius * state.orbitScale;
    const orbitRY = orbitRX * ORBIT_Y_SQUISH;
    const px = state.cx + Math.cos(planet.angle) * orbitRX;
    const py = state.cy + Math.sin(planet.angle) * orbitRY;

    // Update trail
    planet.trail.push({ x: px, y: py });
    if (planet.trail.length > planet.trailLength) planet.trail.shift();

    // Update moons
    const moons = planet.moons;
    for (let m = 0; m < moons.length; m++) {
      moons[m].angle += ((Math.PI * 2) / moons[m].orbitalPeriod) * dtCapped;
    }
  }

  // ---- Update Asteroid Belt ----
  const asteroids = state.asteroids;
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].angle += asteroids[i].speed * dtCapped;
  }

  // ---- Update Shooting Stars ----
  const shootingStars = state.shootingStars;
  for (let i = 0; i < shootingStars.length; i++) {
    const ss = shootingStars[i];
    if (!ss.active) continue;
    ss.life -= dtCapped;
    ss.x += ss.vx * dtCapped;
    ss.y += ss.vy * dtCapped;
    ss.trail.push({ x: ss.x, y: ss.y });
    if (ss.trail.length > SHOOTING_STAR_TRAIL_LEN) ss.trail.shift();
    // Only deactivate when off-screen (roll off even after life expires)
    if (ss.x < -50 || ss.x > state.w + 50 || ss.y < -50 || ss.y > state.h + 50) {
      ss.active = false;
    }
  }
  if (
    countActiveEvents(state) < MAX_ACTIVE_EVENTS &&
    Math.random() < SHOOTING_STAR_SPAWN_RATE
  ) {
    spawnShootingStar(state);
  }

  // ---- Update Meteors ----
  const meteors = state.meteors;
  for (let i = 0; i < meteors.length; i++) {
    const m = meteors[i];
    if (!m.active) continue;
    m.life -= dtCapped;
    m.x += m.vx * dtCapped;
    m.y += m.vy * dtCapped;
    m.rotation += m.rotationSpeed * dtCapped;
    m.trail.push({ x: m.x, y: m.y, opacity: Math.max(0, m.life / m.maxLife) });
    if (m.trail.length > METEOR_TRAIL_LEN) m.trail.shift();
    // Only deactivate when off-screen
    if (m.x < -50 || m.x > state.w + 50 || m.y < -50 || m.y > state.h + 50) {
      m.active = false;
    }
  }
  if (countActiveEvents(state) < MAX_ACTIVE_EVENTS && Math.random() < METEOR_SPAWN_RATE) {
    spawnMeteor(state);
  }

  // ---- Update UFOs ----
  const ufos = state.ufos;
  for (let i = 0; i < ufos.length; i++) {
    const u = ufos[i];
    if (!u.active) continue;
    u.life -= dtCapped;
    u.wobblePhase += dtCapped * UFO_WOBBLE_FREQ;
    u.lightPhase += dtCapped * UFO_LIGHT_FREQ;
    u.x += u.vx * dtCapped;
    u.y = u.baseY + Math.sin(u.wobblePhase) * 8;
    u.baseY += u.vy * dtCapped;
    // Only deactivate when off-screen
    if (u.x < -60 || u.x > state.w + 60 || u.y < -60 || u.y > state.h + 60) {
      u.active = false;
    }
  }
  if (countActiveEvents(state) < MAX_ACTIVE_EVENTS && Math.random() < UFO_SPAWN_RATE) {
    spawnUFO(state);
  }

  // ---- Update Comets ----
  const comets = state.comets;
  for (let i = 0; i < comets.length; i++) {
    const c = comets[i];
    if (!c.active) continue;
    c.life -= dtCapped;
    c.x += c.vx * dtCapped;
    c.y += c.vy * dtCapped;
    c.trail.push({ x: c.x, y: c.y });
    if (c.trail.length > COMET_TRAIL_LEN) c.trail.shift();
    // Only deactivate when off-screen
    if (c.x < -100 || c.x > state.w + 100 || c.y < -100 || c.y > state.h + 100) {
      c.active = false;
    }
  }
  if (countActiveEvents(state) < MAX_ACTIVE_EVENTS && Math.random() < COMET_SPAWN_RATE) {
    spawnComet(state);
  }

  // ---- Update Solar Flares ----
  const solarFlares = state.solarFlares;
  let activeFlares = 0;
  for (let i = 0; i < solarFlares.length; i++) {
    const sf = solarFlares[i];
    if (!sf.active) continue;
    activeFlares++;
    sf.life -= dtCapped;
    if (sf.life <= 0) {
      sf.active = false;
      continue;
    }
  }
  if (
    activeFlares < SOLAR_FLARE_POOL &&
    countActiveEvents(state) < MAX_ACTIVE_EVENTS &&
    Math.random() < SOLAR_FLARE_SPAWN_RATE
  ) {
    spawnSolarFlare(state);
  }

  // ---- Update Satellites ----
  const satellites = state.satellites;
  for (let i = 0; i < satellites.length; i++) {
    const s = satellites[i];
    if (!s.active) continue;
    s.life -= dtCapped;
    s.blinkPhase += dtCapped * SATELLITE_BLINK_FREQ;
    s.x += s.vx * dtCapped;
    s.y += s.vy * dtCapped;
    // Only deactivate when off-screen
    if (s.x < -40 || s.x > state.w + 40 || s.y < -40 || s.y > state.h + 40) {
      s.active = false;
    }
  }
  if (countActiveEvents(state) < MAX_ACTIVE_EVENTS && Math.random() < SATELLITE_SPAWN_RATE) {
    spawnSatellite(state);
  }

  // ---- Update Warp Flashes ----
  const warpFlashes = state.warpFlashes;
  let activeWarps = 0;
  for (let i = 0; i < warpFlashes.length; i++) {
    const wf = warpFlashes[i];
    if (!wf.active) continue;
    activeWarps++;
    wf.life -= dtCapped;
    if (wf.life <= 0) {
      wf.active = false;
      continue;
    }
  }
  if (activeWarps < WARP_FLASH_POOL && Math.random() < WARP_FLASH_SPAWN_RATE) {
    spawnWarpFlash(state);
  }
}

// ---- Draw ----

export function drawSolarSystem(
  state: SolarSystemState,
  ctx: CanvasRenderingContext2D,
): void {
  const { w, h, cx, cy } = state;

  // =========================================================================
  // 1. Clear
  // =========================================================================
  ctx.clearRect(0, 0, w, h);

  // =========================================================================
  // 2. Stars
  // =========================================================================
  const stars = state.stars;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    if (s.opacity < 0.02) continue;
    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = "#e8e8ff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // 3. Orbit Path Ellipses (isometric tilt)
  // =========================================================================
  const planets = state.planets;
  for (let p = 0; p < planets.length; p++) {
    const planet = planets[p];
    const orbitRX = planet.orbitRadius * state.orbitScale;
    const orbitRY = orbitRX * ORBIT_Y_SQUISH;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, orbitRX, orbitRY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // 4. Asteroid Belt
  // =========================================================================
  const asteroids = state.asteroids;
  for (let i = 0; i < asteroids.length; i++) {
    const a = asteroids[i];
    const ax = cx + Math.cos(a.angle) * a.orbitRadius;
    const ay = cy + Math.sin(a.angle) * a.orbitRadius * ORBIT_Y_SQUISH;
    ctx.save();
    ctx.globalAlpha = a.opacity;
    ctx.fillStyle = "#968264";
    ctx.beginPath();
    ctx.arc(ax, ay, a.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // 5. Sun
  // =========================================================================
  const sunPulse = 0.5 + 0.5 * Math.sin(state.sceneTime * 2.1);

  // Outer glow
  ctx.save();
  ctx.shadowBlur = 20 + sunPulse * 40;
  ctx.shadowColor = "#ffaa00";
  ctx.fillStyle = "rgba(255,170,0,0.15)";
  ctx.beginPath();
  ctx.arc(cx, cy, 28 + sunPulse * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Mid layer
  ctx.save();
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#ffcc44";
  ctx.fillStyle = "#ffaa00";
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Bright core
  ctx.save();
  ctx.fillStyle = "#ffffaa";
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // =========================================================================
  // 6. Solar Flares (from the sun)
  // =========================================================================
  const solarFlares = state.solarFlares;
  for (let f = 0; f < solarFlares.length; f++) {
    const sf = solarFlares[f];
    if (!sf.active) continue;

    const progress = 1 - sf.life / sf.maxLife; // 0→1
    // Alpha: peak at 30%, fade to 0 at 100%
    let alpha = 0;
    if (progress < 0.3) {
      alpha = progress / 0.3;
    } else {
      alpha = 1 - (progress - 0.3) / 0.7;
    }
    if (alpha < 0.02) continue;

    const flareColor = sf.color === "teal" ? "#00ffcc" : "#ffaa00";
    const strands = sf.strands;

    for (let s = 0; s < strands.length; s++) {
      const strand = strands[s];
      const strandAngle = sf.angle + strand.angleOffset;
      const maxDist = strand.speed * sf.maxLife * 0.35;
      const dist = progress * maxDist;

      // Start at sun surface
      const sx = cx + Math.cos(strandAngle) * 23;
      const sy = cy + Math.sin(strandAngle) * 23;

      // End point
      const ex = cx + Math.cos(strandAngle) * (23 + dist);
      const ey = cy + Math.sin(strandAngle) * (23 + dist);

      // Control point — offset perpendicular for curvature
      const perpAngle = strandAngle + Math.PI / 2;
      const cpOffset = dist * 0.4 * (s % 2 === 0 ? 1 : -1);
      const cpx =
        sx +
        Math.cos(strandAngle) * dist * 0.5 +
        Math.cos(perpAngle) * cpOffset;
      const cpy =
        sy +
        Math.sin(strandAngle) * dist * 0.5 +
        Math.sin(perpAngle) * cpOffset;

      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = flareColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = flareColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // =========================================================================
  // 7. Planet Trails + Planets + Rings + Moons
  // =========================================================================
  for (let p = 0; p < planets.length; p++) {
    const planet = planets[p];
    const orbitRX = planet.orbitRadius * state.orbitScale;
    const orbitRY = orbitRX * ORBIT_Y_SQUISH;
    const px = cx + Math.cos(planet.angle) * orbitRX;
    const py = cy + Math.sin(planet.angle) * orbitRY;

    // --- Trail ---
    const trail = planet.trail;
    for (let t = 1; t < trail.length; t++) {
      const progress = t / trail.length;
      ctx.save();
      ctx.globalAlpha = progress * 0.3;
      ctx.strokeStyle = planet.glowColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(trail[t - 1].x, trail[t - 1].y);
      ctx.lineTo(trail[t].x, trail[t].y);
      ctx.stroke();
      ctx.restore();
    }

    // --- Saturn rings (before planet) ---
    if (planet.name === "Saturn") {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.PI * 0.15);
      // Outer ring
      ctx.strokeStyle = "rgba(204,170,102,0.4)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 16 * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Inner ring
      ctx.strokeStyle = "rgba(187,170,85,0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 22 * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // --- Planet glow + core ---
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = planet.glowColor;
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // --- Moons ---
    const moons = planet.moons;
    for (let m = 0; m < moons.length; m++) {
      const moon = moons[m];
      const mx = px + Math.cos(moon.angle) * moon.orbitRadius;
      const my = py + Math.sin(moon.angle) * moon.orbitRadius;
      ctx.save();
      ctx.fillStyle = moon.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(mx, my, moon.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // =========================================================================
  // 8. Shooting Stars
  // =========================================================================
  const shootingStars = state.shootingStars;
  for (let i = 0; i < shootingStars.length; i++) {
    const ss = shootingStars[i];
    if (!ss.active) continue;

    // Fading trail
    const ssTrail = ss.trail;
    for (let t = 1; t < ssTrail.length; t++) {
      const progress = t / ssTrail.length;
      const trailAlpha = progress * (ss.life / ss.maxLife);
      if (trailAlpha < 0.02) continue;
      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.strokeStyle = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ssTrail[t - 1].x, ssTrail[t - 1].y);
      ctx.lineTo(ssTrail[t].x, ssTrail[t].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Bright head (fade with life)
    ctx.save();
    ctx.globalAlpha = Math.max(0, ss.life / ss.maxLife);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#aaccff";
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // =========================================================================
  // 9. Comets
  // =========================================================================
  const comets = state.comets;
  for (let i = 0; i < comets.length; i++) {
    const c = comets[i];
    if (!c.active) continue;

    const lifeRatio = c.life / c.maxLife;

    // Fading trail
    const cTrail = c.trail;
    for (let t = 1; t < cTrail.length; t++) {
      const progress = t / cTrail.length;
      const trailAlpha = progress * lifeRatio * 0.6;
      if (trailAlpha < 0.01) continue;
      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.strokeStyle = "#aaddff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#4488cc";
      ctx.lineWidth = 2 + progress * 2;
      ctx.beginPath();
      ctx.moveTo(cTrail[t - 1].x, cTrail[t - 1].y);
      ctx.lineTo(cTrail[t].x, cTrail[t].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Head glow
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#ccddff";
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = lifeRatio;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // =========================================================================
  // 10. Meteors
  // =========================================================================
  const meteors = state.meteors;
  for (let i = 0; i < meteors.length; i++) {
    const meteor = meteors[i];
    if (!meteor.active) continue;

    const lifeRatio = meteor.life / meteor.maxLife;

    // Trail particles
    const mTrail = meteor.trail;
    for (let t = 0; t < mTrail.length; t++) {
      const tp = mTrail[t];
      ctx.save();
      ctx.globalAlpha = tp.opacity * 0.5;
      ctx.fillStyle = "#ff6600";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#ff4400";
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Jagged meteor body
    ctx.save();
    ctx.translate(meteor.x, meteor.y);
    ctx.rotate(meteor.rotation);

    ctx.shadowBlur = 14;
    ctx.shadowColor = "#ff8800";
    ctx.fillStyle = "#886644";
    ctx.strokeStyle = "#ffaa44";
    ctx.lineWidth = 1;

    const pts = meteor.points;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p].x, pts[p].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Smoke trail behind meteor (opposite direction of travel)
    const speed = Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy);
    if (speed > 0) {
      const nx = -meteor.vx / speed;
      const ny = -meteor.vy / speed;
      ctx.save();
      ctx.globalAlpha = lifeRatio * 0.3;
      ctx.fillStyle = "#664422";
      ctx.beginPath();
      ctx.arc(meteor.x + nx * 8, meteor.y + ny * 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // =========================================================================
  // 11. UFOs
  // =========================================================================
  const ufos = state.ufos;
  for (let i = 0; i < ufos.length; i++) {
    const ufo = ufos[i];
    if (!ufo.active) continue;

    const lifeRatio = ufo.life / ufo.maxLife;

    ctx.save();
    ctx.translate(ufo.x, ufo.y);
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffcc";

    // Bottom saucer ellipse
    ctx.fillStyle = "rgba(0,40,40,0.9)";
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Top dome
    ctx.beginPath();
    ctx.ellipse(0, -2, 10, 7, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Light beam
    ctx.save();
    ctx.globalAlpha = 0.06 * lifeRatio;
    ctx.fillStyle = "#00ffcc";
    ctx.beginPath();
    ctx.moveTo(-6, 7);
    ctx.lineTo(6, 7);
    ctx.lineTo(12, 30);
    ctx.lineTo(-12, 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Belly lights
    const lightColors = ["#ffffff", "#ff00ff", "#ffffff"];
    const lightX = [-8, 0, 8];
    for (let l = 0; l < 3; l++) {
      const blink = Math.sin(ufo.lightPhase + l * 1.2) > 0;
      ctx.save();
      ctx.fillStyle = blink ? lightColors[l] : "rgba(100,100,100,0.3)";
      ctx.beginPath();
      ctx.arc(lightX[l], 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // =========================================================================
  // 12. Satellites
  // =========================================================================
  const satellites = state.satellites;
  for (let i = 0; i < satellites.length; i++) {
    const sat = satellites[i];
    if (!sat.active) continue;

    ctx.save();
    ctx.translate(sat.x, sat.y);

    // Solar panels
    ctx.fillStyle = "#334466";
    ctx.fillRect(-14, -0.5, 10, 1);
    ctx.fillRect(4, -0.5, 10, 1);

    // Panel details — blue tint
    ctx.fillStyle = "#5566aa";
    ctx.fillRect(-13, -0.5, 4, 1);
    ctx.fillRect(5, -0.5, 4, 1);

    // Body
    ctx.fillStyle = "#8899aa";
    ctx.fillRect(-4, -2, 8, 4);

    // Body highlight
    ctx.fillStyle = "#aabbcc";
    ctx.fillRect(-3, -1.5, 3, 1);

    // Nav lights — blinking
    const blink = Math.sin(sat.blinkPhase) > 0;
    ctx.save();
    ctx.shadowBlur = 3;
    ctx.shadowColor = blink ? "#ff0000" : "transparent";
    ctx.fillStyle = blink ? "#ff3333" : "#440000";
    ctx.beginPath();
    ctx.arc(-4, -2, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = blink ? "#ffffff" : "transparent";
    ctx.fillStyle = blink ? "#ffffff" : "#444444";
    ctx.beginPath();
    ctx.arc(4, -2, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // 13. Warp Flashes
  // =========================================================================
  const warpFlashes = state.warpFlashes;
  for (let i = 0; i < warpFlashes.length; i++) {
    const wf = warpFlashes[i];
    if (!wf.active) continue;

    const progress = 1 - wf.life / wf.maxLife; // 0→1
    // Alpha: quick peak then fade
    const alpha =
      progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
    if (alpha < 0.02) continue;

    const ringRadius = progress * 80;

    // Expanding ring
    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.strokeStyle = "#88ccff";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wf.x, wf.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Center flash
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 30;
    ctx.shadowColor = "#aaccff";
    ctx.beginPath();
    ctx.arc(wf.x, wf.y, 6 * (1 - progress), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
