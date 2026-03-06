import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, type EngineCallbacks } from '../src/utils/gameEngine';

const originalRaf = global.requestAnimationFrame;
const originalCancelRaf = global.cancelAnimationFrame;

global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
global.cancelAnimationFrame = (id: number) => clearTimeout(id);

test.after(() => {
  global.requestAnimationFrame = originalRaf;
  global.cancelAnimationFrame = originalCancelRaf;
});

const createCallbacks = (): EngineCallbacks => ({
  getScore: () => 0,
  getIsFeverMode: () => false,
  getIsPlaying: () => true,
  getGameOver: () => false,
  getIsSlowMo: () => false,
  getSoundEnabled: () => true,
  setFeverMode: (_active: boolean) => {},
  addScore: (_points: number) => {},
  setGameOver: (_over: boolean) => {},
  addLeaderboardScore: (_score: number) => {},
  recordHit: () => 1,
  recordMiss: () => {},
  consumeShield: () => true,
  activateShield: () => {},
  activateSlowMo: () => {},
  playFeverActivation: () => {},
  playTapSound: (_lane: number, _isFever: boolean) => {},
  playErrorSound: () => {},
  triggerHaptic: (_pattern?: number | number[]) => {},
  getReducedMotion: () => false,
  stopBgm: () => {},
});

const mockConfig = {
  laneCount: 4,
  tileHeight: 150,
  initialSpeed: 4,
  speedIncrement: 0.1,
  maxSpeed: 12,
  feverThreshold: 500,
};

const createEngine = (callbacks = createCallbacks()) =>
  new GameEngine(
    { width: 400, height: 800 } as HTMLCanvasElement,
    [] as HTMLImageElement[],
    mockConfig,
    callbacks
  );

test('GameEngine can be instantiated with default config', () => {
  const engine = createEngine();

  assert.equal((engine as any).speed, mockConfig.initialSpeed);
  assert.equal((engine as any).insects.length, 0);
  assert.equal((engine as any).powerUps.length, 0);
  assert.equal((engine as any).psyEffects.length, 0);
  assert.equal((engine as any).particles.length, 0);
  assert.equal((engine as any).isRunning, false);
});

test('GameEngine reset clears all state arrays and restores initial speed', () => {
  const engine = createEngine();

  (engine as any).insects = [{ id: 1, lane: 0, y: 100, speed: 4, spriteIndex: 0 } as any];
  (engine as any).powerUps = [{ id: 1, lane: 0, y: 50, type: 'shield' } as any];
  (engine as any).psyEffects = [{ x: 10, y: 10, life: 10, maxLife: 30, hue: 180 } as any];
  (engine as any).particles = [{ x: 20, y: 20, vx: 1, vy: -2, life: 5, maxLife: 10, color: '#fff' } as any];
  (engine as any).speed = 10;
  (engine as any).frames = 1000;
  (engine as any).hue = 180;
  (engine as any).entityIdCounter = 42;

  engine.reset();

  assert.equal((engine as any).insects.length, 0);
  assert.equal((engine as any).powerUps.length, 0);
  assert.equal((engine as any).psyEffects.length, 0);
  assert.equal((engine as any).particles.length, 0);
  assert.equal((engine as any).speed, mockConfig.initialSpeed);
  assert.equal((engine as any).frames, 0);
  assert.equal((engine as any).hue, 0);
  assert.equal((engine as any).entityIdCounter, 0);
});

test('GameEngine stop sets isRunning false and cancels animation frame', () => {
  const engine = createEngine();

  (engine as any).isRunning = true;
  (engine as any).requestRef = 123 as any;

  engine.stop();

  assert.equal((engine as any).isRunning, false);
  assert.equal((engine as any).requestRef, undefined);
});

test('GameEngine loop emits onFrame callback timestamp when provided', () => {
  let seenTimestamp = 0;
  const callbacks = {
    ...createCallbacks(),
    getIsPlaying: () => true,
    onFrame: (timestamp: number) => {
      seenTimestamp = timestamp;
    },
  };

  const engine = createEngine(callbacks);

  (engine as any).isRunning = true;
  (engine as any).draw = () => {};
  const previousRaf = global.requestAnimationFrame;
  try {
    global.requestAnimationFrame = (() => 1) as any;
    (engine as any).loop(1234);
  } finally {
    global.requestAnimationFrame = previousRaf;
  }

  assert.equal(seenTimestamp, 1234);
  assert.equal((engine as any).isRunning, true);
});

test('GameEngine loop stops when game is not active', () => {
  let frameCalls = 0;
  const callbacks = {
    ...createCallbacks(),
    getIsPlaying: () => false,
    onFrame: () => {
      frameCalls += 1;
    },
  };

  const engine = createEngine(callbacks);
  (engine as any).isRunning = true;

  (engine as any).loop(99);

  assert.equal(frameCalls, 0);
  assert.equal((engine as any).isRunning, false);
});

test('handleTap consumes tapped shield power-up and triggers feedback', () => {
  const calls: Record<string, number> = {
    activateShield: 0,
    activateSlowMo: 0,
    playTapSound: 0,
    triggerHaptic: 0,
  };

  const callbacks = {
    ...createCallbacks(),
    activateShield: () => {
      calls.activateShield += 1;
    },
    activateSlowMo: () => {
      calls.activateSlowMo += 1;
    },
    playTapSound: () => {
      calls.playTapSound += 1;
    },
    triggerHaptic: () => {
      calls.triggerHaptic += 1;
    },
  };
  const engine = createEngine(callbacks);
  (engine as any).powerUps = [{ id: 11, lane: 2, y: 220, type: 'shield' }];

  engine.handleTap(2);

  assert.equal((engine as any).powerUps.length, 0);
  assert.equal(calls.activateShield, 1);
  assert.equal(calls.activateSlowMo, 0);
  assert.equal(calls.playTapSound, 1);
  assert.equal(calls.triggerHaptic, 1);
});

test('handleTap records miss when lane has no insects', () => {
  let missCalls = 0;
  const callbacks = {
    ...createCallbacks(),
    recordMiss: () => {
      missCalls += 1;
    },
  };

  const engine = createEngine(callbacks);
  (engine as any).insects = [];

  engine.handleTap(1);

  assert.equal(missCalls, 1);
});

test('handleTap scores hit and sets insect hit animation state', () => {
  let recordedScore = 0;
  let hitCalls = 0;
  const callbacks = {
    ...createCallbacks(),
    recordHit: () => {
      hitCalls += 1;
      return 2;
    },
    addScore: (score: number) => {
      recordedScore += score;
    },
  };

  const engine = createEngine(callbacks);
  (engine as any).insects = [
    { id: 5, lane: 1, y: 300, spriteIndex: 0, speed: 4, frameIndex: 0, frameCount: 8, frameAdvanceCounter: 0, frameAdvanceRate: 5, useSpriteSheet: true, spriteRow: 0 },
  ];

  engine.handleTap(1);

  assert.equal(hitCalls, 1);
  assert.equal(recordedScore, 200);
  assert.equal((engine as any).insects[0].isHit, true);
  assert.equal((engine as any).insects[0].hitScale, 1.3);
  assert.equal((engine as any).scorePopups.length, 1);
});
