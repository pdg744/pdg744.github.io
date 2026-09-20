import { buildGenerations, checkAnswer, correctDifference } from "./diffy.js";
import { validPracticeRunId } from "./practiceStars.js";

const four = (value, valid) =>
  Array.isArray(value) && value.length === 4 && value.every(valid);
const draft = (value) =>
  typeof value === "string" && /^[0-9]{0,4}$/.test(value);

// Store mathematical progress, never animation state. Rebuild derived values on
// restore and settle a fully answered level if refresh interrupted its transition.
export function validateDiffyProgress(data) {
  if (
    !data ||
    !["input", "playing", "complete"].includes(data.phase) ||
    !four(data.cornerInputs, draft)
  )
    return null;
  if (data.phase === "input")
    return {
      phase: "input",
      cornerInputs: [...data.cornerInputs],
      initialCorners: null,
      currentGenIndex: 0,
      userAnswers: ["", "", "", ""],
      ...(validPracticeRunId(data.practiceRunId) ? { practiceRunId: data.practiceRunId } : {}),
    };
  if (
    !four(
      data.initialCorners,
      (value) => Number.isInteger(value) && value >= 0 && value <= 9999,
    ) ||
    !Number.isInteger(data.currentGenIndex) ||
    data.currentGenIndex < 0 ||
    !four(data.userAnswers, draft)
  )
    return null;
  const generations = buildGenerations(data.initialCorners);
  let currentGenIndex = data.currentGenIndex;
  if (
    currentGenIndex >= generations.length ||
    (data.phase === "complete" && currentGenIndex !== generations.length - 1)
  )
    return null;
  let userAnswers = [...data.userAnswers];
  if (
    currentGenIndex < generations.length - 1 &&
    userAnswers.every(
      (answer, side) =>
        checkAnswer(
          answer,
          correctDifference(generations[currentGenIndex], side),
        ).state === "correct",
    )
  ) {
    currentGenIndex += 1;
    userAnswers = ["", "", "", ""];
  }
  const phase =
    currentGenIndex === generations.length - 1 ? "complete" : "playing";
  return {
    phase,
    cornerInputs: [...data.cornerInputs],
    initialCorners: [...data.initialCorners],
    currentGenIndex,
    userAnswers: phase === "complete" ? ["", "", "", ""] : userAnswers,
    ...(validPracticeRunId(data.practiceRunId) ? { practiceRunId: data.practiceRunId } : {}),
  };
}
