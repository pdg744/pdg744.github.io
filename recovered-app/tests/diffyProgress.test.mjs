import test from "node:test";
import assert from "node:assert/strict";
import { validateDiffyProgress } from "../game/diffyProgress.js";
import { readProgress, writeProgress } from "../utils/progressStorage.js";

const playing = (overrides = {}) => ({
  phase: "playing",
  cornerInputs: ["1", "2", "3", "4"],
  initialCorners: [1, 2, 3, 4],
  currentGenIndex: 0,
  userAnswers: ["1", "", "", ""],
  ...overrides,
});

test("starting drafts survive serialization, including blanks and leading zeros", () => {
  const snapshot = { phase: "input", cornerInputs: ["0012", "", "0", "9999"] };
  const storage = {
    value: null,
    setItem(key, value) {
      this.value = value;
    },
    getItem() {
      return this.value;
    },
  };
  writeProgress("diffy-draft-test", snapshot, storage);
  assert.deepEqual(
    readProgress("diffy-draft-test", validateDiffyProgress, storage)
      .cornerInputs,
    snapshot.cornerInputs,
  );
});

test("partial and incorrect midpoint answers survive without advancing", () => {
  const snapshot = playing({
    initialCorners: [123, 0, 4, 12],
    userAnswers: ["12", "4", "9", ""],
  });
  const restored = validateDiffyProgress(snapshot);
  assert.equal(restored.currentGenIndex, 0);
  assert.deepEqual(restored.userAnswers, snapshot.userAnswers);
});

test("refresh before transition settles all correct answers once", () => {
  const restored = validateDiffyProgress(
    playing({ userAnswers: ["1", "1", "1", "3"] }),
  );
  assert.equal(restored.currentGenIndex, 1);
  assert.deepEqual(restored.userAnswers, ["", "", "", ""]);
  assert.deepEqual(validateDiffyProgress(restored), restored);
});

test("refresh after transition preserves next generation without reusing old answers", () => {
  const restored = validateDiffyProgress(
    playing({ currentGenIndex: 1, userAnswers: ["", "", "", ""] }),
  );
  assert.equal(restored.currentGenIndex, 1);
  assert.equal(restored.phase, "playing");
  assert.deepEqual(restored.userAnswers, ["", "", "", ""]);
});

test("final drawing and all-zero starts restore as complete", () => {
  const finalDrawing = validateDiffyProgress(
    playing({ currentGenIndex: 5, userAnswers: ["", "", "", ""] }),
  );
  assert.equal(finalDrawing.phase, "complete");
  const finalAnswer = validateDiffyProgress(
    playing({ currentGenIndex: 4, userAnswers: ["0", "0", "0", "0"] }),
  );
  assert.deepEqual(finalAnswer, finalDrawing);
  assert.equal(
    validateDiffyProgress(playing({ initialCorners: [0, 0, 0, 0] })).phase,
    "complete",
  );
  assert.deepEqual(validateDiffyProgress(finalDrawing), finalDrawing);
});

test("reset and variation drafts discard the prior sequence and answers", () => {
  for (const cornerInputs of [
    ["", "", "", ""],
    ["1", "2", "3", "4"],
  ]) {
    const restored = validateDiffyProgress(
      playing({ phase: "input", cornerInputs, currentGenIndex: 3 }),
    );
    assert.equal(restored.initialCorners, null);
    assert.equal(restored.currentGenIndex, 0);
    assert.deepEqual(restored.userAnswers, ["", "", "", ""]);
    assert.deepEqual(restored.cornerInputs, cornerInputs);
  }
});

test("malformed or impossible snapshots are rejected", () => {
  for (const snapshot of [
    null,
    {},
    playing({ phase: "unknown" }),
    playing({ currentGenIndex: 99 }),
    playing({ currentGenIndex: -1 }),
    playing({ currentGenIndex: 1.5 }),
    playing({ initialCorners: [-1, 0, 0, 0] }),
    playing({ initialCorners: [1, 2, 3] }),
    playing({ initialCorners: [10000, 0, 0, 0] }),
    playing({ userAnswers: ["x", "", "", ""] }),
    playing({ cornerInputs: ["12345", "", "", ""] }),
    playing({ phase: "complete" }),
  ])
    assert.equal(validateDiffyProgress(snapshot), null);
});
