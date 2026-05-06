"use client";

import { useEffect, useRef } from "react";
import {
  createRevengeScene,
  updateRevengeScene,
  drawRevengeScene,
  type RevengeSceneState,
} from "./revenge-scene";
import {
  createNeonField,
  updateNeonField,
  drawNeonField,
  type NeonFieldState,
} from "./neon-field";
import {
  createSolarSystem,
  updateSolarSystem,
  drawSolarSystem,
  type SolarSystemState,
} from "./solar-system-scene";
import {
  createGlobe,
  updateGlobe,
  drawGlobe,
  type GlobeState,
} from "./globe-scene";

// ---- Types ----

interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type SceneMode =
  | "draw"
  | "bounce"
  | "revenge"
  | "aquarium"
  | "neonField"
  | "solarSystem"
  | "globe";
interface Scene {
  name: string;
  mode: SceneMode;
  color: string;
  /** Drawing speed in px/sec (draw mode only) */
  speed: number;
  /** Line segments in normalized 0..1 coords (draw mode only) */
  lines: LineSegment[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface TrailGhost {
  x: number;
  y: number;
  age: number;
}

interface WakePoint {
  x: number;
  y: number;
}

interface Droplet {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  landed?: boolean;
}

interface NeonBlade {
  x: number;
  baseHeight: number;
  width: number;
  glowColor: string;
  coreColor: string;
  swayPhase: number;
  layer: 0 | 1 | 2; // 0=back, 1=mid, 2=front
  angle: number;
  velocity: number;
}

interface WindGust {
  x: number;
  speed: number;
  strength: number;
  direction: number; // +1 left→right, -1 right→left
}

interface AquariumBubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wobbleAmp: number;
  wobbleFreq: number;
  wobblePhase: number;
  opacity: number;
}

interface AquariumParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  headingRate: number;
  radius: number;
  color: string;
  pulseSpeed: number;
  phase: number;
}

interface AquariumFish {
  x: number;
  y: number;
  speed: number;
  direction: number; // +1 right, -1 left
  color: string;
  vDriftPhase: number;
  tailPhase: number;
}

interface AquariumJellyfish {
  x: number;
  y: number;
  speed: number;
  wobblePhase: number;
  bellPhase: number;
  tentacles: Array<{ phase: number; freq: number; length: number }>;
}

