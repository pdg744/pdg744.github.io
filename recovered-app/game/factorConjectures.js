export const numberChange = ({ from, to }) => to > from ? 'bigger' : to < from ? 'smaller' : 'same';
export const numberParity = (number) => number % 2 === 0 ? 'even' : 'odd';

export function conjectureFromExample(kind, edge) {
  return kind === 'size'
    ? { kind, change: numberChange(edge) }
    : { kind: 'parity', fromParity: numberParity(edge.from), toParity: numberParity(edge.to) };
}

export function conjectureText(conjecture) {
  if (conjecture.kind === 'size') {
    return conjecture.change === 'same'
      ? 'The number always stays the same.'
      : `The number always gets ${conjecture.change}.`;
  }
  const article = (parity) => parity === 'even' ? 'an even' : 'an odd';
  return `Starting with ${article(conjecture.fromParity)} number always gives ${article(conjecture.toParity)} number.`;
}

export function conjectureEvidence(conjecture, connections) {
  const relevant = connections.filter((edge) => conjecture.kind === 'size' || numberParity(edge.from) === conjecture.fromParity);
  const counterexamples = relevant.filter((edge) => conjecture.kind === 'size'
    ? numberChange(edge) !== conjecture.change
    : numberParity(edge.to) !== conjecture.toParity);
  return { checked: relevant.length, supported: relevant.length - counterexamples.length, counterexample: counterexamples[0] ?? null };
}

export function emptyNoticing() {
  return { stage: 'sizeIntro', sizeChoice: null, fromParity: null, toParity: null, conjectures: [] };
}

export function validateNoticing(value, connections) {
  if (!value || !connections.length ||
      !['sizeIntro', 'size', 'sizeBet', 'sizeConjecture', 'awaitingExample', 'classify', 'classified', 'parityIntro', 'parity', 'parityBet', 'parityConjecture', 'done'].includes(value.stage) ||
      ![null, 'bigger', 'smaller', 'same'].includes(value.sizeChoice) ||
      ![null, 'even', 'odd'].includes(value.fromParity) ||
      ![null, 'even', 'odd'].includes(value.toParity) ||
      !Array.isArray(value.conjectures) || value.conjectures.length > 2) return null;
  const conjectures = [];
  for (const conjecture of value.conjectures) {
    if (!conjecture || !['size', 'parity'].includes(conjecture.kind) || conjectures.some((c) => c.kind === conjecture.kind)) return null;
    const expected = conjectureFromExample(conjecture.kind, connections[0]);
    if (Object.keys(expected).some((key) => conjecture[key] !== expected[key])) return null;
    if (conjecture.classifications && typeof conjecture.classifications === 'object' && !Array.isArray(conjecture.classifications)) {
      expected.classifications = Object.fromEntries(connections.flatMap((edge) => {
        const key = conjectureEdgeKey(edge);
        const group = conjecture.classifications[key];
        return group === classifyExample(expected, edge) ? [[key, group]] : [];
      }));
    }
    conjectures.push(expected);
  }
  if (['sizeConjecture', 'awaitingExample', 'classify', 'classified', 'parityIntro', 'parity', 'parityBet', 'parityConjecture'].includes(value.stage) && !conjectures.some((c) => c.kind === 'size')) return null;
  if (value.stage === 'parityConjecture' && !conjectures.some((c) => c.kind === 'parity')) return null;
  const targetEdge = connections.find((edge) => edge.from === value.targetEdge?.from && edge.to === value.targetEdge?.to);
  if (['classify', 'classified'].includes(value.stage) && !targetEdge) return null;
  const targetKind = value.targetKind ?? 'size';
  if (['classify', 'classified'].includes(value.stage) && !conjectures.some((item) => item.kind === targetKind && classifyExample(item, targetEdge))) return null;
  return { ...(value.targetKind ? { targetKind } : {}), ...(targetEdge ? { targetEdge } : {}), stage: value.stage, sizeChoice: value.sizeChoice, fromParity: value.fromParity, toParity: value.toParity, conjectures };
}

export const conjectureEdgeKey = (edge) => `${edge.from}:${edge.to}`;

