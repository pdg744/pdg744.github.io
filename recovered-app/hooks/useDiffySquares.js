import { useCallback, useEffect, useRef, useState } from "react";
import { TOTAL_DRAW_MS } from "../components/DiffySquaresViz";
import {
  EMPTY_ANSWERS,
  EMPTY_STATES,
  buildGenerations,
  checkAnswer,
  correctDifference,
} from "../game/diffy";
export { correctDifference } from "../game/diffy";
export function useDiffySquares() {
  const [phase, setPhase] = useState("input");
  const [generations, setGenerations] = useState([]);
  const [currentGenIndex, setCurrentGenIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(EMPTY_ANSWERS);
  const [answerStates, setAnswerStates] = useState(EMPTY_STATES);
  const [skipIntroAnimation, setSkipIntroAnimation] = useState(false);
  const completionTimer = useRef(null);
  const clearCompletion = useCallback(() => {
    clearTimeout(completionTimer.current);
    completionTimer.current = null;
  }, []);
  useEffect(() => clearCompletion, [clearCompletion]);
  const resetAnswers = useCallback(() => {
    setUserAnswers(EMPTY_ANSWERS);
    setAnswerStates(EMPTY_STATES);
  }, []);
  const start = useCallback(
    (corners) => {
      clearCompletion();
      const next = buildGenerations(corners);
      setGenerations(next);
      setCurrentGenIndex(0);
      resetAnswers();
      setSkipIntroAnimation(false);
      // The exported original got stuck when all four starting numbers were zero.
      setPhase(next.length === 1 ? "complete" : "playing");
    },
    [clearCompletion, resetAnswers],
  );
  const setAnswer = useCallback((side, text, corners, _generation, states) => {
    const { value, state } = checkAnswer(
      text,
      correctDifference(corners, side),
    );
    setUserAnswers((previous) =>
      previous.map((answer, index) => (index === side ? value : answer)),
    );
    setAnswerStates((previous) =>
      previous.map((answer, index) => (index === side ? state : answer)),
    );
    const updated = states.map((answer, index) =>
      index === side ? state : answer,
    );
    return {
      isCorrect: state === "correct",
      allCorrect: updated.every((answer) => answer === "correct"),
    };
  }, []);
  const advanceGeneration = useCallback(
    (generation, total) => {
      const next = generation + 1;
      setCurrentGenIndex(next);
      clearCompletion();
      if (next >= total - 1)
        completionTimer.current = setTimeout(
          () => setPhase("complete"),
          TOTAL_DRAW_MS,
        );
    },
    [clearCompletion],
  );
  const reset = useCallback(() => {
    clearCompletion();
    setSkipIntroAnimation(true);
    setPhase("input");
    setGenerations([]);
    setCurrentGenIndex(0);
    resetAnswers();
  }, [clearCompletion, resetAnswers]);
  return {
    phase,
    currentCorners: generations[currentGenIndex] ?? null,
    initialCorners: generations[0] ?? null,
    currentGenIndex,
    totalGens: generations.length,
    totalSteps: Math.max(0, generations.length - 1),
    userAnswers,
    answerStates,
    confirmedGenerations: generations.slice(0, currentGenIndex + 1),
    isLastGen: currentGenIndex >= generations.length - 1,
    skipIntroAnimation,
    start,
    setAnswer,
    advanceGeneration,
    resetAnswers,
    reset,
  };
}