interface AquariumCaustic {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface AquariumLightRay {
  x: number;
  swayPhase: number;
  swayPeriod: number;
}

// ---- Scene Definitions ----

// Speeds slowed ~3x from original
const SEATTLE_SKYLINE: LineSegment[] = [
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
  { x1: 0.2, y1: 0.88, x2: 0.2, y2: 0.7 },
  { x1: 0.2, y1: 0.7, x2: 0.26, y2: 0.7 },
  { x1: 0.26, y1: 0.88, x2: 0.26, y2: 0.7 },
  { x1: 0.28, y1: 0.88, x2: 0.28, y2: 0.44 },
  { x1: 0.28, y1: 0.44, x2: 0.35, y2: 0.44 },
  { x1: 0.35, y1: 0.88, x2: 0.35, y2: 0.44 },
  { x1: 0.6, y1: 0.88, x2: 0.6, y2: 0.4 },
  { x1: 0.6, y1: 0.4, x2: 0.68, y2: 0.4 },
  { x1: 0.68, y1: 0.88, x2: 0.68, y2: 0.4 },
  { x1: 0.7, y1: 0.88, x2: 0.7, y2: 0.55 },
  { x1: 0.7, y1: 0.55, x2: 0.78, y2: 0.55 },
  { x1: 0.78, y1: 0.88, x2: 0.78, y2: 0.55 },
  { x1: 0.8, y1: 0.88, x2: 0.8, y2: 0.65 },
  { x1: 0.8, y1: 0.65, x2: 0.86, y2: 0.65 },
  { x1: 0.86, y1: 0.88, x2: 0.86, y2: 0.65 },
  { x1: 0.88, y1: 0.88, x2: 0.88, y2: 0.48 },
  { x1: 0.88, y1: 0.48, x2: 0.96, y2: 0.48 },
  { x1: 0.96, y1: 0.88, x2: 0.96, y2: 0.48 },
  { x1: 0.3, y1: 0.6, x2: 0.3, y2: 0.58 },
  { x1: 0.33, y1: 0.6, x2: 0.33, y2: 0.58 },
  { x1: 0.3, y1: 0.7, x2: 0.3, y2: 0.68 },
  { x1: 0.33, y1: 0.7, x2: 0.33, y2: 0.68 },
  { x1: 0.63, y1: 0.55, x2: 0.63, y2: 0.53 },
  { x1: 0.66, y1: 0.55, x2: 0.66, y2: 0.53 },
  { x1: 0.63, y1: 0.65, x2: 0.63, y2: 0.63 },
  { x1: 0.66, y1: 0.65, x2: 0.66, y2: 0.63 },
  { x1: 0.91, y1: 0.6, x2: 0.91, y2: 0.58 },
  { x1: 0.94, y1: 0.6, x2: 0.94, y2: 0.58 },
];

const BRICK_WALL: LineSegment[] = [];
{
  const rows = 12;
  const cols = 8;
  const brickH = 1 / rows;
  const brickW = 1 / cols;
  for (let row = 0; row < rows; row++) {
    const y = row * brickH;
    const offset = row % 2 === 0 ? 0 : brickW * 0.5;
    BRICK_WALL.push({ x1: 0, y1: y, x2: 1, y2: y });
    for (let col = 0; col <= cols; col++) {
      const x = offset + col * brickW;
      if (x <= 1.0) {
        BRICK_WALL.push({
          x1: x,
          y1: y,
          x2: x,
          y2: Math.min(y + brickH, 1),
        });
      }
    }
  }
  BRICK_WALL.push({ x1: 0, y1: 1, x2: 1, y2: 1 });
}

const CIRCUIT_BOARD: LineSegment[] = [
  { x1: 0.05, y1: 0.3, x2: 0.95, y2: 0.3 },
  { x1: 0.05, y1: 0.5, x2: 0.7, y2: 0.5 },
  { x1: 0.05, y1: 0.7, x2: 0.85, y2: 0.7 },
  { x1: 0.15, y1: 0.3, x2: 0.15, y2: 0.7 },
  { x1: 0.3, y1: 0.3, x2: 0.3, y2: 0.5 },
  { x1: 0.45, y1: 0.3, x2: 0.45, y2: 0.85 },
  { x1: 0.6, y1: 0.3, x2: 0.6, y2: 0.7 },
  { x1: 0.75, y1: 0.3, x2: 0.75, y2: 0.5 },
  { x1: 0.9, y1: 0.3, x2: 0.9, y2: 0.2 },
  { x1: 0.08, y1: 0.15, x2: 0.2, y2: 0.15 },
  { x1: 0.08, y1: 0.25, x2: 0.2, y2: 0.25 },
  { x1: 0.08, y1: 0.15, x2: 0.08, y2: 0.25 },
  { x1: 0.2, y1: 0.15, x2: 0.2, y2: 0.25 },
  { x1: 0.1, y1: 0.15, x2: 0.1, y2: 0.1 },
  { x1: 0.14, y1: 0.15, x2: 0.14, y2: 0.1 },
  { x1: 0.18, y1: 0.15, x2: 0.18, y2: 0.1 },
  { x1: 0.1, y1: 0.25, x2: 0.1, y2: 0.3 },
  { x1: 0.14, y1: 0.25, x2: 0.14, y2: 0.3 },
  { x1: 0.18, y1: 0.25, x2: 0.18, y2: 0.3 },
  { x1: 0.65, y1: 0.55, x2: 0.8, y2: 0.55 },
  { x1: 0.65, y1: 0.65, x2: 0.8, y2: 0.65 },
  { x1: 0.65, y1: 0.55, x2: 0.65, y2: 0.65 },
  { x1: 0.8, y1: 0.55, x2: 0.8, y2: 0.65 },
  { x1: 0.68, y1: 0.55, x2: 0.68, y2: 0.5 },
  { x1: 0.72, y1: 0.55, x2: 0.72, y2: 0.5 },
  { x1: 0.76, y1: 0.55, x2: 0.76, y2: 0.5 },
  { x1: 0.68, y1: 0.65, x2: 0.68, y2: 0.7 },
  { x1: 0.72, y1: 0.65, x2: 0.72, y2: 0.7 },
  { x1: 0.76, y1: 0.65, x2: 0.76, y2: 0.7 },
  { x1: 0.3, y1: 0.5, x2: 0.4, y2: 0.7 },
  { x1: 0.15, y1: 0.48, x2: 0.16, y2: 0.48 },
  { x1: 0.15, y1: 0.48, x2: 0.15, y2: 0.49 },
  { x1: 0.16, y1: 0.49, x2: 0.16, y2: 0.48 },
  { x1: 0.16, y1: 0.49, x2: 0.15, y2: 0.49 },
  { x1: 0.6, y1: 0.68, x2: 0.61, y2: 0.68 },
  { x1: 0.6, y1: 0.68, x2: 0.6, y2: 0.69 },
  { x1: 0.61, y1: 0.69, x2: 0.61, y2: 0.68 },
  { x1: 0.61, y1: 0.69, x2: 0.6, y2: 0.69 },
  { x1: 0.9, y1: 0.18, x2: 0.91, y2: 0.18 },
  { x1: 0.9, y1: 0.18, x2: 0.9, y2: 0.19 },
  { x1: 0.91, y1: 0.19, x2: 0.91, y2: 0.18 },
  { x1: 0.91, y1: 0.19, x2: 0.9, y2: 0.19 },
];

const STAR_MAP: LineSegment[] = [];
{
  let seed = 42;
  function lcg(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }
  const starPositions: { x: number; y: number }[] = [];
  const numStars = 45;
  for (let i = 0; i < numStars; i++) {
    const x = lcg() * 0.9 + 0.05;
    const y = lcg() * 0.8 + 0.05;
    starPositions.push({ x, y });
    const size = 0.006;
    STAR_MAP.push({ x1: x - size, y1: y, x2: x + size, y2: y });
    STAR_MAP.push({ x1: x, y1: y - size, x2: x, y2: y + size });
  }
  const constellations = [
    [0, 3, 7, 11],
    [1, 5, 9, 14],
    [2, 6, 10, 15],
    [4, 8, 12, 17],
    [13, 18, 22, 27],
    [16, 20, 24, 28],
    [19, 23, 26, 30],
    [21, 25, 29, 33],
    [31, 35, 38, 41],
    [34, 37, 40, 43],
  ];
  for (const group of constellations) {
    for (let i = 0; i < group.length - 1; i++) {
      const a = starPositions[group[i]];
      const b = starPositions[group[i + 1]];
      if (a && b) STAR_MAP.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  }
}

// Speed slowed ~3x from originals
const DRAW_SCENES: Scene[] = [
  {
    name: "seattle",
    mode: "draw",
    color: "#00ffcc",
    speed: 160,
    lines: SEATTLE_SKYLINE,
  },
  {
    name: "brick",
    mode: "draw",
    color: "#00aaff",
    speed: 800,
    lines: BRICK_WALL,
  },
  {
    name: "circuit",
    mode: "draw",
    color: "#ff44ff",
    speed: 400,
    lines: CIRCUIT_BOARD,
  },
  {
    name: "stars",
    mode: "draw",
    color: "#ffaa00",
    speed: 500,
    lines: STAR_MAP,
  },
];

// DVD bounce scene colors (we'll pick a random one at runtime)
const BOUNCE_COLORS = ["#00ffcc", "#00aaff", "#ff44ff", "#ffaa00"];

// ---- Helpers ----

function lineLength(l: LineSegment, w: number, h: number): number {
  const dx = (l.x2 - l.x1) * w;
  const dy = (l.y2 - l.y1) * h;
  return Math.sqrt(dx * dx + dy * dy);
}

// ---- DVD Logo line segments (normalized to logo local coords 0..1) ----
// A rounded rect with "BLOOSHOO" inside, drawn as pixel lines
function getDVDLogoLines(): LineSegment[] {
  const pad = 0.04;
  const r = 0.06;
  const rightEdge = 0.82;

  return [
    // Top
    { x1: pad + r, y1: pad, x2: rightEdge, y2: pad },
    // Bottom
    { x1: pad + r, y1: 1 - pad, x2: rightEdge, y2: 1 - pad },
    // Left
    { x1: pad, y1: pad + r, x2: pad, y2: 1 - pad - r },
    // Right
    { x1: rightEdge, y1: pad + r, x2: rightEdge, y2: 1 - pad - r },
    // Top-left arc
    { x1: pad, y1: pad + r, x2: pad + r * 0.3, y2: pad },
    // Top-right arc
    { x1: rightEdge, y1: pad + r, x2: rightEdge - r * 0.3, y2: pad },
    // Bottom-left arc
    { x1: pad, y1: 1 - pad - r, x2: pad + r * 0.3, y2: 1 - pad },
    // Bottom-right arc
    { x1: rightEdge, y1: 1 - pad - r, x2: rightEdge - r * 0.3, y2: 1 - pad },

    // BLOO — top row (y 0.2-0.48, each letter ~0.16 wide)
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

    // SHOO — bottom row (y 0.52-0.8)
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

// ---- Component ----

export function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dropCanvas = dropCanvasRef.current;
    if (!dropCanvas) return;
    const ctxTop = dropCanvas.getContext("2d");
    if (!ctxTop) return;

    let w = 0;
    let h = 0;
    let animId = 0;
    let lastTime = 0;

    // Pick a random scene on mount
    const allScenes: Scene[] = [
      ...DRAW_SCENES,
      {
        name: "dvd",
        mode: "bounce",
        color: BOUNCE_COLORS[Math.floor(Math.random() * BOUNCE_COLORS.length)],
        speed: 0,
        lines: [],
      },
      {
        name: "aquarium",
        mode: "aquarium",
        color: "#00ffcc",
        speed: 0,
        lines: [],
      },
      {
        name: "neonField",
        mode: "neonField",
        color: "#00ffcc",
        speed: 0,
        lines: [],
      },
      {
        name: "solarSystem",
        mode: "solarSystem",
        color: "#ffaa00",
        speed: 0,
        lines: [],
      },
      {
        name: "globe",
        mode: "globe",
        color: "#00ffcc",
        speed: 0,
        lines: [],
      },
    ];
    let scene = allScenes[Math.floor(Math.random() * allScenes.length)];

    // Draw-mode state
    let lineIdx = 0;
    let lineProgress = 0;
    let sceneAlpha = 1;
    let holdTimer = 0;
    let fadingOut = false;
    const HOLD_DURATION = 2500;
    const FADE_DURATION = 1000;

    // ---- Mobile / reduced-motion awareness ----
    let reducedMotion = false;
    const mobileBreakpoint = 768;

    // Bounce-mode state
    const DVD_LOGOW = 100;
    const DVD_LOGOH = 60;
    let dvdx = 0;
    let dvdy = 0;
    let dvdvx = 80;
    let dvdvy = 60;
    const trailGhosts: TrailGhost[] = [];
    let MAX_TRAIL = 18;

    // Wake line — continuous trail behind DVD logo
    const wakePoints: WakePoint[] = [];
    let MAX_WAKE = 50;

    // Falling "o" droplets
    const droplets: Droplet[] = [];
    let MAX_DROPLETS = 80;

    // Sparks (shared)
    const sparks: Spark[] = [];
    let MAX_SPARKS = 60;

    // ---- Revenge Scene state ----
    let revengeState: RevengeSceneState | null = null;

    // ---- Neon Field state ----
    let neonFieldState: NeonFieldState | null = null;

    // ---- Solar System state ----
    let solarSystemState: SolarSystemState | null = null;

    // ---- Globe state ----
    let globeState: GlobeState | null = null;

    // ---- Aquarium state ----
    const neonBlades: NeonBlade[] = [];
    const neonGusts: WindGust[] = [];
    let neonGustTimer = 0;
    let neonNextGustIn = 2 + Math.random() * 3;
    const AQUARIUM_MAX_GUSTS = 4;
    // bubbles
    const bubbles: AquariumBubble[] = [];
    const AQUARIUM_MAX_BUBBLES = 35;
    // bioluminescent particles
    const particles: AquariumParticle[] = [];
    const AQUARIUM_MAX_PARTICLES = 50;
    // fish
    const fish: AquariumFish[] = [];
    const AQUARIUM_MAX_FISH = 3;
    // jellyfish
    let jellyfish: AquariumJellyfish | null = null;
    // caustic light blobs
    const caustics: AquariumCaustic[] = [];
    const AQUARIUM_MAX_CAUSTICS = 6;
    // surface light rays
    const lightRays: AquariumLightRay[] = [];
    const AQUARIUM_MAX_RAYS = 5;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      dropCanvas!.width = w * dpr;
      dropCanvas!.height = h * dpr;
      dropCanvas!.style.width = `${w}px`;
      dropCanvas!.style.height = `${h}px`;
      ctxTop!.setTransform(dpr, 0, 0, dpr, 0, 0);

      reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const isMobile = w < mobileBreakpoint;
      MAX_TRAIL = isMobile ? 6 : 18;
      MAX_WAKE = isMobile ? 15 : 50;
      MAX_DROPLETS = isMobile ? 25 : 80;
      MAX_SPARKS = isMobile ? 18 : 60;

      if (scene.mode === "bounce") {
        if (dvdx === 0 && dvdy === 0) {
          dvdx = Math.random() * (w - DVD_LOGOW);
          dvdy = Math.random() * (h - DVD_LOGOH);
        }
        dvdvx = isMobile ? 50 + Math.random() * 25 : 80 + Math.random() * 40;
        dvdvy = isMobile ? 40 + Math.random() * 20 : 60 + Math.random() * 30;
        dvdx = Math.max(0, Math.min(dvdx, w - DVD_LOGOW));
        dvdy = Math.max(0, Math.min(dvdy, h - DVD_LOGOH));
      }
      if (scene.mode === "solarSystem" && solarSystemState) {
        solarSystemState = createSolarSystem(w, h);
      }
      if (scene.mode === "globe" && globeState) {
        globeState = createGlobe(w, h);
      }
    }

    function spawnSpark(x: number, y: number, color: string) {
      if (sparks.length >= MAX_SPARKS) sparks.shift();
      sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 30,
        vy: Math.random() * 40 + 20,
        life: Math.random() * 0.6 + 0.4,
        maxLife: 1,
        size: Math.random() * 2 + 1,
      });
    }

