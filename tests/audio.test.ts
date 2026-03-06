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

test('init falls back to webkitAudioContext when AudioContext is unavailable', () => {
  const { ctx } = createMockAudioContext();
  (globalThis as { window: unknown }).window = {
    webkitAudioContext: function MockWebkitAudioContext() {
      return ctx;
    },
  };

  const audio = new AudioEngine();
  audio.init();

  assert.equal(audio.ctx, ctx as unknown as AudioContext);
  assert.ok(audio.masterGain);
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


test('nextNote increments absolute note counter across wraparound', () => {
  const audio = new AudioEngine();
  audio.current16thNote = 15;
  audio.total16thNotes = 31;

  audio.nextNote();

  assert.equal(audio.current16thNote, 0);
  assert.equal(audio.total16thNotes, 32);
});

test('playBgm resets counters before scheduling', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5) } as unknown as GainNode;
  audio.current16thNote = 9;
  audio.total16thNotes = 99;

  audio.scheduler = () => undefined;
  audio.playBgm();

  assert.equal(audio.current16thNote, 0);
  assert.equal(audio.total16thNotes, 0);
});

test('scheduleNote uses absolute bar counter for arrangement progression', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5), connect: () => undefined } as unknown as GainNode;

  let arpCalls = 0;
  let lastBar = -1;
  audio.playArp = (_time: number, _beat: number, bar: number) => {
    arpCalls += 1;
    lastBar = bar;
  };
  audio.playAcid = () => undefined;
  audio.playKick = () => undefined;
  audio.playBass = () => undefined;
  audio.playSnare = () => undefined;
  audio.playHat = () => undefined;

  const random = Math.random;
  Math.random = () => 0;
  try {
    audio.total16thNotes = 16 * 24; // section 3
    audio.scheduleNote(0, 0);
  } finally {
    Math.random = random;
  }

  assert.equal(arpCalls, 1);
  assert.equal(lastBar, 24);
});

test('scheduler is a no-op without audio context', () => {
  const audio = new AudioEngine();
  audio.scheduler();
  assert.equal(audio.timerID, null);
});

test('scheduler schedules notes until lookahead horizon and stores timer id', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  ctx.currentTime = 2;
  audio.ctx = ctx as unknown as AudioContext;
  audio.nextNoteTime = 0;
  audio.scheduleAheadTime = 0.1;
  audio.lookahead = 33;

  let scheduled = 0;
  let timeoutDelay = 0;
  (globalThis as { window: unknown }).window = {
    setTimeout: (cb: () => void, delay: number) => {
      timeoutDelay = delay;
      void cb;
      return 321;
    },
  };

  audio.scheduleNote = () => {
    scheduled += 1;
  };

  audio.scheduler();

  assert.ok(scheduled > 0);
  assert.equal(audio.timerID, 321);
  assert.equal(timeoutDelay, 33);
});



test('stopBgm uses global clearTimeout fallback when window is unavailable', () => {
  const audio = new AudioEngine();
  audio.isPlaying = true;

  const originalClearTimeout = globalThis.clearTimeout;
  let cleared = false;
  globalThis.clearTimeout = ((id: number) => {
    cleared = id === 99;
  }) as unknown as typeof globalThis.clearTimeout;

  (globalThis as { window?: unknown }).window = undefined;
  audio.timerID = 99;
  audio.stopBgm();

  globalThis.clearTimeout = originalClearTimeout;
  assert.equal(cleared, true);
  assert.equal(audio.timerID, null);
});

test('scheduler uses global setTimeout fallback when window is unavailable', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  ctx.currentTime = 5;
  audio.ctx = ctx as unknown as AudioContext;
  audio.nextNoteTime = 4.95;
  audio.scheduleAheadTime = 0.1;

  const originalSetTimeout = globalThis.setTimeout;
  let usedFallback = false;
  globalThis.setTimeout = ((cb: () => void, _delay?: number) => {
    usedFallback = true;
    void cb;
    return 777;
  }) as unknown as typeof globalThis.setTimeout;

  (globalThis as { window?: unknown }).window = undefined;
  audio.scheduleNote = () => undefined;

  audio.scheduler();

  globalThis.setTimeout = originalSetTimeout;
  assert.equal(usedFallback, true);
  assert.equal(audio.timerID, 777);
});

test('playBgm does not start when muted', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5) } as unknown as GainNode;
  audio.muted = true;

  let schedulerCalls = 0;
  audio.scheduler = () => {
    schedulerCalls += 1;
  };

  audio.playBgm();

  assert.equal(audio.isPlaying, false);
  assert.equal(schedulerCalls, 0);
});

test('playTapSound in fever mode keeps noteIndex stable', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5), connect: () => undefined } as unknown as GainNode;
  audio.noteIndex = 5;

  audio.playTapSound(2, true);

  assert.equal(audio.noteIndex, 5);
});

test('playErrorSound returns early when muted', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5), connect: () => undefined } as unknown as GainNode;
  audio.muted = true;

  audio.playErrorSound();
  assert.equal(audio.muted, true);
});

test('scheduleNote section 0 triggers kick, bass, hat, and acid from beat/random', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5), connect: () => undefined } as unknown as GainNode;
  audio.total16thNotes = 0;

  let kick = 0;
  let bass = 0;
  let hat = 0;
  let acid = 0;
  audio.playKick = () => { kick += 1; };
  audio.playBass = () => { bass += 1; };
  audio.playHat = () => { hat += 1; };
  audio.playAcid = () => { acid += 1; };
  audio.playSnare = () => undefined;
  audio.playArp = () => undefined;

  const random = Math.random;
  Math.random = () => 0.95;
  try {
    audio.scheduleNote(2, 0);
  } finally {
    Math.random = random;
  }

  assert.equal(kick, 0);
  assert.equal(bass, 1);
  assert.equal(hat, 1);
  assert.equal(acid, 1);
});

test('scheduleNote section 3 triggers snare only on final bar and quarter beat', () => {
  const audio = new AudioEngine();
  const { ctx } = createMockAudioContext();
  audio.ctx = ctx as unknown as AudioContext;
  audio.masterGain = { gain: createParam(0.5), connect: () => undefined } as unknown as GainNode;

  let snare = 0;
  let arp = 0;
  audio.playSnare = () => { snare += 1; };
  audio.playArp = () => { arp += 1; };
  audio.playAcid = () => undefined;
  audio.playKick = () => undefined;
  audio.playBass = () => undefined;
  audio.playHat = () => undefined;

  audio.total16thNotes = 16 * 31; // section=3, barOfSection=7
  const random = Math.random;
  Math.random = () => 0;
  try {
    audio.scheduleNote(4, 0);
  } finally {
    Math.random = random;
  }

  assert.equal(arp, 1);
  assert.equal(snare, 1);
});
