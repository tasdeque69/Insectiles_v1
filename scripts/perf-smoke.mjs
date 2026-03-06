import { performance } from 'node:perf_hooks';
import { moveInsects, updateScreenShake, advancePsyEffects } from '../src/utils/loop.ts';

const SAMPLE_SIZE = 1200;
const FRAMES = 600;

const insects = Array.from({ length: SAMPLE_SIZE }, (_, i) => ({
  id: i,
  lane: i % 4,
  y: (i % 40) * 12,
  speed: 4 + (i % 5),
  spriteIndex: 0,
}));

let state = insects;
let shake = 0;
let effects = [{ x: 20, y: 20, life: 0, maxLife: 30, hue: 120 }];

const start = performance.now();
for (let frame = 0; frame < FRAMES; frame++) {
  const result = moveInsects(state, 1080, false, 150, 1);
  state = result.insects;
  shake = updateScreenShake(shake, frame % 120 < 30, frame);
  effects = advancePsyEffects(effects);
  if (frame % 20 === 0) {
    effects.push({ x: 40 + frame, y: 24, life: 0, maxLife: 30, hue: (frame * 7) % 360 });
  }
}
const elapsed = performance.now() - start;
const avgFrameMs = elapsed / FRAMES;
const fpsEquivalent = 1000 / avgFrameMs;

console.log(`[perf-smoke] elapsed=${elapsed.toFixed(2)}ms frames=${FRAMES} avg=${avgFrameMs.toFixed(3)}ms fps~${fpsEquivalent.toFixed(1)}`);

if (avgFrameMs > 16.67) {
  console.error('[perf-smoke] FAIL: average frame budget exceeded 16.67ms target');
  process.exit(1);
}

console.log('[perf-smoke] PASS: average frame budget within 60 FPS target');
