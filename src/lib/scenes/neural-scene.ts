// =============================================================================
// neural-scene.ts  –  Neural network activation scene
// =============================================================================
// 5-layer fully-connected network. Cascades of activation pulses fire every
// few seconds, traveling along edges from input → output with a fading trail.
// Drop-in module; exports createNeuralNet / updateNeuralNet / drawNeuralNet.
// =============================================================================

// ---- Interfaces ----

interface NeuralNode {
  x: number;
  y: number;
  activation: number;     // 0..1 current glow intensity
  activationTimer: number; // counts down from ACTIVATION_DURATION → 0
}

interface NeuralEdge {
  fromLayer: number;
  fromNode: number;
  toLayer: number;
  toNode: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pulseAlpha: number; // brightens when a pulse travels it, then fades
}

interface TrailPoint {
  t: number;
  alpha: number;
}

interface NeuralPulse {
  edgeIdx: number;
  t: number;     // 0 → 1 progress along edge
  speed: number;
  active: boolean;
  trail: TrailPoint[];
}

export interface NeuralNetState {
  w: number;
  h: number;
  time: number;
  layers: NeuralNode[][];
  edges: NeuralEdge[];
  pulses: NeuralPulse[];
  cascadeTimer: number;
  nextCascadeIn: number;
}

// ---- Constants ----

const LAYER_SIZES = [4, 6, 6, 6, 3];
const MAX_PULSES = 80;
const BASE_PULSE_SPEED = 0.75; // progress/second
const ACTIVATION_DURATION = 0.8; // seconds to fade
const EDGE_GLOW_DECAY = 2.2;
const CASCADE_EDGE_PROB = 0.68; // chance a pulse fires on each outgoing edge

// ---- Helpers ----

function buildLayout(
  w: number,
  h: number,
): { layers: NeuralNode[][]; edges: NeuralEdge[] } {
  const layers: NeuralNode[][] = [];
  const nodeSpacing = Math.min(h * 0.1, 58);

  for (let li = 0; li < LAYER_SIZES.length; li++) {
    const count = LAYER_SIZES[li];
    const xFrac = 0.15 + (li / (LAYER_SIZES.length - 1)) * 0.7;
    const x = w * xFrac;
    const totalH = (count - 1) * nodeSpacing;
    const startY = h / 2 - totalH / 2;
    const nodes: NeuralNode[] = [];
    for (let ni = 0; ni < count; ni++) {
      nodes.push({
        x,
        y: startY + ni * nodeSpacing,
        activation: 0,
        activationTimer: 0,
      });
    }
    layers.push(nodes);
  }

  const edges: NeuralEdge[] = [];
  for (let li = 0; li < LAYER_SIZES.length - 1; li++) {
    for (let a = 0; a < LAYER_SIZES[li]; a++) {
      for (let b = 0; b < LAYER_SIZES[li + 1]; b++) {
        edges.push({
          fromLayer: li,
          fromNode: a,
          toLayer: li + 1,
          toNode: b,
          x1: layers[li][a].x,
          y1: layers[li][a].y,
          x2: layers[li + 1][b].x,
          y2: layers[li + 1][b].y,
          pulseAlpha: 0,
        });
      }
    }
  }

  return { layers, edges };
}

function acquirePulse(state: NeuralNetState): NeuralPulse | null {
  for (const p of state.pulses) {
    if (!p.active) return p;
  }
  return null;
}

function spawnPulse(state: NeuralNetState, edgeIdx: number): void {
  const p = acquirePulse(state);
  if (!p) return;
  p.edgeIdx = edgeIdx;
  p.t = 0;
  p.speed = BASE_PULSE_SPEED * (0.82 + Math.random() * 0.36);
  p.active = true;
  p.trail = [];
}

function activateNode(
  state: NeuralNetState,
  layerIdx: number,
  nodeIdx: number,
): void {
  const node = state.layers[layerIdx][nodeIdx];
  node.activation = 1;
  node.activationTimer = ACTIVATION_DURATION;
}

function fireCascadeFrom(
  state: NeuralNetState,
  layerIdx: number,
  nodeIdx: number,
): void {
  activateNode(state, layerIdx, nodeIdx);
  for (let i = 0; i < state.edges.length; i++) {
    const edge = state.edges[i];
    if (edge.fromLayer === layerIdx && edge.fromNode === nodeIdx) {
      if (Math.random() < CASCADE_EDGE_PROB) {
        spawnPulse(state, i);
      }
    }
  }
}

// ---- Public API ----

export function createNeuralNet(w: number, h: number): NeuralNetState {
  const { layers, edges } = buildLayout(w, h);

  const pulses: NeuralPulse[] = [];
  for (let i = 0; i < MAX_PULSES; i++) {
    pulses.push({ edgeIdx: 0, t: 0, speed: BASE_PULSE_SPEED, active: false, trail: [] });
  }

  return {
    w,
    h,
    time: 0,
    layers,
    edges,
    pulses,
    cascadeTimer: 0,
    nextCascadeIn: 1.2 + Math.random() * 1.5,
  };
}

