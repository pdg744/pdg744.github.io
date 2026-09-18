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
    [{ from: 31, to: 1 }],
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
      { factorInput: "123" },
      { pairedInput: "-1" },
      { sum: "1234567" },
      { sum: 6 },
      { connections: null },
    ].map((changes) => ({ ...complete(), ...changes })),
  ]) {
    assert.equal(validateFactorProgress(value), null);
  }
});
