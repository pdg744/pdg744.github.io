import { readProgress, writeProgress } from './progressStorage.js';

const historyRevision = (storage) => readProgress('practice-reset', (value) => typeof value === 'string' ? value : null, storage) ?? 'original';

export function resetProblemHistory(storage) {
  const revisionSaved = writeProgress('practice-reset', `${Date.now()}:${Math.random()}`, storage);
  const attemptsSaved = writeProgress('problem-attempts', [], storage);
  return revisionSaved && attemptsSaved;
}

// Persist elapsed time, never a wall-clock start: time away must not count.
export function createProblemTimer(key, storage, now = () => performance.now(), observer) {
  let revision = historyRevision(storage);
  let record = `timer.${revision === 'original' ? '' : `${revision}.`}${key}`;
  let elapsed = readProgress(record, (value) => Number.isFinite(value) && value >= 0 ? value : null, storage) ?? 0;
  let started = null;
  let opened = false;
  function syncReset() {
    const next = historyRevision(storage);
    if (next === revision) return;
    revision = next;
    record = `timer.${revision}.${key}`;
    elapsed = 0;
    started = null;
    opened = false;
  }
  const checkpoint = () => {
    syncReset();
    if (started !== null) {
      const current = now();
      elapsed += Math.max(0, current - started);
      started = current;
    }
    writeProgress(record, elapsed, storage);
    if (opened) observer?.checkpoint(Math.round(elapsed));
    return Math.round(elapsed);
  };
  return {
    start() { syncReset(); if (started === null) started = now(); opened = true; observer?.open(Math.round(elapsed)); },
    pause() { checkpoint(); started = null; },
    checkpoint,
    finish(eventId) { checkpoint(); started = null; if (opened) observer?.finish(Math.round(elapsed), eventId); return Math.round(elapsed); },
  };
}
