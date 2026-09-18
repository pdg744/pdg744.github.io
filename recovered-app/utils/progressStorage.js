// Browser-local persistence. Native and restricted browsers retain an in-memory
// copy for navigation; durable native storage is outside the web refresh MVP.
const memory = new Map();
const failedWrites = new Set();
export const PROGRESS_VERSION = 1;
export const progressKey = (activity) => `mathexplorers.progress.${activity}`;

export function readProgress(activity, validate, storage) {
  const key = progressKey(activity);
  let raw;
  try {
    const source = storage === undefined ? globalThis.localStorage : storage;
    raw = source && !failedWrites.has(key) ? source.getItem(key) : memory.get(key);
  } catch {
    raw = memory.get(key);
  }
  try {
    if (!raw) return null;
    const envelope = JSON.parse(raw);
    if (envelope.version !== PROGRESS_VERSION) return null;
    return validate(envelope.data);
  } catch {
    // Malformed records and failed validation must never prevent play.
    return null;
  }
}

export function writeProgress(activity, data, storage) {
  const key = progressKey(activity);
  try {
    const raw = JSON.stringify({ version: PROGRESS_VERSION, data });
    memory.set(key, raw);
    const target = storage === undefined ? globalThis.localStorage : storage;
    target?.setItem(key, raw);
    failedWrites.delete(key);
    return Boolean(target);
  } catch {
    failedWrites.add(key);
    return false;
  }
}
