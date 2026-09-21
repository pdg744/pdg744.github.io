import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyNoticingExample, classifyExample, continueConjectureQuestions, isConjectureDisproved, classifySizeExample, noticeNextExample, conjectureFromExample, conjectureEdgeKey, groupConjectureConnections, conjectureEvidence, conjectureText, emptyNoticing, numberChange, numberParity, validateNoticing } from '../game/factorConjectures.js';
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
  const guess = { ...conjectureFromExample('size', edge), classifications: { '10:8': 'examples', '6:6': 'examples', garbage: 'bad' } };
  const value = { ...emptyNoticing(), stage: 'done', conjectures: [guess] };
  const restored = validateNoticing(JSON.parse(JSON.stringify(value)), [edge]);
  assert.deepEqual(restored.conjectures[0].classifications, { '10:8': 'examples' });
});

test('the first challenge waits for another completed example before offering parity', () => {
  const seed = { from: 2, to: 1 };
  const next = { from: 6, to: 6 };
  const waiting = { ...emptyNoticing(), stage: 'awaitingExample', sizeChoice: 'smaller', conjectures: [conjectureFromExample('size', seed)] };
  assert.deepEqual(validateNoticing(waiting, [seed]), waiting);
  const prompt = noticeNextExample(waiting, next);
  assert.equal(prompt.stage, 'classify');
  assert.deepEqual(validateNoticing(prompt, [seed, next]), prompt);
  assert.equal(classifyNoticingExample(prompt, 'examples'), prompt);
  const classified = classifyNoticingExample(prompt, 'counterexamples');
  assert.equal(classified.stage, 'classified');
  assert.equal(classified.conjectures[0].classifications['6:6'], 'counterexamples');
  assert.deepEqual(validateNoticing(classified, [seed, next]), classified);
  assert.equal(noticeNextExample(classified, { from: 3, to: 1 }), classified);
  assert.equal(validateNoticing(prompt, [seed]), null);
  assert.equal(noticeNextExample(null, next), null);
});

test('supporting examples and equality are classified against the actual conjecture', () => {
  const edge = { from: 6, to: 6 };
  const guess = conjectureFromExample('size', edge);
  assert.equal(classifySizeExample(guess, { from: 28, to: 28 }), 'examples');
  assert.equal(classifySizeExample(guess, { from: 12, to: 16 }), 'counterexamples');
  const value = { ...emptyNoticing(), stage: 'classify', targetEdge: edge, conjectures: [guess] };
  const next = classifyNoticingExample(value, 'examples');
  assert.equal(next.conjectures[0].classifications['6:6'], 'examples');
  assert.equal(value.conjectures[0].classifications, undefined);
});

test('ongoing questions review one conjecture at a time and persist the active kind', () => {
  const seed = { from: 2, to: 1 }, edge = { from: 4, to: 3 };
  const guesses = ['size', 'parity'].map((kind) => ({ ...conjectureFromExample(kind, seed), classifications: { '2:1': 'examples' } }));
  const start = { ...emptyNoticing(), stage: 'done', conjectures: guesses };
  const first = noticeNextExample(start, edge, [seed, edge]);
  assert.equal(first.targetKind, 'size');
  const answered = classifyNoticingExample(first, 'examples');
  const second = continueConjectureQuestions(answered, [seed, edge]);
  assert.equal(second.targetKind, 'parity');
  assert.equal(second.stage, 'classify');
  assert.deepEqual(validateNoticing(second, [seed, edge]), second);
  assert.equal(classifyNoticingExample(second, 'counterexamples'), second);
  const finished = continueConjectureQuestions(classifyNoticingExample(second, 'examples'), [seed, edge]);
  assert.equal(finished.stage, 'done');
  assert.equal(finished.targetEdge, undefined);
  assert.equal(noticeNextExample(finished, edge, [seed, edge]).stage, 'done');
});

test('a confirmed counterexample ends prompts for that conjecture', () => {
  const seed = { from: 2, to: 1 }, edge = { from: 6, to: 6 };
  const size = conjectureFromExample('size', seed);
  const parity = conjectureFromExample('parity', seed);
  let value = noticeNextExample({ ...emptyNoticing(), stage: 'done', conjectures: [size, parity] }, edge, [seed, edge]);
  assert.equal(isConjectureDisproved(size, [seed, edge]), false);
  value = classifyNoticingExample(value, 'counterexamples');
  assert.equal(isConjectureDisproved(value.conjectures[0], [seed, edge]), true);
  value = continueConjectureQuestions(value, [seed, edge]);
  assert.equal(value.targetKind, 'parity');
  value = continueConjectureQuestions(classifyNoticingExample(value, 'counterexamples'), [seed, edge]);
  assert.equal(value.stage, 'done');
  assert.equal(noticeNextExample(value, { from: 12, to: 16 }, [seed, edge, { from: 12, to: 16 }]).stage, 'done');
});

test('irrelevant parity results are skipped and unreviewed results can be prompted later', () => {
  const seed = { from: 2, to: 1 }, odd = { from: 3, to: 1 };
  const size = { ...conjectureFromExample('size', seed), classifications: { '2:1': 'examples', '3:1': 'examples' } };
  const parity = { ...conjectureFromExample('parity', seed), classifications: { '2:1': 'examples' } };
  assert.equal(classifyExample(parity, odd), null);
  const value = { ...emptyNoticing(), stage: 'done', conjectures: [size, parity] };
  assert.equal(noticeNextExample(value, odd, [seed, odd]).stage, 'done');
  const older = { from: 4, to: 3 };
  const queued = noticeNextExample(value, odd, [seed, older, odd]);
  assert.deepEqual(queued.targetEdge, older);
  assert.equal(queued.targetKind, 'size');
});

test('legacy incorrect sorting is returned to the question queue', () => {
  const edge = { from: 2, to: 1 };
  const guess = { ...conjectureFromExample('size', edge), classifications: { '2:1': 'counterexamples' } };
  const restored = validateNoticing({ ...emptyNoticing(), stage: 'done', conjectures: [guess] }, [edge]);
  assert.deepEqual(restored.conjectures[0].classifications, {});
  assert.equal(isConjectureDisproved(restored.conjectures[0], [edge]), false);
});
