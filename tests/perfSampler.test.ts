import test from 'node:test';
import assert from 'node:assert/strict';
import { PerfSampler } from '../src/utils/perfSampler';

test('PerfSampler starts at baseline and accumulates samples', () => {
  const sampler = new PerfSampler();
  const initial = sampler.sample(1000);
  assert.equal(initial.samples, 0);

  sampler.sample(1016.67);
  sampler.sample(1033.34);
  const snapshot = sampler.getSnapshot();

  assert.equal(snapshot.samples, 2);
  assert.equal(snapshot.droppedFrames, 0);
  assert.ok(snapshot.fps > 50);
});

test('PerfSampler counts dropped frames when frame time spikes', () => {
  const sampler = new PerfSampler();
  sampler.sample(100);
  sampler.sample(130);
  sampler.sample(170);

  const snapshot = sampler.getSnapshot();
  assert.equal(snapshot.droppedFrames, 2);
  assert.equal(snapshot.samples, 2);
});

test('PerfSampler reset clears counters', () => {
  const sampler = new PerfSampler();
  sampler.sample(100);
  sampler.sample(140);
  sampler.reset();

  const snapshot = sampler.getSnapshot();
  assert.equal(snapshot.samples, 0);
  assert.equal(snapshot.droppedFrames, 0);
});
