import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attentionProblems, attemptRecorder, readAttempts } from '../utils/problemAttempts.js';
import { createProblemTimer } from '../utils/problemTimer.js';

test('attention order is unfinished, slowest solved, then unmeasured; period stays scoped', () => {
  const at = '2026-09-20T12:00:00Z';
  const row = (id, durationMs) => ({ id, type: 'multiplication', at, durationMs });
  const events = [row('fast', 1000), row('unknown', undefined), row('slow', 9000)];
  const attempts = [row('open', 500), { ...row('completed-attempt', 9000), solvedEventId: 'slow' }];
  assert.deepEqual(attentionProblems(events, attempts, 'multiplication', null, Date.parse(at)).map((item) => item.id), ['open', 'slow', 'fast', 'unknown']);
  assert.equal(attentionProblems(events, attempts, 'addition', null, Date.parse(at)).length, 0);
  assert.equal(attentionProblems(events, attempts, 'multiplication', 7, Date.parse('2026-10-01')).length, 0);
});

test('opened attempts persist with elapsed time and reconcile with a solved star', () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
  let now = 0;
  const recorder = attemptRecorder('pair-0', { type: 'multiplication', label: '□ × □ = 18' }, storage);
  const timer = createProblemTimer('pair-0', storage, () => now, recorder);
  assert.equal(readAttempts(storage).length, 0);
  timer.start();
  now = 2500;
  timer.pause();
  assert.equal(readAttempts(storage)[0].durationMs, 2500);
  assert.equal(attentionProblems([], readAttempts(storage), 'multiplication')[0].unfinished, true);
  const restored = createProblemTimer('pair-0', storage, () => now, recorder);
  restored.start();
  now += 1500;
  restored.finish('solved-18');
  restored.pause(); // effect cleanup must not undo completion
  const attempt = readAttempts(storage)[0];
  assert.equal(attempt.durationMs, 4000);
  assert.equal(attempt.solvedEventId, 'solved-18');
  const rows = attentionProblems([{ id: 'solved-18', type: 'multiplication', at: attempt.at, durationMs: 4000 }], readAttempts(storage), 'multiplication');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].unfinished, false);
});
