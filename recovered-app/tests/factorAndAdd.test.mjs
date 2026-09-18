import test from "node:test";
import assert from "node:assert/strict";
import {
  STARTING_NUMBERS,
  factorsOf,
  hasAllFactors,
  factorsToAdd,
  properFactorSum,
  addConnection,
} from "../game/factorAndAdd.js";

test("board includes all thirty numbers and factors include the number itself", () => {
  assert.equal(STARTING_NUMBERS.length, 30);
  assert.deepEqual(factorsOf(12), [1, 2, 3, 4, 6, 12]);
  assert.deepEqual(factorsOf(13), [1, 13]);
  assert.equal(hasAllFactors(12, [12, 6, 4, 3, 2, 1]), true);
  assert.equal(hasAllFactors(12, [1, 2, 3, 4, 6]), false);
  assert.equal(hasAllFactors(12, [1, 2, 3, 4, 6, 12, 5]), false);
});
test("sum excludes only the chosen number and preserves exploratory selections", () => {
  assert.deepEqual(factorsToAdd(12, [12, 6, 4, 3, 2, 1]), [1, 2, 3, 4, 6]);
  assert.deepEqual(factorsToAdd(12, [5, 12]), [5]);
  assert.equal(properFactorSum(13), 1);
  assert.equal(properFactorSum(6), 6);
  assert.equal(properFactorSum(28), 28);
  assert.equal(properFactorSum(30), 42);
});
test("connections retain history, loops and out-of-range totals without duplicate edges", () => {
  const first = addConnection([], 6, 6);
  const second = addConnection(first, 30, 42);
  assert.deepEqual(second, [
    { from: 6, to: 6 },
    { from: 30, to: 42 },
  ]);
  assert.equal(addConnection(second, 6, 6), second);
  assert.deepEqual(addConnection(second, 12, 0).at(-1), { from: 12, to: 0 });
  assert.equal(first.length, 1);
});
