import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveProfile, readProfile, activityOverview } from '../utils/familyStorage.js';
import { writeProgress } from '../utils/progressStorage.js';

test('profile creation and renaming preserve existing activity and practice history', () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
  writeProgress('diffy-squares', { phase: 'input', cornerInputs: ['1', '2', '', ''] }, storage);
  writeProgress('practice-stars', { events: [] }, storage);
  const original = new Map(data);
  assert.equal(saveProfile('   ', storage).valid, false);
  assert.equal(saveProfile('x'.repeat(41), storage).valid, false);
  assert.deepEqual(saveProfile('  Alex  ', storage), { valid: true, persisted: true });
  assert.deepEqual(readProfile(storage), { name: 'Alex' });
  saveProfile('Sam', storage);
  assert.deepEqual(readProfile(storage), { name: 'Sam' });
  for (const [key, value] of original) assert.equal(data.get(key), value);
  assert.equal(activityOverview(storage)[0].started, true);
  assert.equal(activityOverview(storage)[1].started, false);
});

test('corrupt activity records do not invent progress', () => {
  const storage = { getItem: () => '{bad json' };
  assert.equal(readProfile(storage), null);
  assert.ok(activityOverview(storage).every((activity) => !activity.started));
});
