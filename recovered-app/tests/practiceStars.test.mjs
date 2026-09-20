import test from 'node:test';
import assert from 'node:assert/strict';
import { createPracticeStore } from '../utils/practiceStorage.js';
import { practiceTotals, validatePracticeHistory } from '../game/practiceStars.js';
import { emptyFactorProgress, validateFactorProgress } from '../game/factorProgress.js';
import { validateDiffyProgress } from '../game/diffyProgress.js';
import { writeProgress } from '../utils/progressStorage.js';

const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const star = (id, type = 'multiplication', operands = [2, 3], answer = 6, at = '2026-09-20T12:00:00.000Z') => ({ id, type, problem: { operands, answer }, at });

test('each submitted answer earns one star across duplicate callbacks and reloads', () => {
  const disk = storage();
  const store = createPracticeStore(disk);
  assert.equal(store.award(star('game-1:factor:6:2x3')), true);
  assert.equal(store.award(star('game-1:factor:6:2x3')), false);
  const reloaded = createPracticeStore(disk);
  assert.equal(reloaded.award(star('game-1:factor:6:2x3')), false);
  assert.equal(reloaded.award(star('game-2:factor:6:2x3')), true);
  assert.equal(reloaded.getSnapshot().events.length, 2);
});

test('game resets cannot clear the separate practice history', () => {
  const disk = storage();
  const store = createPracticeStore(disk);
  store.award(star('game-1:factor:6:2x3'));
  writeProgress('factor-and-add', emptyFactorProgress(), disk);
  writeProgress('diffy-squares', { phase: 'input' }, disk);
  assert.equal(createPracticeStore(disk).getSnapshot().events.length, 1);
});

test('only mathematically correct answers enter the history, not automatic one-addend sums', () => {
  const store = createPracticeStore(storage());
  assert.equal(store.award(star('wrong-product', 'multiplication', [2, 4], 6)), false);
  assert.equal(store.award(star('wrong-sum', 'addition', [1, 2, 3], 7)), false);
  assert.equal(store.award(star('automatic-prime', 'addition', [1], 1)), false);
  assert.equal(store.award(star('wrong-difference', 'subtraction', [9, 4], 6)), false);
  assert.equal(store.award(star('sum', 'addition', [1, 2, 3], 6)), true);
  assert.equal(store.award(star('difference', 'subtraction', [9, 4], 5)), true);
  assert.equal(store.award(star('zero-difference', 'subtraction', [4, 4], 0)), true);
});

test('totals separate skills and include only the requested time window', () => {
  const events = [
    star('old', 'multiplication', [2, 3], 6, '2026-09-01T12:00:00Z'),
    star('recent'),
    star('sum', 'addition', [1, 2], 3),
    star('difference', 'subtraction', [5, 3], 2),
    star('boundary', 'subtraction', [3, 3], 0, '2026-09-13T12:00:00Z'),
  ];
  const now = Date.parse('2026-09-20T12:00:00Z');
  assert.deepEqual(practiceTotals(events, null, now), { multiplication: 2, addition: 1, subtraction: 2 });
  assert.deepEqual(practiceTotals(events, 7, now), { multiplication: 1, addition: 1, subtraction: 2 });
  const history = validatePracticeHistory({ events: [...events, events[0], { id: 'corrupt' }] });
  assert.equal(history.events.length, events.length);
  assert.deepEqual(history.events[0].problem, { operands: [2, 3], answer: 6 });
});

test('both game validators retain award identity and remain compatible with older saves', () => {
  const factor = { ...emptyFactorProgress(), practiceRunId: 'stable-game-id' };
  assert.equal(validateFactorProgress(factor).practiceRunId, 'stable-game-id');
  assert.equal(validateFactorProgress(emptyFactorProgress()).practiceRunId, undefined);
  const diffy = { phase: 'playing', cornerInputs: ['1', '3', '6', '10'], initialCorners: [1, 3, 6, 10], currentGenIndex: 0, userAnswers: ['2', '', '', ''], practiceRunId: 'stable-diffy-id' };
  assert.equal(validateDiffyProgress(diffy).practiceRunId, 'stable-diffy-id');
  delete diffy.practiceRunId;
  assert.ok(validateDiffyProgress(diffy));
});

test('blocked storage still allows play and retains stars during the session', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const store = createPracticeStore(blocked);
  assert.equal(store.award(star('blocked-session')), true);
  assert.equal(store.award(star('blocked-session')), false);
  assert.equal(createPracticeStore(blocked).getSnapshot().events.at(-1).id, 'blocked-session');
});
