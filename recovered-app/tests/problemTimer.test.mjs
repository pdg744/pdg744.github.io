import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProblemTimer } from '../utils/problemTimer.js';
import { createPracticeStore } from '../utils/practiceStorage.js';

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
}

test('problem time excludes pauses and survives reload without counting time away', () => {
  const disk = storage();
  let now = 0;
  const timer = createProblemTimer('example', disk, () => now);
  timer.start();
  now = 2400;
  timer.pause();
  now = 100000;
  timer.start();
  now += 1600;
  timer.checkpoint();
  const restored = createProblemTimer('example', disk, () => now);
  now += 90000;
  restored.start();
  now += 2000;
  assert.equal(restored.finish(), 6000);
  now += 5000;
  assert.equal(restored.finish(), 6000);
  assert.equal(createProblemTimer('next-example', disk, () => now).finish(), 0);
});

test('history preserves legacy answers and timed answers across reload', () => {
  const disk = storage();
  const store = createPracticeStore(disk);
  const event = { id: 'old', type: 'multiplication', problem: { operands: [3, 4], answer: 12 }, at: new Date().toISOString() };
  assert.equal(store.award(event), true);
  assert.equal(store.award({ ...event, id: 'new', durationMs: 5400 }), true);
  assert.equal(store.award({ ...event, id: 'bad', durationMs: -1 }), false);
  assert.equal(store.award({ ...event, id: 'nan', durationMs: NaN }), false);
  assert.equal(store.award({ ...event, id: 'new', durationMs: 9000 }), false);
  const events = createPracticeStore(disk).getSnapshot().events;
  assert.equal(events[0].durationMs, undefined);
  assert.equal(events[1].durationMs, 5400);
});
