import test from "node:test";
import assert from "node:assert/strict";
import {
  STARTING_NUMBERS,
  factorsOf,
  hasAllFactors,
  factorsToAdd,
  properFactorSum,
  addConnection,
  isCompleteFactorInput,
} from "../game/factorAndAdd.js";

test("factor entry advances on one and unambiguous factors without accepting invalid drafts", () => {
  assert.equal(isCompleteFactorInput(12, "1"), true);
  assert.equal(isCompleteFactorInput(12, "2"), true);
  assert.equal(isCompleteFactorInput(12, "12"), true);
  assert.equal(isCompleteFactorInput(24, "2"), false);
  assert.equal(isCompleteFactorInput(24, "24"), true);
  assert.equal(isCompleteFactorInput(12, "1", [1, 12]), false);
  for (const draft of ["", "0", "5", "-2", "2x"]) {
    assert.equal(isCompleteFactorInput(12, draft), false);
  }
});

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

test("continued factor chains use complete factor sets beyond the picker", () => {
  assert.deepEqual(factorsOf(36), [1, 2, 3, 4, 6, 9, 12, 18, 36]);
  const chain = [24];
  while (chain.at(-1) !== 0) chain.push(properFactorSum(chain.at(-1)));
  assert.deepEqual(chain, [24, 36, 55, 17, 1, 0]);
  assert.equal(properFactorSum(220), 284);
  assert.equal(properFactorSum(284), 220);
  for (let number = 1; number <= 2000; number++) {
    const expected = Array.from({ length: number }, (_, i) => i + 1).filter(
      (n) => number % n === 0,
    );
    assert.deepEqual(factorsOf(number), expected);
  }
});
test("numeric and exploration bounds preserve existing work", async () => {
  const { explorationLimit, MAX_EXPLORATIONS, MAX_FACTOR_NUMBER } =
    await import("../game/factorAndAdd.js");
  for (const invalid of [0, -1, 1.5, Infinity, NaN, MAX_FACTOR_NUMBER + 1]) {
    assert.deepEqual(factorsOf(invalid), []);
    assert.equal(hasAllFactors(invalid, []), false);
    assert.ok(explorationLimit(invalid, [], {}));
  }
  assert.equal(properFactorSum(MAX_FACTOR_NUMBER), 1480437);
  assert.equal(explorationLimit(1, [], {}), "End of chain");
  assert.equal(explorationLimit(36, [{ from: 24, to: 36 }], {}), null);
  const saved = Object.fromEntries(
    Array.from({ length: MAX_EXPLORATIONS }, (_, i) => [i + 1, []]),
  );
  assert.ok(explorationLimit(129, [], saved));
  assert.equal(explorationLimit(128, [], saved), null);
  assert.equal(explorationLimit(6, [{ from: 6, to: 6 }], {}), "Completed");
});
