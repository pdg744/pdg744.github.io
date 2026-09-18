import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, writeProgress, progressKey } from '../utils/progressStorage.js';

const valid = (data) => data && typeof data.draft === 'string' ? data : null;
const makeStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('round trips versioned progress independently for each activity', () => {
  const storage = makeStorage();
  writeProgress('test-a', { draft: '12' }, storage);
  writeProgress('test-b', { draft: '3' }, storage);
  assert.deepEqual(readProgress('test-a', valid, storage), { draft: '12' });
  assert.deepEqual(readProgress('test-b', valid, storage), { draft: '3' });
  writeProgress('test-a', { draft: '' }, storage);
  assert.deepEqual(readProgress('test-a', valid, storage), { draft: '' });
});

test('missing, invalid, and incompatible records safely return null', () => {
  const storage = makeStorage();
  assert.equal(readProgress('missing', valid, storage), null);
  for (const raw of ['{', 'null', '{"version":99,"data":{"draft":"1"}}', '{"version":1,"data":{}}']) {
    storage.setItem(progressKey('invalid'), raw);
    assert.equal(readProgress('invalid', valid, storage), null);
  }
});

test('blocked storage keeps navigation usable with an in-memory snapshot', () => {
  const storage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(writeProgress('blocked-test', { draft: '4' }, storage), false);
  assert.deepEqual(readProgress('blocked-test', valid, storage), { draft: '4' });
  assert.equal(readProgress('blocked-test', () => { throw Error('invalid'); }, storage), null);
});


test('failed writes do not restore an older disk snapshot during navigation', () => {
  const storage = makeStorage();
  writeProgress('quota-test', { draft: 'old' }, storage);
  const full = { getItem: storage.getItem, setItem() { throw Error('quota'); } };
  writeProgress('quota-test', { draft: 'new' }, full);
  assert.deepEqual(readProgress('quota-test', valid, full), { draft: 'new' });
  writeProgress('quota-test', { draft: 'recovered' }, storage);
  assert.deepEqual(readProgress('quota-test', valid, storage), { draft: 'recovered' });
});
