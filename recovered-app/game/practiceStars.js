export const PRACTICE_TYPES = [
  { id: 'multiplication', label: 'Multiplication', symbol: '×' },
  { id: 'addition', label: 'Addition', symbol: '+' },
  { id: 'subtraction', label: 'Subtraction', symbol: '−' },
];

export const validPracticeRunId = (id) => typeof id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(id);
export function newPracticeRunId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function validStar(event) {
  if (!event || typeof event.id !== 'string' || !event.id.length || event.id.length > 256 ||
      typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) return false;
  const { operands, answer } = event.problem ?? {};
  if (!Array.isArray(operands) || !operands.length || operands.length > 2000 ||
      !operands.every((n) => Number.isSafeInteger(n) && n >= 0) ||
      !Number.isSafeInteger(answer) || answer < 0) return false;
  if (event.type === 'multiplication') return operands.length === 2 && operands[0] * operands[1] === answer;
  if (event.type === 'addition') return operands.length >= 2 && operands.reduce((a, b) => a + b, 0) === answer;
  if (event.type === 'subtraction') return operands.length === 2 && operands[0] - operands[1] === answer;
  return false;
}

export function validatePracticeHistory(value) {
  if (!value || !Array.isArray(value.events)) return null;
  const seen = new Set();
  return { events: value.events.filter((event) => {
    if (!validStar(event) || seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  }) };
}

export function practiceTotals(events, days = null, now = Date.now()) {
  const totals = Object.fromEntries(PRACTICE_TYPES.map(({ id }) => [id, 0]));
  const cutoff = days === null ? -Infinity : now - days * 24 * 60 * 60 * 1000;
  for (const event of events) {
    const at = Date.parse(event.at);
    if (at >= cutoff && at <= now && Object.hasOwn(totals, event.type)) totals[event.type]++;
  }
  return totals;
}
