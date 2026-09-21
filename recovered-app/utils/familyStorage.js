import { readProgress, writeProgress } from './progressStorage.js';
import { validateDiffyProgress } from '../game/diffyProgress.js';
import { validateFactorProgress } from '../game/factorProgress.js';

export function validateProfile(value) {
  if (!value || typeof value.name !== 'string') return null;
  const name = value.name.trim();
  return name.length > 0 && name.length <= 40 ? { name } : null;
}
export const readProfile = (storage) => readProgress('family-profile', validateProfile, storage);
export function saveProfile(name, storage) {
  const profile = validateProfile({ name });
  if (!profile) return { valid: false, persisted: false };
  return { valid: true, persisted: writeProgress('family-profile', profile, storage) };
}

export function activityOverview(storage) {
  const diffy = readProgress('diffy-squares', validateDiffyProgress, storage);
  const factor = readProgress('factor-and-add', validateFactorProgress, storage);
  const diffyStarted = Boolean(diffy && (diffy.phase !== 'input' || diffy.cornerInputs.some(Boolean)));
  const factorStarted = Boolean(factor && (factor.phase !== 'choose' || factor.connections.length));
  return [
    { id: 'diffy-squares', title: 'Diffy Squares', started: diffyStarted,
      detail: !diffyStarted ? 'Ready to explore' : diffy.phase === 'complete' ? 'Current puzzle complete' : diffy.phase === 'input' ? 'Starting numbers saved' : `${diffy.currentGenIndex} rounds completed in this puzzle` },
    { id: 'factor-and-add', title: 'Factor and Add', started: factorStarted,
      detail: !factorStarted ? 'Ready to explore' : `${factor.connections.length} numbers explored in this graph${factor.phase !== 'choose' ? ` · Working on ${factor.chosen}` : ''}` },
  ];
}
