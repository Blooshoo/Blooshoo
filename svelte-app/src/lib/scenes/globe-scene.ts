// =============================================================================
// globe-scene.ts  –  Wireframe globe canvas scene (low orbit)
// =============================================================================
// Animated Earth globe with stars, clouds, city lights, grid lines, satellites.
// Drop-in module; exports createGlobe / updateGlobe / drawGlobe.
// =============================================================================

// ---- Interfaces ----

export interface GlobeStar {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface CloudPatch {
  lat: number;
  lon: number;
  size: number;
  opacity: number;
  points: Array<[number, number]>;
}

interface CityLight {
  lat: number;
  lon: number;
  opacity: number;
}

interface Satellite {
  orbitRadius: number;
  inclination: number;
  angle: number;
  speed: number;
  blinkPhase: number;
  trail: Array<{ x: number; y: number }>;
}

interface Plane {
  lat: number;
  lon: number;
  heading: number; // radians, direction of travel
  speed: number; // radians/sec along the surface
  altitude: number; // fraction above surface (0.02–0.04 of radius)
  trail: Array<{ x: number; y: number }>;
}

export interface GlobeState {
  cx: number;
  cy: number;
  radius: number;
  rotation: number;
  cloudRotation: number;
  stars: GlobeStar[];
  cloudPatches: CloudPatch[];
  cityLights: CityLight[];
  satellites: Satellite[];
  planes: Plane[];
  sceneTime: number;
}

// ---- Constants ----

const MAX_DELTA = 0.05;
const STAR_COUNT = 200;
const CLOUD_PATCH_COUNT = 18;
const CITY_ANCHOR_COUNT = 20;
const CITY_RANDOM_COUNT = 20;
const SATELLITE_COUNT = 3;
const PLANE_COUNT = 3;

// ---- Projection Helpers (module-internal, not exported) ----

function project(
  lat: number,
  lon: number,
  rotation: number,
  cx: number,
  cy: number,
  R: number,
): { x: number; y: number; z: number } {
  const adjustedLon = lon + rotation;
  const x = R * Math.cos(lat) * Math.sin(adjustedLon);
  const y = R * Math.sin(lat);
  const z = R * Math.cos(lat) * Math.cos(adjustedLon);
  return { x: cx + x, y: cy - y, z };
}

function projectSatellite(
  sat: Satellite,
  state: GlobeState,
): { x: number; y: number; z: number } {
  const ox = Math.cos(sat.angle) * sat.orbitRadius;
  const oy = Math.sin(sat.angle) * sat.orbitRadius * Math.sin(sat.inclination);
  const oz = Math.sin(sat.angle) * sat.orbitRadius * Math.cos(sat.inclination);

  // Rotate around Y axis by globe rotation so orbit stays fixed in space
  const cosR = Math.cos(state.rotation);
  const sinR = Math.sin(state.rotation);
  const rx = ox * cosR - oz * sinR;
  const rz = ox * sinR + oz * cosR;

  return {
    x: state.cx + rx,
    y: state.cy - oy,
    z: rz,
  };
}

// ---- Continent Coordinate Arrays ----

interface Continent {
  name: string;
  coords: Array<[number, number]>;
}

const continents: Continent[] = [
  {
    name: "North America",
    coords: [
      [70, -140],
      [72, -120],
      [70, -100],
      [60, -95],
      [50, -85],
      [46, -84],
      [44, -76],
      [48, -70],
      [45, -64],
      [38, -75],
      [30, -81],
      [24, -81],
      [20, -87],
      [15, -88],
      [10, -85],
      [8, -77],
      [10, -75],
      [20, -105],
      [22, -110],
      [28, -112],
      [30, -117],
      [34, -120],
      [38, -122],
      [48, -124],
      [54, -130],
      [58, -136],
      [60, -146],
      [66, -162],
      [68, -165],
      [70, -155],
      [70, -140],
    ],
  },
  {
    name: "South America",
    coords: [
      [10, -73],
      [8, -63],
      [8, -60],
      [5, -52],
      [4, -50],
      [0, -50],
      [-5, -35],
      [-10, -37],
      [-15, -39],
      [-20, -40],
      [-23, -43],
      [-30, -51],
      [-34, -58],
      [-38, -62],
      [-42, -65],
      [-46, -66],
      [-50, -69],
      [-52, -69],
      [-54, -65],
      [-56, -67],
      [-55, -68],
      [-52, -75],
      [-46, -75],
      [-38, -73],
      [-30, -72],
      [-22, -70],
      [-18, -70],
      [-5, -81],
      [0, -80],
      [5, -77],
      [10, -73],
    ],
  },
  {
    name: "Europe",
    coords: [
      [70, 28],
      [68, 18],
      [65, 14],
      [58, 5],
      [52, 4],
      [48, -5],
      [44, -9],
      [36, -9],
      [36, -6],
      [38, -1],
      [40, 3],
      [43, 6],
      [44, 14],
      [40, 18],
      [38, 22],
      [40, 28],
      [42, 28],
      [44, 30],
      [46, 30],
      [48, 24],
      [50, 18],
      [52, 14],
      [54, 18],
      [58, 24],
      [60, 25],
      [64, 26],
      [68, 28],
      [70, 28],
    ],
  },
  {
    name: "Africa",
    coords: [
      [36, -5],
      [36, 10],
      [32, 33],
      [28, 34],
      [22, 37],
      [12, 43],
      [8, 48],
      [2, 42],
      [-2, 42],
      [-5, 40],
      [-10, 38],
      [-15, 36],
      [-18, 36],
      [-22, 35],
      [-26, 33],
      [-30, 31],
      [-34, 26],
      [-35, 20],
      [-34, 18],
      [-30, 17],
      [-24, 15],
      [-18, 12],
      [-12, 14],
      [-6, 13],
      [0, 8],
      [4, 2],
      [4, 10],
      [6, 1],
      [4, -2],
      [4, -9],
      [8, -15],
      [14, -17],
      [18, -16],
      [22, -17],
      [26, -15],
      [30, -10],
      [32, -2],
      [30, 10],
      [28, 16],
      [36, -5],
    ],
  },
  {
    name: "Asia",
    coords: [
      [70, 30],
      [70, 60],
      [72, 100],
      [70, 140],
      [68, 162],
      [60, 162],
      [54, 142],
      [46, 142],
      [40, 132],
      [36, 128],
      [34, 130],
      [36, 126],
      [34, 120],
      [30, 122],
      [24, 122],
      [22, 114],
      [20, 110],
      [10, 104],
      [2, 104],
      [2, 100],
      [5, 100],
      [5, 80],
      [8, 78],
      [12, 80],
      [15, 80],
      [20, 73],
      [22, 70],
      [24, 62],
      [22, 58],
      [16, 52],
      [14, 44],
      [18, 40],
      [22, 40],
      [28, 35],
      [36, 36],
      [40, 36],
      [42, 45],
      [44, 50],
      [50, 58],
      [56, 60],
      [56, 68],
      [60, 70],
      [62, 72],
      [66, 68],
      [70, 30],
    ],
  },
  {
    name: "Australia",
    coords: [
      [-14, 130],
      [-12, 136],
      [-12, 142],
      [-16, 146],
      [-20, 148],
      [-24, 152],
      [-28, 154],
      [-32, 152],
      [-36, 150],
      [-38, 146],
      [-38, 140],
      [-36, 140],
      [-34, 136],
      [-32, 134],
      [-32, 128],
      [-30, 115],
      [-26, 114],
      [-22, 114],
      [-20, 119],
      [-18, 122],
      [-16, 124],
      [-14, 128],
      [-14, 130],
    ],
  },
  {
    name: "Antarctica",
    coords: [
      [-70, 0],
      [-68, 45],
      [-66, 90],
      [-68, 135],
      [-70, 180],
      [-68, 135],
      [-66, 90],
      [-68, 45],
      [-70, 0],
    ],
  },
];

// ---- City Light Anchor Data ----

const cityAnchors: Array<[number, number]> = [
  [41, -74], // New York
  [51, 0], // London
  [36, 140], // Tokyo
  [31, 121], // Shanghai
  [19, 73], // Mumbai
  [-24, -46], // São Paulo
  [30, 31], // Cairo
  [6, 3], // Lagos
  [56, 37], // Moscow
  [-34, 151], // Sydney
  [34, -118], // Los Angeles
  [42, -88], // Chicago
  [48, 2], // Paris
  [52, 13], // Berlin
  [35, 139], // Osaka
  [1, 104], // Singapore
  [37, 127], // Seoul
  [55, 82], // Novosibirsk
  [-34, -58], // Buenos Aires
  [30, 121], // Hangzhou
];

// ---- Create ----

export function createGlobe(w: number, h: number): GlobeState {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.52;

  const state: GlobeState = {
    cx,
    cy,
    radius,
    rotation: Math.random() * Math.PI * 2,
    cloudRotation: Math.random() * Math.PI * 2,
    stars: [],
    cloudPatches: [],
    cityLights: [],
    satellites: [],
    planes: [],
    sceneTime: 0,
  };

  // ---- Stars (200) ----
  for (let i = 0; i < STAR_COUNT; i++) {
    state.stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 0.5 + Math.random() * 1.0,
      baseOpacity: 0.3 + Math.random() * 0.6,
      opacity: 0,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 0.8,
    });
  }

  // ---- Cloud Patches (18) ----
  for (let i = 0; i < CLOUD_PATCH_COUNT; i++) {
    const centerLat = (Math.random() - 0.5) * ((100 * Math.PI) / 180); // -50° to 50° in rad
    const centerLon = Math.random() * Math.PI * 2;
    const size = 0.12 + Math.random() * 0.16;

    const points: Array<[number, number]> = [];
    for (let p = 0; p < 7; p++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = size * (0.5 + Math.random() * 0.5);
      points.push([dist * Math.sin(angle), dist * Math.cos(angle)]);
    }

    state.cloudPatches.push({
      lat: centerLat,
      lon: centerLon,
      size,
      opacity: 0.3 + Math.random() * 0.4,
      points,
    });
  }

  // ---- City Lights (anchors + random scatter) ----
  for (let i = 0; i < CITY_ANCHOR_COUNT; i++) {
    const [latDeg, lonDeg] = cityAnchors[i];
    state.cityLights.push({
      lat: (latDeg * Math.PI) / 180,
      lon: (lonDeg * Math.PI) / 180,
      opacity: 0.5 + Math.random() * 0.5,
    });
  }
  for (let i = 0; i < CITY_RANDOM_COUNT; i++) {
    state.cityLights.push({
      lat: (Math.random() - 0.5) * ((120 * Math.PI) / 180), // -60° to 60°
      lon: Math.random() * Math.PI * 2,
      opacity: 0.5 + Math.random() * 0.5,
    });
  }

  // ---- Satellites (3) ----
  state.satellites = [
    {
      orbitRadius: radius * 1.1,
      inclination: 0.9, // ~51.6° — ISS-style
      angle: Math.random() * Math.PI * 2,
      speed: 0.08,
      blinkPhase: Math.random(),
      trail: [],
    },
    {
      orbitRadius: radius * 1.15,
      inclination: (Math.PI / 2) * 0.95, // near-polar orbit
      angle: Math.random() * Math.PI * 2,
      speed: 0.06,
      blinkPhase: Math.random(),
      trail: [],
    },
    {
      orbitRadius: radius * 1.22,
      inclination: 0.05, // near-equatorial / geostationary-ish
      angle: Math.random() * Math.PI * 2,
      speed: 0.02,
      blinkPhase: Math.random(),
      trail: [],
    },
  ];

  // ---- Planes (3) ----
  for (let i = 0; i < PLANE_COUNT; i++) {
    state.planes.push({
      lat: (Math.random() - 0.5) * 1.0, // random latitude -0.5 to 0.5 rad (~ -30° to 30°)
      lon: Math.random() * Math.PI * 2,
      heading: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.4, // rad/sec — fast, zippy
      altitude: 0.02 + Math.random() * 0.02, // just above surface
      trail: [],
    });
  }

  return state;
}

