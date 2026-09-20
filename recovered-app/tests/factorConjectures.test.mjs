import test from 'node:test';
import assert from 'node:assert/strict';
import { conjectureFromExample, conjectureEdgeKey, groupConjectureConnections, conjectureEvidence, conjectureText, emptyNoticing, numberChange, numberParity, validateNoticing } from '../game/factorConjectures.js';
import { emptyFactorProgress, validateFactorProgress } from '../game/factorProgress.js';

test('observations cover increase, decrease, equality and both parities', () => {
  assert.equal(numberChange({ from: 20, to: 22 }), 'bigger');
  assert.equal(numberChange({ from: 4, to: 3 }), 'smaller');
  assert.equal(numberChange({ from: 6, to: 6 }), 'same');
  assert.equal(numberParity(1), 'odd');
  assert.equal(numberParity(22), 'even');
  assert.equal(conjectureText(conjectureFromExample('size', { from: 6, to: 6 })), 'The number always stays the same.');
});

test('a later result can support a size guess or supply a counterexample', () => {
  const seed = { from: 4, to: 3 };
  const guess = conjectureFromExample('size', seed);
  assert.deepEqual(conjectureEvidence(guess, [seed, { from: 3, to: 1 }]), { checked: 2, supported: 2, counterexample: null });
  assert.deepEqual(conjectureEvidence(guess, [seed, { from: 6, to: 6 }]), { checked: 2, supported: 1, counterexample: { from: 6, to: 6 } });
});

test('parity conjectures consider only matching starting parity', () => {
  const seed = { from: 3, to: 1 };
  const guess = conjectureFromExample('parity', seed);
  assert.deepEqual(conjectureEvidence(guess, [seed, { from: 6, to: 6 }]), { checked: 1, supported: 1, counterexample: null });
  assert.deepEqual(conjectureEvidence(guess, [seed, { from: 9, to: 4 }]), { checked: 2, supported: 1, counterexample: { from: 9, to: 4 } });
});

test('unfinished noticing and both conjectures survive progress restoration', () => {
  const edge = { from: 20, to: 22 };
  const base = { ...emptyFactorProgress(), connections: [edge], latest: edge };
  const draft = { ...emptyNoticing(), sizeChoice: 'smaller' };
  assert.deepEqual(validateFactorProgress({ ...base, noticing: draft }).noticing, draft);
  const completed = { ...emptyNoticing(), stage: 'done', sizeChoice: 'bigger', fromParity: 'even', toParity: 'even', conjectures: [conjectureFromExample('size', edge), conjectureFromExample('parity', edge)] };
  assert.deepEqual(validateFactorProgress(JSON.parse(JSON.stringify({ ...base, noticing: completed }))).noticing, completed);
  assert.equal(validateFactorProgress(base).noticing, undefined);
  assert.equal(validateNoticing(completed, []), null);
  assert.equal(validateNoticing({ ...completed, conjectures: [{ kind: 'size', change: 'smaller' }] }, [edge]), null);
  assert.equal(validateFactorProgress({ ...base, noticing: { stage: 'bad' } }).connections.length, 1);
});

test('older attributed conjectures restore without an author', () => {
  const edge = { from: 10, to: 8 };
  const guess = conjectureFromExample('size', edge);
  const value = { ...emptyNoticing(), stage: 'sizeConjecture', conjectures: [{ ...guess, author: 'alice' }] };
  assert.deepEqual(validateNoticing(value, [edge]).conjectures, [guess]);
  assert.equal(guess.author, undefined);
});

test('all four screens of each observation survive reload', () => {
  const edge = { from: 10, to: 8 };
  assert.equal(emptyNoticing().stage, 'sizeIntro');
  for (const stage of ['sizeIntro', 'size', 'sizeBet', 'sizeConjecture', 'parityIntro', 'parity', 'parityBet', 'parityConjecture']) {
    const conjectures = [];
    if (stage === 'sizeConjecture' || stage.startsWith('parity')) conjectures.push(conjectureFromExample('size', edge));
    if (stage === 'parityConjecture') conjectures.push(conjectureFromExample('parity', edge));
    const value = { ...emptyNoticing(), stage, sizeChoice: 'smaller', fromParity: 'even', toParity: 'even', conjectures };
    assert.deepEqual(validateNoticing(JSON.parse(JSON.stringify(value)), [edge]), value);
  }
  assert.equal(validateNoticing({ ...emptyNoticing(), stage: 'parityIntro' }, [edge]), null);
});

test('all graph results start unsorted and only learner classifications move them', () => {
  const edges = [{ from: 10, to: 8 }, { from: 6, to: 6 }, { from: 9, to: 4 }];
  const guess = conjectureFromExample('parity', edges[0]);
  assert.deepEqual(groupConjectureConnections(guess, edges), { examples: [], counterexamples: [], unsorted: edges });
  const sorted = { ...guess, classifications: { [conjectureEdgeKey(edges[0])]: 'examples', [conjectureEdgeKey(edges[1])]: 'counterexamples' } };
  assert.deepEqual(groupConjectureConnections(sorted, edges), { examples: [edges[0]], counterexamples: [edges[1]], unsorted: [edges[2]] });
  assert.equal(groupConjectureConnections(guess, edges).unsorted.length, 3);
  delete sorted.classifications[conjectureEdgeKey(edges[0])];
  assert.deepEqual(groupConjectureConnections(sorted, edges).unsorted, [edges[0], edges[2]]);
});

test('learner sorting survives reload and ignores stale or invalid classifications', () => {
  const edge = { from: 10, to: 8 };
  const guess = { ...conjectureFromExample('size', edge), classifications: { '10:8': 'counterexamples', '6:6': 'examples', garbage: 'bad' } };
  const value = { ...emptyNoticing(), stage: 'done', conjectures: [guess] };
  const restored = validateNoticing(JSON.parse(JSON.stringify(value)), [edge]);
  assert.deepEqual(restored.conjectures[0].classifications, { '10:8': 'counterexamples' });
});
