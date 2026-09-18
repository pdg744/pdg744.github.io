// Rules recovered from Metro module 697, separated from animation and React.
export const EMPTY_ANSWERS = ["", "", "", ""];
export const EMPTY_STATES = ["empty", "empty", "empty", "empty"];
export function correctDifference(corners, side) {
  return Math.abs(corners[side] - corners[(side + 1) % 4]);
}
export function nextGeneration(corners) {
  return corners.map((_, side) => correctDifference(corners, side));
}
export function isZero(corners) {
  return corners.every((value) => value === 0);
}
export function buildGenerations(corners) {
  if (
    corners.length !== 4 ||
    corners.some(
      (value) => !Number.isInteger(value) || value < 0 || value > 9999,
    )
  ) {
    throw new RangeError("Choose four whole numbers from 0 to 9999.");
  }
  const generations = [[...corners]];
  while (!isZero(generations.at(-1))) {
    if (generations.length >= 100)
      throw new Error(
        "The sequence did not reach zero within 100 generations.",
      );
    generations.push(nextGeneration(generations.at(-1)));
  }
  return generations;
}
export function checkAnswer(text, expected) {
  const value = text.replace(/[^0-9]/g, "");
  let state = "empty";
  if (value.length > 0) {
    if (Number.parseInt(value, 10) === expected) state = "correct";
    else if (value.length >= String(expected).length) state = "incorrect";
  }
  return {
    value,
    state,
  };
}
