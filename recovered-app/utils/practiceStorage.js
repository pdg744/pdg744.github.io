import { readProgress, writeProgress, progressKey } from './progressStorage.js';
import { resetProblemHistory } from './problemTimer.js';
import { newPracticeRunId, validPracticeRunId, validStar, validatePracticeHistory } from '../game/practiceStars.js';

export function ensurePracticeRun(activity, progress) {
  if (validPracticeRunId(progress.practiceRunId)) return progress;
  const next = { ...progress, practiceRunId: newPracticeRunId() };
  // Save the identity before an answer can earn a star, including legacy saves.
  writeProgress(activity, next);
  return next;
}

export function createPracticeStore(storage) {
  let snapshot;
  const listeners = new Set();
  const read = () => readProgress('practice-stars', validatePracticeHistory, storage) ?? { events: [] };
  const getSnapshot = () => snapshot ?? (snapshot = read());
  const notify = () => listeners.forEach((listener) => listener());
  function onStorage(event) {
    if (event.key === progressKey('practice-stars')) {
      snapshot = read();
      notify();
    }
  }
  return {
    getSnapshot,
    reset() {
      const historySaved = resetProblemHistory(storage);
      snapshot = { events: [] };
      const starsSaved = writeProgress('practice-stars', snapshot, storage);
      notify();
      return historySaved && starsSaved;
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) globalThis.addEventListener?.('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (!listeners.size) globalThis.removeEventListener?.('storage', onStorage);
      };
    },
    award(event) {
      if (!validStar(event)) return false;
      const current = read();
      if (current.events.some((previous) => previous.id === event.id)) return false;
      snapshot = { events: [...current.events, event] };
      writeProgress('practice-stars', snapshot, storage);
      notify();
      return true;
    },
  };
}

export const practiceStore = createPracticeStore();
export function awardStar(id, type, operands, answer, durationMs) {
  return practiceStore.award({ id, type, problem: { operands, answer }, ...(durationMs === undefined ? {} : { durationMs }), at: new Date().toISOString() });
}
