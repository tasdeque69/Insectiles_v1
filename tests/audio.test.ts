import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine, audio as audioSingleton } from '../src/utils/audio';

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