function updateNodeActivations(layers: NeuralNode[][], dt: number): void {
  for (const layer of layers) {
    for (const node of layer) {
      if (node.activationTimer > 0) {
        node.activationTimer -= dt;
        node.activation = Math.max(0, node.activationTimer / ACTIVATION_DURATION);
      }
    }
  }
}

function updateEdgeGlow(edges: NeuralEdge[], dt: number): void {
  for (const edge of edges) {
    if (edge.pulseAlpha > 0) {
      edge.pulseAlpha = Math.max(0, edge.pulseAlpha - EDGE_GLOW_DECAY * dt);
    }
  }
}

function updateOnePulse(
  pulse: NeuralPulse,
  state: NeuralNetState,
  dt: number,
): void {
  pulse.t = Math.min(1, pulse.t + pulse.speed * dt);

  const edge = state.edges[pulse.edgeIdx];
  edge.pulseAlpha = Math.min(1, edge.pulseAlpha + 0.5);

  pulse.trail.push({ t: pulse.t, alpha: 0.8 });
  for (const tp of pulse.trail) {
    tp.alpha -= dt * 3.5;
  }
  // Remove dead trail points
  let ti = pulse.trail.length - 1;
  while (ti >= 0) {
    if (pulse.trail[ti].alpha <= 0.01) pulse.trail.splice(ti, 1);
    ti--;
  }

  if (pulse.t >= 1) {
    pulse.active = false;
    activateNode(state, edge.toLayer, edge.toNode);
    if (edge.toLayer < LAYER_SIZES.length - 1) {
      fireCascadeFrom(state, edge.toLayer, edge.toNode);
    }
  }
}

export function updateNeuralNet(state: NeuralNetState, dt: number): void {
  state.time += dt;

  state.cascadeTimer += dt;
  if (state.cascadeTimer >= state.nextCascadeIn) {
    state.cascadeTimer = 0;
    state.nextCascadeIn = 2 + Math.random() * 3;
    fireCascadeFrom(state, 0, Math.floor(Math.random() * LAYER_SIZES[0]));
  }

  if (Math.random() < dt * 2.5) {
    spawnPulse(state, Math.floor(Math.random() * state.edges.length));
  }

  updateNodeActivations(state.layers, dt);
  updateEdgeGlow(state.edges, dt);

  for (const pulse of state.pulses) {
    if (pulse.active) updateOnePulse(pulse, state, dt);
  }
}

function drawEdges(
  edges: NeuralEdge[],
  ctx: CanvasRenderingContext2D,
): void {
  for (const edge of edges) {
    const alpha = 0.055 + edge.pulseAlpha * 0.22;
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 204, ${alpha})`;
    ctx.lineWidth = 1;
    if (edge.pulseAlpha > 0.08) {
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#00ffcc";
    }
    ctx.beginPath();
    ctx.moveTo(edge.x1, edge.y1);
    ctx.lineTo(edge.x2, edge.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPulseTrail(
  pulse: NeuralPulse,
  edge: NeuralEdge,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.save();
  ctx.shadowBlur = 6;
  ctx.shadowColor = "#00ffcc";
  for (const tp of pulse.trail) {
    const tx = edge.x1 + (edge.x2 - edge.x1) * tp.t;
    const ty = edge.y1 + (edge.y2 - edge.y1) * tp.t;
    ctx.globalAlpha = tp.alpha * 0.3;
    ctx.fillStyle = "#00ffcc";
    ctx.beginPath();
    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNode(
  node: NeuralNode,
  nodeR: number,
  ctx: CanvasRenderingContext2D,
): void {
  ctx.save();
  if (node.activation > 0.02) {
    const a = node.activation;
    ctx.shadowBlur = 22 * a;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.9})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 28 * a;
    ctx.shadowColor = "#00ffcc";
    ctx.strokeStyle = `rgba(0, 255, 204, ${a})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeR + 4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(0, 255, 204, 0.20)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 255, 204, 0.09)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawNeuralNet(
  state: NeuralNetState,
  ctx: CanvasRenderingContext2D,
): void {
  const { w, h, layers, edges, pulses } = state;

  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, w, h);

  drawEdges(edges, ctx);

  // Pulse trails
  for (const pulse of pulses) {
    if (pulse.active || pulse.trail.length > 0) {
      drawPulseTrail(pulse, edges[pulse.edgeIdx], ctx);
    }
  }

  // Active pulse heads
  for (const pulse of pulses) {
    if (!pulse.active) continue;
    const edge = edges[pulse.edgeIdx];
    const tx = edge.x1 + (edge.x2 - edge.x1) * pulse.t;
    const ty = edge.y1 + (edge.y2 - edge.y1) * pulse.t;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#00ffcc";
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Nodes
  const NODE_R = 8;
  for (const layer of layers) {
    for (const node of layer) {
      drawNode(node, NODE_R, ctx);
    }
  }
}
