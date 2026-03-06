import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/utils/gameEngine';

// Mock requestAnimationFrame and cancelAnimationFrame globally for these tests
global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
global.cancelAnimationFrame = (id: number) => clearTimeout(id);

const mockCallbacks = {
  getScore: () => 0,
  getIsFeverMode: () => false,
  getIsPlaying: () => true,
  getGameOver: () => false,
  getIsSlowMo: () => false,
  getSoundEnabled: () => true,
  setFeverMode: () => {},
  addScore: () => {},
  setGameOver: () => {},
  addLeaderboardScore: () => {},
  recordHit: () => 1,
  recordMiss: () => {},
  consumeShield: () => true,
  activateShield: () => {},
  activateSlowMo: () => {},
  playFeverActivation: () => {},
  playTapSound: () => {},
  playErrorSound: () => {},
  stopBgm: () => {},
};

const mockConfig = {
  laneCount: 4,
  tileHeight: 150,
  initialSpeed: 4,
  speedIncrement: 0.1,
  maxSpeed: 12,
  feverThreshold: 500,
};

test('GameEngine can be instantiated with default config', () => {
  const engine = new GameEngine(
    {} as HTMLCanvasElement,
    [] as HTMLImageElement[],
    mockConfig,
    mockCallbacks
  );

  assert.equal((engine as any)['speed'], mockConfig.initialSpeed);
  assert.equal((engine as any)['insects'].length, 0);
  assert.equal((engine as any)['powerUps'].length, 0);
  assert.equal((engine as any)['psyEffects'].length, 0);
  assert.equal((engine as any)['particles'].length, 0);
  assert.equal((engine as any)['isRunning'], false);
});

test('GameEngine reset clears all state arrays and restores initial speed', () => {
  const engine = new GameEngine(
    {} as HTMLCanvasElement,
    [] as HTMLImageElement[],
    mockConfig,
    mockCallbacks
  );

  // Modify internal state
  (engine as any)['insects'] = [{ id: 1, lane: 0, y: 100, speed: 4, spriteIndex: 0 } as any];
  (engine as any)['powerUps'] = [{ id: 1, lane: 0, y: 50, type: 'shield' } as any];
  (engine as any)['psyEffects'] = [{ x: 10, y: 10, life: 10, maxLife: 30, hue: 180 } as any];
  (engine as any)['particles'] = [{ x: 20, y: 20, vx: 1, vy: -2, life: 5, maxLife: 10, color: '#fff' } as any];
  (engine as any)['speed'] = 10;
  (engine as any)['frames'] = 1000;
  (engine as any)['hue'] = 180;
  (engine as any)['entityIdCounter'] = 42;

  engine.reset();

  assert.equal((engine as any)['insects'].length, 0);
  assert.equal((engine as any)['powerUps'].length, 0);
  assert.equal((engine as any)['psyEffects'].length, 0);
  assert.equal((engine as any)['particles'].length, 0);
  assert.equal((engine as any)['speed'], mockConfig.initialSpeed);
  assert.equal((engine as any)['frames'], 0);
  assert.equal((engine as any)['hue'], 0);
  assert.equal((engine as any)['entityIdCounter'], 0);
});

test('GameEngine stop sets isRunning false and cancels animation frame', () => {
  const engine = new GameEngine(
    {} as HTMLCanvasElement,
    [] as HTMLImageElement[],
    mockConfig,
    mockCallbacks
  );

  (engine as any)['isRunning'] = true;
  (engine as any)['requestRef'] = 123 as any;

  engine.stop();

  assert.equal((engine as any)['isRunning'], false);
  assert.equal((engine as any)['requestRef'], undefined);
});


test('GameEngine.reset clears state and restores initial speed', () => {
  const engine = new GameEngine(
    {} as HTMLCanvasElement,
    [] as HTMLImageElement[],
    mockConfig,
    mockCallbacks
  );

  // Modify internal state
  (engine as any)['insects'] = [{ id: 1, lane: 0, y: 100, speed: 4, spriteIndex: 0 } as any];
  (engine as any)['psyEffects'] = [{ x: 10, y: 10, life: 10, maxLife: 30, hue: 180 } as any];
  (engine as any)['speed'] = 10;
  (engine as any)['frames'] = 1000;
  (engine as any)['hue'] = 180;

  engine.reset();

  assert.equal((engine as any)['insects'].length, 0);
  assert.equal((engine as any)['psyEffects'].length, 0);
  assert.equal((engine as any)['speed'], mockConfig.initialSpeed);
  assert.equal((engine as any)['frames'], 0);
  assert.equal((engine as any)['hue'], 0);
});

test('GameEngine.stop sets isRunning false and cancels animation frame', () => {
  const engine = new GameEngine(
    {} as HTMLCanvasElement,
    [] as HTMLImageElement[],
    mockConfig,
    mockCallbacks
  );

  (engine as any)['isRunning'] = true;
  (engine as any)['requestRef'] = 123 as any;

  engine.stop();

  assert.equal((engine as any)['isRunning'], false);
  assert.equal((engine as any)['requestRef'], undefined);
});