export function groupConjectureConnections(conjecture, connections) {
  const groups = { examples: [], counterexamples: [], unsorted: [] };
  for (const edge of connections) {
    const choice = conjecture.classifications?.[conjectureEdgeKey(edge)];
    groups[choice === 'examples' || choice === 'counterexamples' ? choice : 'unsorted'].push(edge);
  }
  return groups;
}

export function classifySizeExample(conjecture, edge) {
  return numberChange(edge) === conjecture.change ? 'examples' : 'counterexamples';
}

export function classifyExample(conjecture, edge) {
  if (conjecture.kind === 'size') return classifySizeExample(conjecture, edge);
  if (numberParity(edge.from) !== conjecture.fromParity) return null;
  return numberParity(edge.to) === conjecture.toParity ? 'examples' : 'counterexamples';
}

export function isConjectureDisproved(conjecture, connections) {
  return connections.some((edge) => conjecture.classifications?.[conjectureEdgeKey(edge)] === 'counterexamples'
    && classifyExample(conjecture, edge) === 'counterexamples');
}

// Keep one current challenge visible; only learner-confirmed counterexamples retire it.
export function currentConjecture(noticing, connections) {
  if (!noticing) return null;
  const open = noticing.conjectures.filter((item) => !isConjectureDisproved(item, connections));
  if (['classify', 'classified'].includes(noticing.stage)) {
    return open.find((item) => item.kind === (noticing.targetKind ?? 'size')) ?? null;
  }
  return open.at(-1) ?? null;
}

export function nextConjectureQuestion(noticing, connections, preferredEdge) {
  const ordered = preferredEdge
    ? [preferredEdge, ...connections.filter((edge) => conjectureEdgeKey(edge) !== conjectureEdgeKey(preferredEdge)).reverse()]
    : [...connections].reverse();
  for (const edge of ordered) {
    for (const conjecture of noticing.conjectures) {
      if (!isConjectureDisproved(conjecture, connections) && classifyExample(conjecture, edge)
          && !conjecture.classifications?.[conjectureEdgeKey(edge)]) {
        return { ...noticing, stage: 'classify', targetEdge: edge, targetKind: conjecture.kind };
      }
    }
  }
  const { targetEdge, targetKind, ...rest } = noticing;
  return { ...rest, stage: 'done' };
}

export function noticeNextExample(noticing, edge, connections = [edge]) {
  if (noticing?.stage === 'awaitingExample') return { ...noticing, stage: 'classify', targetEdge: edge };
  return noticing?.stage === 'done' ? nextConjectureQuestion(noticing, connections, edge) : noticing;
}

export function classifyNoticingExample(noticing, group) {
  const kind = noticing.targetKind ?? 'size';
  const conjecture = noticing.conjectures.find((item) => item.kind === kind);
  if (noticing.stage !== 'classify' || !conjecture || !noticing.targetEdge ||
      classifyExample(conjecture, noticing.targetEdge) !== group) return noticing;
  return { ...noticing, stage: 'classified', conjectures: noticing.conjectures.map((item) => item.kind === kind
    ? { ...item, classifications: { ...item.classifications, [conjectureEdgeKey(noticing.targetEdge)]: group } }
    : item) };
}

export function continueConjectureQuestions(noticing, connections) {
  if (!noticing.conjectures.some((item) => item.kind === 'parity')) return { ...noticing, stage: 'parityIntro' };
  return nextConjectureQuestion(noticing, connections, noticing.targetEdge);
}

export function finishConjectureResponse(noticing, connections) {
  if (noticing.stage !== 'classified') return noticing;
  const conjecture = noticing.conjectures.find(item => item.kind === (noticing.targetKind ?? 'size'));
  if (!conjecture || !noticing.targetEdge) return noticing;
  if (classifyExample(conjecture, noticing.targetEdge) === 'counterexamples') {
    return continueConjectureQuestions(noticing, connections);
  }
  const { targetEdge, targetKind, ...rest } = noticing;
  return { ...rest, stage: noticing.conjectures.some(item => item.kind === 'parity') ? 'done' : 'awaitingExample' };
}
