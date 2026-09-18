import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyFactorProgress,
  validateFactorProgress,
} from "../game/factorProgress.js";
import { readProgress, writeProgress } from "../utils/progressStorage.js";

const complete = () => ({
  ...emptyFactorProgress(),
  phase: "sum",
  chosen: 6,
  selected: [1, 6, 2, 3],
  pairs: [
    [1, 6],
    [2, 3],
  ],
  savedFactors: { 6: [1, 6, 2, 3] },
  savedPairs: {
    6: [
      [1, 6],
      [2, 3],
    ],
  },
  sum: "0",
});

test("fresh and partial factor work round-trip, including unfinished or incorrect drafts", () => {
  for (const state of [
    emptyFactorProgress(),
    {
      ...emptyFactorProgress(),
      phase: "factors",
      chosen: 24,
      selected: [1, 24],
      pairs: [[1, 24]],
      factorInput: "0",
      pairedInput: "9",
    },
    complete(),
  ]) {
    let stored;
    const storage = {
      getItem: () => stored,
      setItem: (_, value) => {
        stored = value;
      },
    };
    assert.equal(writeProgress("factor-test", state, storage), true);
    assert.deepEqual(
      readProgress("factor-test", validateFactorProgress, storage),
      state,
    );
  }
});

test("completed graphs preserve self-loops and out-of-picker destinations without animation state", () => {
  const state = {
    ...complete(),
    phase: "choose",
    connections: [
      { from: 6, to: 6 },
      { from: 24, to: 36 },
    ],
    latest: { from: 24, to: 36 },
  };
  assert.deepEqual(
    validateFactorProgress({ ...state, transitioning: true, zoom: {} }),
    state,
  );
});

test("invalid pairs, inconsistent factors and incomplete sum phases cannot restore", () => {
  for (const changes of [
    {
      pairs: [
        [1, 6],
        [2, 4],
      ],
    },
    { selected: [1, 6, 2, 3, 5] },
    { selected: [1, 6, 2, 2] },
    { selected: [1, 6], pairs: [[1, 6]] },
    {
      pairs: [
        [1, 6],
        [2, 3],
        [3, 2],
      ],
    },
    {
      savedPairs: {
        6: [
          [1, 6],
          [2, 4],
        ],
      },
    },
    { savedFactors: { 6: [1, 6] } },
    { savedPairs: { 7: [[1, 7]] } },
  ])
    assert.equal(validateFactorProgress({ ...complete(), ...changes }), null);
});

test("unchecked, duplicate and nonfinite edges cannot restore", () => {
  for (const connections of [
    [{ from: 6, to: 7 }],
    [
      { from: 24, to: 36 },
      { from: 24, to: 36 },
    ],
    [{ from: 1000001, to: 1 }],
    [{ from: 6, to: Infinity }],
    [null],
  ])
    assert.equal(validateFactorProgress({ ...complete(), connections }), null);
  assert.equal(
    validateFactorProgress({ ...complete(), latest: { from: 6, to: 6 } }),
    null,
  );
});

test("malformed shapes and out-of-bounds snapshots safely fail validation", () => {
  for (const value of [
    null,
    {},
    [],
    {
      ...complete(),
      phase: "pending",
    },
    ...[
      { chosen: 1 },
      { chosen: NaN },
      { chosen: null },
      { selected: null },
      { pairs: {} },
      { pairs: Array(16).fill([1, 6]) },
      { savedPairs: null },
      { savedFactors: [] },
      { factorInput: "12345678" },
      { pairedInput: "-1" },
      { sum: "123456789" },
      { sum: 6 },
      { connections: null },
    ].map((changes) => ({ ...complete(), ...changes })),
  ]) {
    assert.equal(validateFactorProgress(value), null);
  }
});

test("continued chains, merged paths, cycles and terminal one survive serialization", () => {
  const state = {
    ...emptyFactorProgress(),
    phase: "factors",
    chosen: 36,
    selected: [1, 36],
    pairs: [[1, 36]],
    factorInput: "3",
    pairedInput: "12",
    savedFactors: { 36: [1, 36] },
    savedPairs: { 36: [[1, 36]] },
    connections: [
      { from: 24, to: 36 },
      { from: 36, to: 55 },
      { from: 55, to: 17 },
      { from: 17, to: 1 },
      { from: 7, to: 1 },
      { from: 220, to: 284 },
      { from: 284, to: 220 },
      { from: 6, to: 6 },
    ],
    latest: { from: 17, to: 1 },
  };
  assert.deepEqual(
    validateFactorProgress(JSON.parse(JSON.stringify(state))),
    state,
  );
  assert.equal(validateFactorProgress({ ...state, chosen: 0 }), null);
  assert.equal(
    validateFactorProgress({ ...state, connections: [{ from: 0, to: 0 }] }),
    null,
  );
});
test("complete larger factor sets and upper-bound results restore", async () => {
  const { factorsOf, properFactorSum } =
    await import("../game/factorAndAdd.js");
  for (const chosen of [36, 83160, 1000000]) {
    const selected = factorsOf(chosen);
    const pairs = selected
      .filter((n) => n * n <= chosen)
      .map((n) => [n, chosen / n]);
    const state = {
      ...emptyFactorProgress(),
      phase: "sum",
      chosen,
      selected,
      pairs,
      sum: String(properFactorSum(chosen)),
      connections: [{ from: chosen, to: properFactorSum(chosen) }],
    };
    assert.deepEqual(validateFactorProgress(state), state);
  }
});

test("legacy exploration of one returns to the graph without losing other chains", () => {
  const state = {
    ...emptyFactorProgress(),
    phase: "sum",
    chosen: 1,
    selected: [1],
    pairs: [[1, 1]],
    sum: "0",
    savedFactors: { 1: [1], 24: [1, 24] },
    savedPairs: { 1: [[1, 1]], 24: [[1, 24]] },
    connections: [
      { from: 24, to: 36 },
      { from: 17, to: 1 },
      { from: 1, to: 0 },
    ],
    latest: { from: 1, to: 0 },
  };
  const restored = validateFactorProgress(state);
  assert.equal(restored.phase, "choose");
  assert.equal(restored.chosen, null);
  assert.deepEqual(restored.selected, []);
  assert.deepEqual(restored.connections, [
    { from: 24, to: 36 },
    { from: 17, to: 1 },
  ]);
  assert.deepEqual(restored.savedFactors, { 24: [1, 24] });
  assert.deepEqual(restored.savedPairs, { 24: [[1, 24]] });
  assert.equal(restored.latest, null);
  assert.equal(state.connections.length, 3);
});
