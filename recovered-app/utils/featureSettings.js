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
  return {
    getSnapshot: () => snapshot ?? (snapshot = read()),
    refresh,
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
      snapshot = { ...read(), [feature]: enabled };
      const persisted = writeProgress('feature-settings', snapshot, storage);
      notify();
      return persisted;
    },
  };
}

export const featureSettingsStore = createFeatureSettingsStore();