    function getCursorPos(): { x: number; y: number } {
      const line = scene.lines[lineIdx];
      if (!line) return { x: 0, y: 0 };
      const t = lineProgress;
      return {
        x: (line.x1 + (line.x2 - line.x1) * t) * w,
        y: (line.y1 + (line.y2 - line.y1) * t) * h,
      };
    }

    function drawGlowLine(
      cx: CanvasRenderingContext2D,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      alpha: number,
      lineWidth?: number,
    ) {
      const lw = lineWidth ?? 2.5;
      cx.save();
      cx.globalAlpha = alpha;
      cx.strokeStyle = color;
      cx.lineWidth = lw;
      cx.shadowColor = color;
      cx.shadowBlur = 14;
      cx.beginPath();
      cx.moveTo(x1, y1);
      cx.lineTo(x2, y2);
      cx.stroke();
      cx.restore();

      cx.save();
      cx.globalAlpha = alpha * 0.9;
      cx.strokeStyle = "#ffffff";
      cx.lineWidth = lw * 0.32;
      cx.shadowColor = "transparent";
      cx.shadowBlur = 0;
      cx.beginPath();
      cx.moveTo(x1, y1);
      cx.lineTo(x2, y2);
      cx.stroke();
      cx.restore();
    }

    function drawCursor(
      cx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      time: number,
    ) {
      const pulse = Math.sin(time * 6) * 0.3 + 0.7;
      cx.save();
      cx.globalAlpha = pulse * 0.6;
      cx.fillStyle = color;
      cx.shadowColor = color;
      cx.shadowBlur = 20 * pulse;
      cx.beginPath();
      cx.arc(x, y, 5, 0, Math.PI * 2);
      cx.fill();
      cx.restore();
      cx.save();
      cx.globalAlpha = pulse;
      cx.fillStyle = "#ffffff";
      cx.shadowColor = "#ffffff";
      cx.shadowBlur = 6;
      cx.beginPath();
      cx.arc(x, y, 2.5, 0, Math.PI * 2);
      cx.fill();
      cx.restore();
    }

    function drawSparks(cx: CanvasRenderingContext2D, color: string) {
      for (const s of sparks) {
        const progress = s.life / s.maxLife;
        cx.save();
        cx.globalAlpha = progress;
        cx.fillStyle = progress > 0.5 ? "#ffffff" : color;
        cx.shadowColor = color;
        cx.shadowBlur = 3;
        cx.fillRect(s.x, s.y, s.size, s.size);
        cx.restore();
      }
    }