// ---- Update ----

export function updateGlobe(state: GlobeState, dt: number): void {
  const dtCapped = dt < MAX_DELTA ? dt : MAX_DELTA;
  state.sceneTime += dtCapped;

  // Surface rotation — one full rotation every ~35 minutes
  state.rotation += 0.015 * dtCapped;
  if (state.rotation > Math.PI * 2) state.rotation -= Math.PI * 2;

  // Cloud rotation — 1.4× faster than surface
  state.cloudRotation += 0.015 * 1.4 * dtCapped;
  if (state.cloudRotation > Math.PI * 2) state.cloudRotation -= Math.PI * 2;

  // Star twinkle
  for (let i = 0; i < state.stars.length; i++) {
    const s = state.stars[i];
    s.opacity =
      s.baseOpacity *
      (0.6 + 0.4 * Math.sin(state.sceneTime * s.twinkleSpeed + s.twinklePhase));
  }

  // Satellites
  for (let i = 0; i < state.satellites.length; i++) {
    const sat = state.satellites[i];
    sat.angle += sat.speed * dtCapped;
    sat.blinkPhase += dtCapped;

    const { x, y, z } = projectSatellite(sat, state);
    if (z > 0) {
      sat.trail.push({ x, y });
      if (sat.trail.length > 24) sat.trail.shift();
    }
  }

  // Planes
  for (let i = 0; i < state.planes.length; i++) {
    const plane = state.planes[i];
    // Move along heading
    plane.lon += plane.speed * Math.cos(plane.heading) * dtCapped;
    plane.lat += plane.speed * Math.sin(plane.heading) * dtCapped;
    // Wrap longitude
    if (plane.lon > Math.PI) plane.lon -= Math.PI * 2;
    if (plane.lon < -Math.PI) plane.lon += Math.PI * 2;
    // Clamp latitude
    if (plane.lat > 1.4) plane.lat = 1.4;
    if (plane.lat < -1.4) plane.lat = -1.4;
    // Randomly change heading occasionally
    if (Math.random() < 0.01) {
      plane.heading += (Math.random() - 0.5) * 0.8;
    }

    // Project plane position
    const altR = state.radius * (1 + plane.altitude);
    const plat = plane.lat;
    const plon = plane.lon + state.rotation; // rotate with globe
    const px = state.cx + altR * Math.cos(plat) * Math.sin(plon);
    const py = state.cy - altR * Math.sin(plat);
    const pz = altR * Math.cos(plat) * Math.cos(plon);

    if (pz > 0) {
      plane.trail.push({ x: px, y: py });
      if (plane.trail.length > 30) plane.trail.shift();
    }
  }
}

