import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore } from '../utils/practiceStorage.js';
import { attemptRecorder, readAttempts } from '../utils/problemAttempts.js';
import { createProblemTimer } from '../utils/problemTimer.js';
import { readProgress, writeProgress } from '../utils/progressStorage.js';

const event = { id: 'answer', type: 'multiplication', problem: { operands: [2, 3], answer: 6 }, at: new Date().toISOString() };
const description = { type: 'multiplication', label: '2 × 3' };

test('reset clears every skill and attempts, persists, notifies, and preserves unrelated saves', () => {
  const values = new Map();
  const disk = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const store = createPracticeStore(disk);
  store.award(event);
  store.award({ ...event, id: 'sum', type: 'addition', problem: { operands: [2, 3], answer: 5 } });
  store.award({ ...event, id: 'difference', type: 'subtraction', problem: { operands: [3, 2], answer: 1 } });
  attemptRecorder('solved', description, disk).finish(2000, event.id);
  attemptRecorder('unfinished', description, disk).open(1000);
  for (const key of ['family-profile', 'factor-and-add', 'diffy-squares']) writeProgress(key, { keep: key }, disk);
  let notified = 0;
  const unsubscribe = store.subscribe(() => { notified++; assert.deepEqual(readAttempts(disk), []); });
  assert.equal(store.reset(), true);
  assert.equal(notified, 1);
  unsubscribe();
  assert.deepEqual(store.getSnapshot().events, []);
  assert.deepEqual(createPracticeStore(disk).getSnapshot().events, []);
  assert.deepEqual(readAttempts(disk), []);
  for (const key of ['family-profile', 'factor-and-add', 'diffy-squares']) assert.deepEqual(readProgress(key, (value) => value, disk), { keep: key });
  assert.equal(store.award({ ...event, id: 'new-answer' }), true);
  assert.equal(store.getSnapshot().events.length, 1);
});

test('reset invalidates saved and mounted timers without resurrecting old attempts', () => {
  const values = new Map();
  const disk = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  let now = 0;
  const timer = createProblemTimer('problem', disk, () => now, attemptRecorder('problem', description, disk));
  timer.start();
  now = 5000;
  timer.checkpoint();
  createPracticeStore(disk).reset();
  timer.pause();
  assert.deepEqual(readAttempts(disk), []);
  assert.equal(createProblemTimer('problem', disk, () => now).finish(), 0);
  timer.start();
  now += 1000;
  assert.equal(timer.finish('new-answer'), 1000);
  assert.equal(readAttempts(disk)[0].durationMs, 1000);
});

test('reset still clears session data when persistent storage rejects writes', () => {
  const disk = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const store = createPracticeStore(disk);
  store.award(event);
  attemptRecorder('problem', description, disk).open(1000);
  assert.equal(store.reset(), false);
  assert.deepEqual(createPracticeStore(disk).getSnapshot().events, []);
  assert.deepEqual(readAttempts(disk), []);
});
