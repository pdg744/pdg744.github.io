import { emptyFactorProgress } from '../game/factorProgress.js';
import { newPracticeRunId } from '../game/practiceStars.js';
import { progressKey, readProgress, writeProgress } from './progressStorage.js';

export function validateFeatureSettings(value) {
  return { stars: value?.stars === true, conjectures: value?.conjectures === true };
}

export function createFeatureSettingsStore(storage) {
  let snapshot;
  const listeners = new Set();
  const read = () => readProgress('feature-settings', validateFeatureSettings, storage) ?? validateFeatureSettings(null);
  const notify = () => listeners.forEach((listener) => listener());
  const refresh = () => {
    const next = read();
    if (!snapshot || next.stars !== snapshot.stars || next.conjectures !== snapshot.conjectures) {
      snapshot = next;
      notify();
    }
  };
  const onStorage = (event) => {
    if (event.key === null || event.key === progressKey('feature-settings')) refresh();
  };
  function resetActivities() {
    const factorSaved = writeProgress('factor-and-add', {
      ...emptyFactorProgress(), practiceRunId: newPracticeRunId(),
    }, storage);
    const diffySaved = writeProgress('diffy-squares', {
      phase: 'input', cornerInputs: ['', '', '', ''], practiceRunId: newPracticeRunId(),
    }, storage);
    return factorSaved && diffySaved;
  }
  return {
    getSnapshot: () => snapshot ?? (snapshot = read()),
    refresh,
    resetConjectures() {
      const persisted = resetActivities();
      snapshot = { ...read() };
      notify();
      return persisted;
    },
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) globalThis.addEventListener?.('storage', onStorage);
      refresh();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) globalThis.removeEventListener?.('storage', onStorage);
      };
    },
    set(feature, enabled) {
      if (!['stars', 'conjectures'].includes(feature) || typeof enabled !== 'boolean') return false;
      const previous = read();
      let activitiesSaved = true;
      if (feature === 'conjectures' && enabled && !previous.conjectures) {
        activitiesSaved = resetActivities();
      }
      snapshot = { ...previous, [feature]: enabled };
      const settingsSaved = writeProgress('feature-settings', snapshot, storage);
      const persisted = activitiesSaved && settingsSaved;
      notify();
      return persisted;
    },
  };
}

export const featureSettingsStore = createFeatureSettingsStore();
