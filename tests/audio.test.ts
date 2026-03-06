import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine, audio as audioSingleton } from '../src/utils/audio';

const originalWindow = (globalThis as { window?: unknown }).window;

type ParamStub = {
  value: number;
  setValueAtTime: (value: number, _time: number) => void;
  exponentialRampToValueAtTime: (value: number, _time: number) => void;
};

const createParam = (initial = 0): ParamStub => ({
  value: initial,
  setValueAtTime(value: number) {
    this.value = value;
  },
  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  },
});

const createMockAudioContext = () => {
  const destination = {};
  const gainNode = {
    gain: createParam(0.5),
    connect: () => destination,
  };

  const ctx = {
    sampleRate: 44100,
    destination,
    currentTime: 10,
    state: 'running' as 'running' | 'suspended',
    resumed: false,
    createGain: () => ({ gain: createParam(1), connect: () => destination }),
    createBuffer: (_channels: number, bufferSize: number) => ({
      getChannelData: () => new Float32Array(bufferSize),
    }),
    createOscillator: () => ({
      type: 'sine',
      frequency: createParam(0),
      connect: () => destination,
      start: () => undefined,
      stop: () => undefined,
    }),
    createBiquadFilter: () => ({
      type: 'lowpass',
      frequency: createParam(0),
      Q: createParam(0),
      connect: () => destination,
    }),
    createBufferSource: () => ({
      buffer: null as unknown,
      connect: () => destination,
      start: () => undefined,
      stop: () => undefined,
    }),
    resume: () => {
      ctx.resumed = true;
      ctx.state = 'running';
    },
  };

  return { ctx, gainNode };
};

test.afterEach(() => {
  (globalThis as { window?: unknown }).window = originalWindow;
});

test('AudioEngine can be instantiated with default properties', () => {
  const audio = new AudioEngine();
  assert.equal(audio.bpm, 128);
  assert.equal(audio.isPlaying, false);
  assert.equal(audio.ctx, null);
  assert.equal(audio.masterGain, null);
  assert.ok(Array.isArray(audio.notes));
  assert.equal(audio.notes.length, 6);
});

test('AudioEngine singleton instance exists', () => {
  assert.ok(audioSingleton instanceof AudioEngine);
});

test('init is a no-op when AudioContext is unavailable', () => {
  (globalThis as { window: unknown }).window = {};
  const audio = new AudioEngine();
  audio.init();
  assert.equal(audio.ctx, null);
  assert.equal(audio.masterGain, null);
});

test('init sets up context and noise buffer when AudioContext exists', () => {
  const { ctx } = createMockAudioContext();
  (globalThis as { window: unknown }).window = {
    AudioContext: function MockAudioContext() {
      return ctx;
    },
  };

  const audio = new AudioEngine();
  audio.init();

  assert.equal(audio.ctx, ctx as unknown as AudioContext);
  assert.ok(audio.masterGain);
  assert.ok(audio.noiseBuffer);
});

test('setMuted updates gain value when masterGain exists', () => {
  const audio = new AudioEngine();
  audio.masterGain = { gain: createParam(0.5) } as unknown as GainNode;

  audio.setMuted(true);
  assert.equal(audio.muted, true);
  assert.equal(audio.masterGain.gain.value, 0);

  audio.setMuted(false);
  assert.equal(audio.masterGain.gain.value, 0.5);
});

test('nextNote advances 16th note and timestamp', () => {
  const audio = new AudioEngine();
  audio.nextNoteTime = 0;
  audio.current16thNote = 15;

  audio.nextNote();

  assert.equal(audio.current16thNote, 0);
  assert.ok(audio.nextNoteTime > 0);
});

test('playBgm resumes suspended context and starts scheduler once', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  ctx.state = 'suspended';
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5) } as unknown as GainNode;

  let scheduled = 0;
  audio.scheduler = () => {
    scheduled += 1;
  };

  audio.playBgm();
  assert.equal(audio.isPlaying, true);
  assert.equal(ctx.resumed, true);
  assert.equal(scheduled, 1);

  audio.playBgm();
  assert.equal(scheduled, 1);
});

test('stopBgm clears timer and flips playback flag', () => {
  const audio = new AudioEngine();
  audio.isPlaying = true;

  let clearedId = -1;
  (globalThis as { window: unknown }).window = {
    clearTimeout: (id: number) => {
      clearedId = id;
    },
  };

  audio.timerID = 42;
  audio.stopBgm();
  assert.equal(audio.isPlaying, false);
  assert.equal(audio.timerID, null);
  assert.equal(clearedId, 42);
});

test('playTapSound increments note index and respects lane clamping', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5), connect: () => undefined } as unknown as GainNode;

  audio.playTapSound(99, false);
  assert.equal(audio.noteIndex, 1);

  const indexBeforeMuted = audio.noteIndex;
  audio.setMuted(true);
  audio.playTapSound(0, false);
  assert.equal(audio.noteIndex, indexBeforeMuted);
});
