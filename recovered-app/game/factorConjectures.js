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
      !['sizeIntro', 'size', 'sizeBet', 'sizeConjecture', 'parityIntro', 'parity', 'parityBet', 'parityConjecture', 'done'].includes(value.stage) ||
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
        return ['examples', 'counterexamples'].includes(group) ? [[key, group]] : [];
      }));
    }
    conjectures.push(expected);
  }
  if (['sizeConjecture', 'parityIntro', 'parity', 'parityBet', 'parityConjecture'].includes(value.stage) && !conjectures.some((c) => c.kind === 'size')) return null;
  if (value.stage === 'parityConjecture' && !conjectures.some((c) => c.kind === 'parity')) return null;
  return { stage: value.stage, sizeChoice: value.sizeChoice, fromParity: value.fromParity, toParity: value.toParity, conjectures };
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
