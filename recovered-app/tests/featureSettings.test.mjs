import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeatureSettingsStore } from '../utils/featureSettings.js';
import { progressKey, readProgress, writeProgress } from '../utils/progressStorage.js';

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
}

test('student features default off, including malformed and partial settings', () => {
  const disk = storage();
  assert.deepEqual(createFeatureSettingsStore(disk).getSnapshot(), { stars: false, conjectures: false });
  disk.setItem(progressKey('feature-settings'), 'invalid json');
  assert.deepEqual(createFeatureSettingsStore(disk).getSnapshot(), { stars: false, conjectures: false });
  writeProgress('feature-settings', { stars: 'true', conjectures: 1 }, disk);
  assert.deepEqual(createFeatureSettingsStore(disk).getSnapshot(), { stars: false, conjectures: false });
  writeProgress('feature-settings', { conjectures: true }, disk);
  assert.deepEqual(createFeatureSettingsStore(disk).getSnapshot(), { stars: false, conjectures: true });
});

test('parent toggles persist independently and notify mounted screens without clearing progress', () => {
  const disk = storage();
  const store = createFeatureSettingsStore(disk);
  const saved = { keep: 'existing data' };
  for (const key of ['factor-and-add', 'diffy-squares', 'practice-stars', 'problem-attempts', 'family-profile']) writeProgress(key, saved, disk);
  const initial = store.getSnapshot();
  assert.equal(store.getSnapshot(), initial);
  let notifications = 0;
  const unsubscribe = store.subscribe(() => notifications++);
  assert.equal(store.set('stars', true), true);
  assert.deepEqual(store.getSnapshot(), { stars: true, conjectures: false });
  store.set('conjectures', true);
  store.set('stars', false);
  assert.equal(notifications, 3);
  assert.deepEqual(createFeatureSettingsStore(disk).getSnapshot(), { stars: false, conjectures: true });
  for (const key of ['factor-and-add', 'diffy-squares', 'practice-stars', 'problem-attempts', 'family-profile']) assert.deepEqual(readProgress(key, (value) => value, disk), saved);
  unsubscribe();
});

test('refresh picks up changes made by another settings store', () => {
  const disk = storage();
  const store = createFeatureSettingsStore(disk);
  store.getSnapshot();
  createFeatureSettingsStore(disk).set('conjectures', true);
  store.refresh();
  assert.equal(store.getSnapshot().conjectures, true);
});

test('blocked storage still applies settings for the session', () => {
  const disk = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const store = createFeatureSettingsStore(disk);
  assert.equal(store.set('stars', true), false);
  assert.equal(store.getSnapshot().stars, true);
  assert.equal(createFeatureSettingsStore(disk).getSnapshot().stars, true);
  store.set('stars', false);
});