// ---- Draw ----

export function drawGlobe(
  state: GlobeState,
  ctx: CanvasRenderingContext2D,
): void {
  const { cx, cy, radius: R } = state;

  // =========================================================================
  // 1. Clear
  // =========================================================================
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // =========================================================================
  // 2. Stars
  // =========================================================================
  for (let i = 0; i < state.stars.length; i++) {
    const s = state.stars[i];
    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = "#e8e8ff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // 3. Atmosphere Glow (behind)
  // =========================================================================
  ctx.save();
  const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.2);
  atmoGrad.addColorStop(0, "rgba(0,255,204,0)");
  atmoGrad.addColorStop(0.5, "rgba(0,255,204,0.05)");
  atmoGrad.addColorStop(0.85, "rgba(0,170,255,0.12)");
  atmoGrad.addColorStop(1, "rgba(0,170,255,0)");
  ctx.fillStyle = atmoGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // =========================================================================
  // 4. Ocean Fill
  // =========================================================================
  ctx.save();
  ctx.fillStyle = "rgba(0,15,40,0.92)";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // =========================================================================
  // 5. Continent Fills
  // =========================================================================
  for (let ci = 0; ci < continents.length; ci++) {
    const continent = continents[ci];
    ctx.save();
    ctx.fillStyle = "rgba(0,60,40,0.7)";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < continent.coords.length; i++) {
      const [latDeg, lonDeg] = continent.coords[i];
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180;
      const { x, y, z } = project(lat, lon, state.rotation, cx, cy, R);
      if (z > -R * 0.05) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        started = false;
      }
    }
    ctx.fill();
    ctx.restore();
  }

  // =========================================================================
  // 6. Grid Lines
  // =========================================================================

  // Regular latitude lines
  const regularLats = [-75, -60, -45, -30, -15, 15, 30, 45, 60, 75];
  for (let li = 0; li < regularLats.length; li++) {
    const latDeg = regularLats[li];
    const lat = (latDeg * Math.PI) / 180;
    ctx.save();
    ctx.strokeStyle = "rgba(0,255,204,0.10)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    let started = false;
    for (let lonDeg = 0; lonDeg <= 360; lonDeg += 2) {
      const lon = (lonDeg * Math.PI) / 180;
      const { x, y, z } = project(lat, lon, state.rotation, cx, cy, R);
      if (z > 0) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // Special latitude lines (brighter with glow)
  const specialLats: Array<[number, string, number]> = [
    [0, "rgba(0,255,204,0.45)", 5], // Equator
    [23.5, "rgba(0,255,204,0.30)", 3], // Tropic of Cancer
    [-23.5, "rgba(0,255,204,0.30)", 3], // Tropic of Capricorn
    [66.5, "rgba(0,200,255,0.25)", 3], // Arctic Circle
    [-66.5, "rgba(0,200,255,0.25)", 3], // Antarctic Circle
  ];
  for (let si = 0; si < specialLats.length; si++) {
    const [latDeg, color, blur] = specialLats[si];
    const lat = (latDeg * Math.PI) / 180;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.0;
    ctx.shadowBlur = blur;
    ctx.shadowColor = "#00ffcc";
    ctx.beginPath();
    let started = false;
    for (let lonDeg = 0; lonDeg <= 360; lonDeg += 2) {
      const lon = (lonDeg * Math.PI) / 180;
      const { x, y, z } = project(lat, lon, state.rotation, cx, cy, R);
      if (z > 0) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Longitude lines (meridians) every 15°
  ctx.save();
  ctx.strokeStyle = "rgba(0,255,204,0.08)";
  ctx.lineWidth = 0.8;
  for (let lonDeg = 0; lonDeg < 360; lonDeg += 15) {
    const lon = (lonDeg * Math.PI) / 180;
    ctx.beginPath();
    let started = false;
    for (let latDeg = -90; latDeg <= 90; latDeg += 2) {
      const lat = (latDeg * Math.PI) / 180;
      const { x, y, z } = project(lat, lon, state.rotation, cx, cy, R);
      if (z > 0) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
  }
  ctx.restore();

  // =========================================================================
  // 7. Continent Outlines
  // =========================================================================
  for (let ci = 0; ci < continents.length; ci++) {
    const continent = continents[ci];
    ctx.save();
    ctx.strokeStyle = "rgba(0,255,204,0.75)";
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = "#00ffcc";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < continent.coords.length; i++) {
      const [latDeg, lonDeg] = continent.coords[i];
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180;
      const { x, y, z } = project(lat, lon, state.rotation, cx, cy, R);
      if (z > -R * 0.05) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // =========================================================================
  // 8. Terminator Line (Day/Night Boundary)
  // =========================================================================
  const terminatorLon = -state.rotation - Math.PI / 2;
  ctx.save();
  ctx.strokeStyle = "rgba(255,180,80,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#ffaa44";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let tStarted = false;
  for (let latDeg = -90; latDeg <= 90; latDeg += 2) {
    const lat = (latDeg * Math.PI) / 180;
    const { x, y, z } = project(lat, terminatorLon, 0, cx, cy, R);
    if (Math.abs(z) < R * 0.3) {
      if (!tStarted) {
        ctx.moveTo(x, y);
        tStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
    } else {
      tStarted = false;
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // =========================================================================
  // 9. City Lights (Night Side Only)
  // =========================================================================
  for (let i = 0; i < state.cityLights.length; i++) {
    const city = state.cityLights[i];
    const { x, y, z } = project(city.lat, city.lon, state.rotation, cx, cy, R);

    if (z < -R * 0.05) {
      const nightDepth = Math.abs(z) / R; // 0→1 as you go deeper into night side
      ctx.save();
      ctx.globalAlpha = nightDepth * city.opacity * 0.8;
      ctx.fillStyle = "#ffee88";
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#ffcc44";
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // =========================================================================
  // 10. Cloud Layer
  // =========================================================================
  for (let i = 0; i < state.cloudPatches.length; i++) {
    const cloud = state.cloudPatches[i];

    const centroid = project(
      cloud.lat,
      cloud.lon,
      state.cloudRotation,
      cx,
      cy,
      R,
    );
    if (centroid.z < 0) continue;

    ctx.save();
    ctx.fillStyle = "rgba(180,230,255,0.18)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#aaddff";
    ctx.globalAlpha = cloud.opacity * (centroid.z / R);
    ctx.beginPath();
    let cStarted = false;
    for (let p = 0; p < cloud.points.length; p++) {
      const [latOff, lonOff] = cloud.points[p];
      const { x, y, z } = project(
        cloud.lat + latOff,
        cloud.lon + lonOff,
        state.cloudRotation,
        cx,
        cy,
        R,
      );
      if (z > 0) {
        if (!cStarted) {
          ctx.moveTo(x, y);
          cStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // =========================================================================
  // 11. Planes
  // =========================================================================
  for (let i = 0; i < state.planes.length; i++) {
    const plane = state.planes[i];

    // Project current position
    const altR = R * (1 + plane.altitude);
    const plat = plane.lat;
    const plon = plane.lon + state.rotation;
    const pz = altR * Math.cos(plat) * Math.cos(plon);
    if (pz <= 0) continue;

    const px = cx + altR * Math.cos(plat) * Math.sin(plon);
    const py = cy - altR * Math.sin(plat);

    // Trail
    if (plane.trail.length >= 2) {
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 0.6;
      for (let t = 1; t < plane.trail.length; t++) {
        const progress = t / plane.trail.length;
        ctx.globalAlpha = progress * 0.2;
        ctx.beginPath();
        ctx.moveTo(plane.trail[t - 1].x, plane.trail[t - 1].y);
        ctx.lineTo(plane.trail[t].x, plane.trail[t].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Plane dot
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#ffffff";
    ctx.beginPath();
    ctx.arc(px, py, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // =========================================================================
  // 12. Satellite Orbit Trails
  // =========================================================================
  for (let i = 0; i < state.satellites.length; i++) {
    const sat = state.satellites[i];
    if (sat.trail.length < 2) continue;

    ctx.save();
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 0.8;
    for (let t = 1; t < sat.trail.length; t++) {
      const progress = t / sat.trail.length;
      ctx.globalAlpha = progress * 0.25;
      ctx.beginPath();
      ctx.moveTo(sat.trail[t - 1].x, sat.trail[t - 1].y);
      ctx.lineTo(sat.trail[t].x, sat.trail[t].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // =========================================================================
  // 13. Satellites
  // =========================================================================
  for (let i = 0; i < state.satellites.length; i++) {
    const sat = state.satellites[i];
    const { x, y, z } = projectSatellite(sat, state);
    if (z <= 0) continue;

    const travelAngle = sat.angle + Math.PI / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(travelAngle);

    // Body
    ctx.fillStyle = "#aaaaaa";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#aaccff";
    ctx.fillRect(-3, -1.5, 6, 3);

    // Solar panels
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#4488ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-3, 0);
    ctx.moveTo(3, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    // Nav light blink ~1hz, alternates red/white
    const blink = Math.sin(sat.blinkPhase * Math.PI * 2) > 0;
    ctx.fillStyle = blink ? "#ff4444" : "#ffffff";
    ctx.shadowBlur = blink ? 4 : 0;
    ctx.shadowColor = "#ff4444";
    ctx.beginPath();
    ctx.arc(4, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // =========================================================================
  // 14. Atmosphere Glow (second pass — rim on top)
  // =========================================================================
  ctx.save();
  const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.08);
  rimGrad.addColorStop(0, "rgba(0,200,255,0)");
  rimGrad.addColorStop(0.7, "rgba(0,200,255,0.08)");
  rimGrad.addColorStop(1, "rgba(0,255,204,0.18)");
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