    function updateSparks(dt: number) {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 60 * dt;
        s.life -= dt;
        if (s.life <= 0) sparks.splice(i, 1);
      }
    }

    // ---- Bounce helpers ----

    function getPageObstacles(): {
      x: number;
      y: number;
      w: number;
      h: number;
    }[] {
      const obstacles: { x: number; y: number; w: number; h: number }[] = [];

      // Header area
      const header = document.querySelector("header");
      if (header) {
        const r = header.getBoundingClientRect();
        obstacles.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      }

      // Footer — treat as a solid floor so the logo bounces off it
      const footer = document.querySelector("footer");
      if (footer) {
        const r = footer.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          obstacles.push({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
      }

      // Content blocks (sections with .content-block or main content panels)
      const blocks = document.querySelectorAll(
        ".content-block, [class*='content-panel']",
      );
      blocks.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          obstacles.push({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
      });

      return obstacles;
    }

    function dvdRect() {
      return { x: dvdx, y: dvdy, w: DVD_LOGOW, h: DVD_LOGOH };
    }

    function rectsOverlap(
      a: { x: number; y: number; w: number; h: number },
      b: { x: number; y: number; w: number; h: number },
    ): boolean {
      return (
        a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
      );
    }

    function updateBounce(dt: number) {
      // Wake point at current center
      wakePoints.push({
        x: dvdx + DVD_LOGOW / 2,
        y: dvdy + DVD_LOGOH / 2,
      });
      while (wakePoints.length > MAX_WAKE) wakePoints.shift();

      // Move
      dvdx += dvdvx * dt;
      dvdy += dvdvy * dt;

      const logo = dvdRect();
      let bounced = false;

      // Bounce off canvas edges
      if (logo.x < 0) {
        dvdx = 0;
        dvdvx = Math.abs(dvdvx);
        spawnEdgeSparks(0, logo.y + logo.h / 2, -1, 0);
        bounced = true;
      }
      if (logo.y < 0) {
        dvdy = 0;
        dvdvy = Math.abs(dvdvy);
        spawnEdgeSparks(logo.x + logo.w / 2, 0, 0, -1);
        bounced = true;
      }
      if (logo.x + logo.w > w) {
        dvdx = w - logo.w;
        dvdvx = -Math.abs(dvdvx);
        spawnEdgeSparks(w, logo.y + logo.h / 2, 1, 0);
        bounced = true;
      }
      if (logo.y + logo.h > h) {
        dvdy = h - logo.h;
        dvdvy = -Math.abs(dvdvy);
        spawnEdgeSparks(logo.x + logo.w / 2, h, 0, 1);
        bounced = true;
      }

      // Bounce off page obstacles
      const obstacles = getPageObstacles();
      const newLogo = dvdRect();
      for (const obs of obstacles) {
        if (rectsOverlap(newLogo, obs)) {
          // Determine which side we hit
          const overlapLeft = newLogo.x + newLogo.w - obs.x;
          const overlapRight = obs.x + obs.w - newLogo.x;
          const overlapTop = newLogo.y + newLogo.h - obs.y;
          const overlapBottom = obs.y + obs.h - newLogo.y;

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            if (overlapLeft < overlapRight) {
              dvdx = obs.x - newLogo.w;
              dvdvx = -Math.abs(dvdvx);
            } else {
              dvdx = obs.x + obs.w;
              dvdvx = Math.abs(dvdvx);
            }
          } else {
            if (overlapTop < overlapBottom) {
              dvdy = obs.y - newLogo.h;
              dvdvy = -Math.abs(dvdvy);
            } else {
              dvdy = obs.y + obs.h;
              dvdvy = Math.abs(dvdvy);
            }
          }
          bounced = true;
          break;
        }
      }

      // Spawn droplets on bounce
      if (bounced) {
        const cx = dvdx + DVD_LOGOW / 2;
        const cy = dvdy + DVD_LOGOH / 2;
        spawnDroplets(cx, cy, 12);
      }

      // Trail
      trailGhosts.push({ x: dvdx, y: dvdy, age: 0 });
      while (trailGhosts.length > MAX_TRAIL) trailGhosts.shift();
      for (const g of trailGhosts) g.age += dt;

      // Spawn occasional trailing sparks
      if (Math.random() < 8 * dt) {
        spawnSpark(
          dvdx + Math.random() * DVD_LOGOW,
          dvdy + DVD_LOGOH,
          scene.color,
        );
      }

      // Occasional droplet during flight
      if (Math.random() < 2 * dt) {
        const cx = dvdx + DVD_LOGOW / 2;
        const cy = dvdy + DVD_LOGOH / 2;
        spawnDroplets(cx, cy, 2);
      }
    }

    function spawnEdgeSparks(x: number, y: number, dirX: number, dirY: number) {
      for (let i = 0; i < 8; i++) {
        if (sparks.length >= MAX_SPARKS) sparks.shift();
        sparks.push({
          x,
          y,
          vx: dirX * (40 + Math.random() * 80) + (Math.random() - 0.5) * 40,
          vy: dirY * (40 + Math.random() * 80) + (Math.random() - 0.5) * 40,
          life: Math.random() * 0.5 + 0.5,
          maxLife: 1,
          size: Math.random() * 2.5 + 1,
        });
      }
    }

    function spawnDroplets(cx: number, cy: number, count: number) {
      for (let i = 0; i < count; i++) {
        if (droplets.length >= MAX_DROPLETS) droplets.shift();
        droplets.push({
          x: cx + (Math.random() - 0.5) * DVD_LOGOW * 0.8,
          y: cy + (Math.random() - 0.5) * DVD_LOGOH * 0.6,
          vy: Math.random() * 30 + 10,
          life: 2.5 + Math.random() * 2,
          maxLife: 4.5,
          landed: false,
          size: 3 + Math.random() * 4,
        });
      }
    }

    function updateDroplets(dt: number) {
      // Get landing surfaces (content blocks, footer)
      const surfaces: { x: number; y: number; w: number }[] = [];
      const footer = document.querySelector("footer");
      if (footer) {
        const r = footer.getBoundingClientRect();
        surfaces.push({ x: r.left, y: r.top, w: r.width });
      }
      const blocks = document.querySelectorAll(
        '.content-block, [class*="content-panel"]',
      );
      blocks.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          surfaces.push({ x: r.left, y: r.top, w: r.width });
        }
      });

      const stackMap = new Map<number, number>();

      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        if (d.landed) {
          d.life -= dt * 0.15;
          if (d.life <= 0) {
            droplets.splice(i, 1);
            continue;
          }
          continue;
        }

        d.y += d.vy * dt;
        d.vy += 80 * dt;

        let landed = false;
        for (const s of surfaces) {
          if (
            d.x >= s.x &&
            d.x <= s.x + s.w &&
            d.y >= s.y - 8 &&
            d.y <= s.y + 50
          ) {
            const stackKey = Math.round(d.x / 20) * 20;
            const stackCount = stackMap.get(stackKey) || 0;
            stackMap.set(stackKey, stackCount + 1);
            d.y = s.y - stackCount * 14 - 4;
            d.landed = true;
            d.vy = 0;
            landed = true;
            break;
          }
        }

        if (!landed && d.y > h - 14) {
          const stackKey = Math.round(d.x / 20) * 20;
          const stackCount = stackMap.get(stackKey) || 0;
          stackMap.set(stackKey, stackCount + 1);
          d.y = h - stackCount * 14 - 4;
          d.landed = true;
          d.vy = 0;
        }
      }

      while (droplets.length > 400) {
        droplets.shift();
      }
    }
    function drawDropletsOnTop() {
      const cx = ctxTop!;
      cx.clearRect(0, 0, w, h);
      cx.font = 'bold 14px "Courier New", monospace';
      cx.textBaseline = "middle";
      cx.textAlign = "center";
      for (const d of droplets) {
        const progress = Math.max(0, d.life / d.maxLife);
        cx.save();
        cx.globalAlpha = progress * 0.75;
        cx.fillStyle = scene.color;
        cx.shadowColor = scene.color;
        cx.shadowBlur = 10;
        cx.fillText("o", d.x, d.y);
        cx.globalAlpha = progress;
        cx.fillStyle = "#ffffff";
        cx.shadowBlur = 3;
        cx.fillText("o", d.x, d.y);
        cx.restore();
      }
    }

    function drawWake(cx: CanvasRenderingContext2D) {
      if (wakePoints.length < 2) return;
      cx.save();
      cx.lineCap = "round";
      cx.lineJoin = "round";
      for (let i = 0; i < wakePoints.length - 1; i++) {
        const p0 = wakePoints[i];
        const p1 = wakePoints[i + 1];
        if (!p0 || !p1) continue;
        const segAlpha = (i / wakePoints.length) * 0.5;
        // Glow
        cx.globalAlpha = segAlpha;
        cx.strokeStyle = scene.color;
        cx.lineWidth = 2;
        cx.shadowColor = scene.color;
        cx.shadowBlur = 10;
        cx.beginPath();
        cx.moveTo(p0.x, p0.y);
        cx.lineTo(p1.x, p1.y);
        cx.stroke();
        // Core
        cx.globalAlpha = segAlpha * 0.7;
        cx.strokeStyle = "#ffffff";
        cx.lineWidth = 0.6;
        cx.shadowColor = "transparent";
        cx.shadowBlur = 0;
        cx.beginPath();
        cx.moveTo(p0.x, p0.y);
        cx.lineTo(p1.x, p1.y);
        cx.stroke();
      }
      cx.restore();
    }

    function drawDVDLogo(
      cx: CanvasRenderingContext2D,
      x: number,
      y: number,
      alpha: number,
    ) {
      const logoLines = getDVDLogoLines();
      cx.save();
      cx.translate(x, y);
      cx.scale(DVD_LOGOW, DVD_LOGOH);
      for (const l of logoLines) {
        const lx1 = l.x1;
        const ly1 = l.y1;
        const lx2 = l.x2;
        const ly2 = l.y2;
        // Glow
        cx.save();
        cx.globalAlpha = alpha;
        cx.strokeStyle = scene.color;
        cx.lineWidth = 0.025;
        cx.shadowColor = scene.color;
        cx.shadowBlur = 10;
        cx.beginPath();
        cx.moveTo(lx1, ly1);
        cx.lineTo(lx2, ly2);
        cx.stroke();
        cx.restore();
        // White core (kept subtle so the color reads through)
        cx.save();
        cx.globalAlpha = alpha * 0.45;
        cx.strokeStyle = "#ffffff";
        cx.lineWidth = 0.008;
        cx.shadowColor = "transparent";
        cx.shadowBlur = 0;
        cx.beginPath();
        cx.moveTo(lx1, ly1);
        cx.lineTo(lx2, ly2);
        cx.stroke();
        cx.restore();
      }
      cx.restore();
    }

    function initAquarium() {
      // ---- clear all arrays ----
      neonBlades.length = 0;
      neonGusts.length = 0;
      bubbles.length = 0;
      particles.length = 0;
      fish.length = 0;
      caustics.length = 0;
      lightRays.length = 0;
      neonGustTimer = 0;
      neonNextGustIn = 2 + Math.random() * 3;

      // ---- grass blades (kept from neonField) ----
      const layers: Array<{
        count: number;
        label: 0 | 1 | 2;
        heightMin: number;
        heightMax: number;
        widthMin: number;
        widthMax: number;
        glowColors: string[];
        coreColors: string[];
        glowChance2?: number;
        glowColorsAlt?: string[];
        coreColorsAlt?: string[];
      }> = [
        {
          count: 120,
          label: 0,
          heightMin: 40,
          heightMax: 80,
          widthMin: 0.5,
          widthMax: 0.5,
          glowColors: ["#007755"],
          coreColors: ["#00aa77"],
        },
        {
          count: 100,
          label: 1,
          heightMin: 70,
          heightMax: 130,
          widthMin: 1,
          widthMax: 1,
          glowColors: ["#00ccaa"],
          coreColors: ["#00eebb"],
        },
        {
          count: 80,
          label: 2,
          heightMin: 110,
          heightMax: 200,
          widthMin: 1.5,
          widthMax: 2,
          glowColors: ["#00ffcc"],
          coreColors: ["#00ffcc"],
          glowChance2: 0.3,
          glowColorsAlt: ["#00aaff"],
          coreColorsAlt: ["#00aaff"],
        },
      ];
      for (const layer of layers) {
        for (let i = 0; i < layer.count; i++) {
          const useAlt =
            layer.glowChance2 !== undefined &&
            Math.random() < layer.glowChance2;
          neonBlades.push({
            x: Math.random() * w,
            baseHeight:
              layer.heightMin +
              Math.random() * (layer.heightMax - layer.heightMin),
            width:
              layer.widthMin === layer.widthMax
                ? layer.widthMin
                : layer.widthMin +
                  Math.random() * (layer.widthMax - layer.widthMin),
            glowColor: useAlt ? layer.glowColorsAlt![0] : layer.glowColors[0],
            coreColor: useAlt ? layer.coreColorsAlt![0] : layer.coreColors[0],
            swayPhase: Math.random() * Math.PI * 2,
            layer: layer.label,
            angle: 0,
            velocity: 0,
          });
        }
      }

      // ---- bubbles ----
      for (let i = 0; i < AQUARIUM_MAX_BUBBLES; i++) {
        bubbles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: 2 + Math.random() * 5,
          speed: 15 + Math.random() * 25,
          wobbleAmp: 3 + Math.random() * 5,
          wobbleFreq: 0.8 + Math.random() * 1.6,
          wobblePhase: Math.random() * Math.PI * 2,
          opacity: 0.3 + Math.random() * 0.4,
        });
      }

      // ---- bioluminescent particles ----
      const PARTICLE_COLORS = ["#00ffcc", "#00aaff", "#cc44ff", "#ffffff"];
      for (let i = 0; i < AQUARIUM_MAX_PARTICLES; i++) {
        const heading = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: Math.cos(heading) * speed,
          vy: Math.sin(heading) * speed,
          heading,
          headingRate: (Math.random() - 0.5) * 0.6,
          radius: 1 + Math.random() * 2,
          color:
            PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          pulseSpeed: 1.5 + Math.random() * 3,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // ---- fish ----
      const FISH_COLORS = ["#00ffcc", "#00aaff", "#ff44ff"];
      for (let i = 0; i < AQUARIUM_MAX_FISH; i++) {
        fish.push({
          x: Math.random() * w,
          y: h * 0.2 + Math.random() * h * 0.6,
          speed: 25 + Math.random() * 30,
          direction: Math.random() < 0.5 ? 1 : -1,
          color: FISH_COLORS[i % FISH_COLORS.length],
          vDriftPhase: Math.random() * Math.PI * 2,
          tailPhase: Math.random() * Math.PI * 2,
        });
      }

      // ---- jellyfish ----
      jellyfish = {
        x: w * 0.3 + Math.random() * w * 0.4,
        y: h * 0.65 + Math.random() * h * 0.15,
        speed: 8 + Math.random() * 6,
        wobblePhase: Math.random() * Math.PI * 2,
        bellPhase: Math.random() * Math.PI * 2,
        tentacles: Array.from({ length: 6 }, () => ({
          phase: Math.random() * Math.PI * 2,
          freq: 2 + Math.random() * 3,
          length: 40 + Math.random() * 30,
        })),
      };

      // ---- caustic light blobs ----
      for (let i = 0; i < AQUARIUM_MAX_CAUSTICS; i++) {
        caustics.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          radius: 140 + Math.random() * 80,
        });
      }

      // ---- surface light rays ----
      for (let i = 0; i < AQUARIUM_MAX_RAYS; i++) {
        lightRays.push({
          x: w * (0.1 + i * 0.18) + (Math.random() - 0.5) * 60,
          swayPhase: Math.random() * Math.PI * 2,
          swayPeriod: 8 + Math.random() * 6,
        });
      }
    }

    function updateAquarium(dt: number, timeSec: number) {
      const dtCapped = Math.min(dt, 0.05);

      // ================================================================
      // GRASS BLADES + GUSTS (kept from neonField)
      // ================================================================
      neonGustTimer += dtCapped;
      if (
        neonGustTimer >= neonNextGustIn &&
        neonGusts.length < AQUARIUM_MAX_GUSTS
      ) {
        neonGustTimer = 0;
        neonNextGustIn = 2 + Math.random() * 3;
        const direction = Math.random() < 0.5 ? 1 : -1;
        neonGusts.push({
          x: direction === 1 ? -20 : w + 20,
          speed: 80 + Math.random() * 140,
          strength: 0.3 + Math.random() * 0.7,
          direction,
        });
      }
      for (let i = neonGusts.length - 1; i >= 0; i--) {
        const g = neonGusts[i];
        g.x += g.speed * g.direction * dtCapped;
        if (
          (g.direction === 1 && g.x > w + 200) ||
          (g.direction === -1 && g.x < -200)
        ) {
          neonGusts.splice(i, 1);
        }
      }

      const SIGMA = 120;
      const DEG = Math.PI / 180;
      for (let b = 0; b < neonBlades.length; b++) {
        const blade = neonBlades[b];
        let targetAngle =
          Math.sin(neonGustTimer * 0.8 + blade.swayPhase) * 3 * DEG;
        for (let gi = 0; gi < neonGusts.length; gi++) {
          const g = neonGusts[gi];
          const dx = blade.x - g.x;
          const influence = Math.exp(-(dx * dx) / (2 * SIGMA * SIGMA));
          targetAngle += g.direction * g.strength * influence * 55 * DEG;
        }
        const stiffness = 6;
        const damping = 4;
        const force =
          stiffness * (targetAngle - blade.angle) - damping * blade.velocity;
        blade.velocity += force * dtCapped;
        blade.angle += blade.velocity * dtCapped;
      }

      // ================================================================
      // BUBBLES
      // ================================================================
      for (let i = 0; i < bubbles.length; i++) {
        const bub = bubbles[i];
        bub.y -= bub.speed * dtCapped;
        bub.x +=
          Math.sin(timeSec * bub.wobbleFreq + bub.wobblePhase) *
          bub.wobbleAmp *
          dtCapped;
        if (bub.y + bub.radius < 0) {
          bub.y = h + bub.radius + Math.random() * 40;
          bub.x = Math.random() * w;
          bub.radius = 2 + Math.random() * 5;
          bub.speed = 15 + Math.random() * 25;
          bub.opacity = 0.3 + Math.random() * 0.4;
          bub.wobblePhase = Math.random() * Math.PI * 2;
        }
      }

      // ================================================================
      // BIOLUMINESCENT PARTICLES
      // ================================================================
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.heading += p.headingRate * dtCapped;
        const spd = 4 + Math.random() * 0; // speed baked into vx/vy at init, keep stable
        p.vx = Math.cos(p.heading) * (4 + (i % 9));
        p.vy = Math.sin(p.heading) * (4 + (i % 9));
        p.x += p.vx * dtCapped;
        p.y += p.vy * dtCapped;
        // wrap around edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // ================================================================
      // FISH
      // ================================================================
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i];
        f.x += f.direction * f.speed * dtCapped;
        // gentle vertical sine drift
        const driftY = Math.sin(timeSec * 0.5 + f.vDriftPhase) * 15;
        // swim off edge → flip direction
        if (f.direction === 1 && f.x > w + 40) {
          f.direction = -1;
          f.y = h * 0.2 + Math.random() * h * 0.6;
          f.speed = 25 + Math.random() * 30;
        } else if (f.direction === -1 && f.x < -40) {
          f.direction = 1;
          f.y = h * 0.2 + Math.random() * h * 0.6;
          f.speed = 25 + Math.random() * 30;
        }
        // store drift for drawing
        (f as any)._driftY = driftY;
      }

      // ================================================================
      // JELLYFISH
      // ================================================================
      if (jellyfish) {
        const j = jellyfish;
        j.y -= j.speed * dtCapped;
        j.x += Math.sin(timeSec * 0.7 + j.wobblePhase) * 12 * dtCapped;
        // reset when near top
        if (j.y < h * 0.2) {
          j.y = h * 0.6 + Math.random() * h * 0.3;
          j.x = w * 0.3 + Math.random() * w * 0.4;
        }
        // clamp to canvas
        if (j.x < 30) j.x = 30;
        if (j.x > w - 30) j.x = w - 30;
      }

      // ================================================================
      // CAUSTICS
      // ================================================================
      for (let i = 0; i < caustics.length; i++) {
        const c = caustics[i];
        c.x += c.vx * dtCapped;
        c.y += c.vy * dtCapped;
        if (c.x < -c.radius) {
          c.x = w + c.radius;
          c.vx = Math.abs(c.vx);
        }
        if (c.x > w + c.radius) {
          c.x = -c.radius;
          c.vx = -Math.abs(c.vx);
        }
        if (c.y < -c.radius) {
          c.y = h + c.radius;
          c.vy = Math.abs(c.vy);
        }
        if (c.y > h + c.radius) {
          c.y = -c.radius;
          c.vy = -Math.abs(c.vy);
        }
      }
    }

    function drawAquarium(ctx: CanvasRenderingContext2D, timeSec: number) {
      // ================================================================
      // LAYER 1 — WATER ATMOSPHERE
      // ================================================================

      // Vertical color cast gradient (bottom transparent → deep blue at top)
      const waterGrad = ctx.createLinearGradient(0, h, 0, 0);
      waterGrad.addColorStop(0, "rgba(0, 10, 30, 0)");
      waterGrad.addColorStop(1, "rgba(0, 20, 60, 0.6)");
      ctx.save();
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Soft horizontal haze band at ~35% from bottom
      const hazeY = h * 0.65;
      const hazeGrad = ctx.createRadialGradient(
        w / 2,
        hazeY,
        0,
        w / 2,
        hazeY,
        w * 0.8,
      );
      hazeGrad.addColorStop(0, "rgba(0, 80, 120, 0.12)");
      hazeGrad.addColorStop(1, "rgba(0, 80, 120, 0)");
      ctx.save();
      ctx.fillStyle = hazeGrad;
      ctx.scale(1.6, 0.3);
      ctx.fillRect(0, hazeY / 0.3 - 60, w, 120);
      ctx.restore();

      // Caustic shimmer blobs
      for (let i = 0; i < caustics.length; i++) {
        const c = caustics[i];
        const causticGrad = ctx.createRadialGradient(
          c.x,
          c.y,
          0,
          c.x,
          c.y,
          c.radius,
        );
        causticGrad.addColorStop(0, "rgba(0, 180, 200, 0.04)");
        causticGrad.addColorStop(1, "rgba(0, 180, 200, 0)");
        ctx.save();
        ctx.fillStyle = causticGrad;
        ctx.fillRect(
          c.x - c.radius,
          c.y - c.radius,
          c.radius * 2,
          c.radius * 2,
        );
        ctx.restore();
      }

      // ================================================================
      // LAYER 2 (was neonField grass) — SEA GRASS BLADES
      // ================================================================
      const shadowBlurs = [4, 8, 14];
      for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < neonBlades.length; i++) {
          const blade = neonBlades[i];
          if (blade.layer !== layer) continue;
          const startX = blade.x;
          const startY = h;
          const tipX = blade.x + Math.sin(blade.angle) * blade.baseHeight;
          const tipY = h - Math.cos(blade.angle) * blade.baseHeight;
          const cpX =
            blade.x + Math.sin(blade.angle * 0.65) * blade.baseHeight * 0.6;
          const cpY = h - Math.cos(blade.angle * 0.65) * blade.baseHeight * 0.6;

          // Glow pass
          ctx.save();
          ctx.strokeStyle = blade.glowColor;
          ctx.lineWidth = blade.width;
          ctx.shadowColor = blade.glowColor;
          ctx.shadowBlur = shadowBlurs[layer];
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
          ctx.stroke();
          ctx.restore();

          // Core pass (tip brightest, base darker)
          const grad = ctx.createLinearGradient(startX, startY, tipX, tipY);
          grad.addColorStop(0, blade.coreColor);
          grad.addColorStop(1, "#ffffff");
          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = blade.width * 0.35;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ================================================================
      // LAYER 4 — FISH (above grass, below bubbles)
      // ================================================================
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i];
        const fy = f.y + ((f as any)._driftY || 0);
        ctx.save();
        ctx.translate(f.x, fy);
        ctx.scale(f.direction, 1);

        // Body — pointed oval using bezier curves
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.bezierCurveTo(14, -6, -8, -6, -14, 0);
        ctx.bezierCurveTo(-8, 6, 14, 6, 14, 0);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 20, 40, 0.7)";
        ctx.fill();
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 1;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Tail — forked V with oscillation
        ctx.save();
        ctx.translate(-14, 0);
        ctx.rotate(Math.sin(timeSec * 3 + f.tailPhase) * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-8, -6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 20, 40, 0.7)";
        ctx.fill();
        ctx.strokeStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Dorsal fin
        ctx.beginPath();
        ctx.moveTo(4, -5);
        ctx.lineTo(-2, -12);
        ctx.lineTo(-6, -5);
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 20, 40, 0.5)";
        ctx.fill();
        ctx.strokeStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // ================================================================
      // LAYER 2 — BUBBLES
      // ================================================================
      for (let i = 0; i < bubbles.length; i++) {
        const bub = bubbles[i];
        const bubX =
          bub.x +
          Math.sin(timeSec * bub.wobbleFreq + bub.wobblePhase) * bub.wobbleAmp;
        ctx.save();
        ctx.strokeStyle = `rgba(100, 220, 255, ${bub.opacity})`;
        ctx.lineWidth = 0.8;
        ctx.shadowColor = "#00ccff";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(bubX, bub.y, bub.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ================================================================
      // LAYER 3 — BIOLUMINESCENT PARTICLES
      // ================================================================
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pulse = Math.sin(timeSec * p.pulseSpeed + p.phase) * 0.4 + 0.5;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ================================================================
      // LAYER 5 — JELLYFISH
      // ================================================================
      if (jellyfish) {
        const j = jellyfish;
        const bellScale = 1 + Math.sin(timeSec * Math.PI + j.bellPhase) * 0.15;

        ctx.save();
        ctx.translate(j.x, j.y);

        // Bell dome
        ctx.save();
        ctx.scale(1, bellScale);
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.quadraticCurveTo(0, -24, 15, 0);
        ctx.closePath();
        ctx.fillStyle = "rgba(180, 100, 255, 0.15)";
        ctx.fill();
        ctx.strokeStyle = "#cc44ff";
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "#cc44ff";
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Tentacles
        for (let t = 0; t < j.tentacles.length; t++) {
          const tent = j.tentacles[t];
          const baseX = -12 + t * 4.8;
          ctx.beginPath();
          ctx.moveTo(baseX, 0);
          for (let s = 0; s <= 1; s += 0.08) {
            const ty = s * tent.length;
            const tx =
              baseX + Math.sin(s * 7 + timeSec * tent.freq + tent.phase) * 5;
            ctx.lineTo(tx, ty);
          }
          ctx.strokeStyle = "#cc44ff";
          ctx.lineWidth = 0.7;
          ctx.shadowColor = "#cc44ff";
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      // ================================================================
      // LAYER 6 — SURFACE LIGHT RAYS
      // ================================================================
      const rayHeight = h * 0.4;
      for (let i = 0; i < lightRays.length; i++) {
        const ray = lightRays[i];
        const topX = ray.x;
        const sway =
          Math.sin(timeSec * ((2 * Math.PI) / ray.swayPeriod) + ray.swayPhase) *
          15;
        const bottomX = topX + sway;

        const rayGrad = ctx.createLinearGradient(topX, 0, bottomX, rayHeight);
        rayGrad.addColorStop(0, "rgba(100, 220, 255, 0.06)");
        rayGrad.addColorStop(1, "rgba(100, 220, 255, 0)");

        ctx.save();
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(topX - 1, 0);
        ctx.lineTo(topX + 1, 0);
        ctx.lineTo(bottomX + 4, rayHeight);
        ctx.lineTo(bottomX - 4, rayHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // ---- Main tick ----

    function tick(time: number) {
      if (reducedMotion) {
        ctx!.fillStyle = "#0a0a0f";
        ctx!.fillRect(0, 0, w, h);
        return;
      }
      animId = requestAnimationFrame(tick);

      const rawDt = lastTime === 0 ? 0 : (time - lastTime) / 1000;
      lastTime = time;
      const dt = Math.min(rawDt, 0.1);

      ctx!.clearRect(0, 0, w, h);

      if (scene.mode === "bounce") {
        // ---- DVD Bounce Mode ----
        updateBounce(dt);
        updateSparks(dt);
        updateDroplets(dt);

        // Draw wake line
        drawWake(ctx!);

        // Draw trail ghosts
        for (const g of trailGhosts) {
          const trailAlpha = Math.max(0, 0.35 * (1 - g.age / 1.5));
          if (trailAlpha > 0) {
            drawDVDLogo(ctx!, g.x, g.y, trailAlpha);
          }
        }

        // Draw main logo
        drawDVDLogo(ctx!, dvdx, dvdy, 1);

        // Draw sparks
        drawSparks(ctx!, scene.color);

        // Draw falling o droplets
        drawDropletsOnTop();

        // Subtle cursor-like glow at center of DVD logo
        const cx = dvdx + DVD_LOGOW / 2;
        const cy = dvdy + DVD_LOGOH / 2;
        const pulse = Math.sin((time / 1000) * 6) * 0.2 + 0.5;
        ctx!.save();
        ctx!.globalAlpha = pulse;
        ctx!.fillStyle = scene.color;
        ctx!.shadowColor = scene.color;
        ctx!.shadowBlur = 18;
        ctx!.beginPath();
        ctx!.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();

        return;
      }

      if (scene.mode === "revenge" && revengeState) {
        revengeState.w = w;
        revengeState.h = h;
        updateRevengeScene(revengeState, dt);
        ctxTop!.clearRect(0, 0, w, h);
        drawRevengeScene(revengeState, ctx!);
        // If scene reset, the module handles it internally via sceneShouldReset flag
        return;
      }

      if (scene.mode === "neonField" && neonFieldState) {
        neonFieldState.w = w;
        neonFieldState.h = h;
        const tSec = time / 1000;
        updateNeonField(neonFieldState, dt);
        drawNeonField(neonFieldState, ctx!);
        return;
      }

      if (scene.mode === "solarSystem" && solarSystemState) {
        solarSystemState.w = w;
        solarSystemState.h = h;
        updateSolarSystem(solarSystemState, dt);
        drawSolarSystem(solarSystemState, ctx!);
        return;
      }

      if (scene.mode === "globe" && globeState) {
        updateGlobe(globeState, dt);
        drawGlobe(globeState, ctx!);
        return;
      }

      if (scene.mode === "aquarium") {
        const tSec = time / 1000;
        updateAquarium(dt, tSec);
        drawAquarium(ctx!, tSec);
        return;
      }

      // ---- Draw Mode ----
      if (fadingOut) {
        sceneAlpha -= dt / (FADE_DURATION / 1000);
        if (sceneAlpha <= 0) {
          sceneAlpha = 0;
          fadingOut = false;
          lineIdx = 0;
          lineProgress = 0;
          holdTimer = 0;
          sparks.length = 0;
          sceneAlpha = 1;
        }
      } else if (lineIdx >= scene.lines.length) {
        holdTimer += dt * 1000;
        if (holdTimer >= HOLD_DURATION) {
          fadingOut = true;
        }
      } else {
        const curLine = scene.lines[lineIdx];
        const len = lineLength(curLine, w, h);
        const timeToDraw = len / scene.speed;
        if (timeToDraw > 0) {
          lineProgress += dt / timeToDraw;
        } else {
          lineProgress = 1;
        }

        const cursor = getCursorPos();
        const sparkRate = scene.speed > 500 ? 15 : 5;
        if (Math.random() < sparkRate * dt) {
          spawnSpark(cursor.x, cursor.y, scene.color);
        }

        if (lineProgress >= 1) {
          lineProgress = 0;
          lineIdx++;
          const pos = getCursorPos();
          for (let i = 0; i < 4; i++) {
            spawnSpark(pos.x, pos.y, scene.color);
          }
        }
      }

      updateSparks(dt);

      const renderAlpha = fadingOut ? sceneAlpha : 1;

      // Draw completed segments
      for (let i = 0; i < lineIdx; i++) {
        const l = scene.lines[i];
        drawGlowLine(
          ctx!,
          l.x1 * w,
          l.y1 * h,
          l.x2 * w,
          l.y2 * h,
          scene.color,
          renderAlpha,
        );
      }

      // Draw current partial segment
      if (lineIdx < scene.lines.length) {
        const l = scene.lines[lineIdx];
        const t = Math.min(lineProgress, 1);
        const cx = l.x1 + (l.x2 - l.x1) * t;
        const cy = l.y1 + (l.y2 - l.y1) * t;
        drawGlowLine(
          ctx!,
          l.x1 * w,
          l.y1 * h,
          cx * w,
          cy * h,
          scene.color,
          renderAlpha,
        );
      }

      drawSparks(ctx!, scene.color);

      if (!fadingOut && lineIdx < scene.lines.length) {
        const cursor = getCursorPos();
        drawCursor(ctx!, cursor.x, cursor.y, scene.color, time / 1000);
      }

      if (fadingOut) {
        ctx!.save();
        ctx!.globalAlpha = 1 - sceneAlpha;
        ctx!.fillStyle = "#0a0a0f";
        ctx!.fillRect(0, 0, w, h);
        ctx!.restore();
      }
    }

    resize();
    if (scene.mode === "revenge") {
      revengeState = createRevengeScene(w, h);
    }
    if (scene.mode === "neonField") neonFieldState = createNeonField(w, h);
    if (scene.mode === "solarSystem")
      solarSystemState = createSolarSystem(w, h);
    if (scene.mode === "globe") globeState = createGlobe(w, h);
    if (scene.mode === "aquarium") initAquarium();

    // ---- Scene picker event handling ----
    function respondWithScenes() {
      window.dispatchEvent(
        new CustomEvent("blooshoo:scenes-list", {
          detail: {
            scenes: allScenes.map((s) => ({
              name: s.name,
              mode: s.mode,
              color: s.color,
            })),
            current: scene.mode,
          },
        }),
      );
    }

    function switchToScene(mode: string) {
      const found = allScenes.find((s) => s.mode === mode);
      if (!found) return;
      scene = found;
      // Reset draw-mode state
      lineIdx = 0;
      lineProgress = 0;
      sceneAlpha = 1;
      holdTimer = 0;
      fadingOut = false;
      trailGhosts.length = 0;
      wakePoints.length = 0;
      sparks.length = 0;
      droplets.length = 0;
      // Null out all scene states
      revengeState = null;
      neonFieldState = null;
      solarSystemState = null;
      globeState = null;
      // Init the selected scene
      if (mode === "revenge") revengeState = createRevengeScene(w, h);
      if (mode === "neonField") neonFieldState = createNeonField(w, h);
      if (mode === "solarSystem") solarSystemState = createSolarSystem(w, h);
      if (mode === "globe") globeState = createGlobe(w, h);
      if (mode === "aquarium") initAquarium();
      respondWithScenes();
    }

    function handleSwitchScene(e: Event) {
      switchToScene((e as CustomEvent).detail.mode);
    }

    window.addEventListener("blooshoo:request-scenes", respondWithScenes);
    window.addEventListener("blooshoo:switch-scene", handleSwitchScene);
    window.addEventListener("resize", resize);
    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("blooshoo:request-scenes", respondWithScenes);
      window.removeEventListener("blooshoo:switch-scene", handleSwitchScene);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        aria-hidden="true"
      />
      <canvas
        ref={dropCanvasRef}
        className="fixed inset-0 z-20 pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}
