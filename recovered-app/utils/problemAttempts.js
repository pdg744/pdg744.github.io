import { readProgress, writeProgress } from './progressStorage.js';

export function readAttempts(storage) {
  return readProgress('problem-attempts', (value) => Array.isArray(value) ? value.filter((item) =>
    item && typeof item.id === 'string' && ['multiplication', 'addition'].includes(item.type) &&
    typeof item.label === 'string' && Number.isFinite(Date.parse(item.at)) &&
    Number.isFinite(item.durationMs) && item.durationMs >= 0) : null, storage) ?? [];
}

export function attemptRecorder(id, description, storage) {
  function update(durationMs, solvedEventId) {
    const items = readAttempts(storage);
    const previous = items.find((item) => item.id === id);
    const next = { ...description, ...previous, id, durationMs, at: previous?.at ?? new Date().toISOString(),
      ...(solvedEventId ? { solvedEventId } : {}) };
    writeProgress('problem-attempts', [...items.filter((item) => item.id !== id), next], storage);
  }
  return {
    open: (ms) => update(ms),
    checkpoint: (ms) => update(ms),
    finish: (ms, eventId) => update(ms, eventId),
  };
}

export function attentionProblems(events, attempts, type, days = null, now = Date.now()) {
  const solvedIds = new Set(events.map((event) => event.id));
  const rows = [
    ...attempts.filter((attempt) => !solvedIds.has(attempt.solvedEventId)).map((attempt) => ({ ...attempt, unfinished: true })),
    ...events.map((event) => ({ ...event, unfinished: false })),
  ];
  const cutoff = days === null ? -Infinity : now - days * 86400000;
  return rows.filter((row) => row.type === type && Date.parse(row.at) >= cutoff && Date.parse(row.at) <= now)
    .sort((a, b) => Number(b.unfinished) - Number(a.unfinished) ||
      (b.durationMs ?? -1) - (a.durationMs ?? -1) || Date.parse(b.at) - Date.parse(a.at));
}
