import { useCallback, useEffect, useRef, useState } from "react";
import { TOTAL_DRAW_MS } from "../components/DiffySquaresViz";
import {
  EMPTY_ANSWERS,
  EMPTY_STATES,
  buildGenerations,
  checkAnswer,
  correctDifference,
} from "../game/diffy";
import { validateDiffyProgress } from "../game/diffyProgress.js";
import { readProgress, writeProgress } from "../utils/progressStorage.js";
export { correctDifference } from "../game/diffy";
export function useDiffySquares() {
  const [saved] = useState(() =>
    readProgress("diffy-squares", validateDiffyProgress),
  );
  const [restored, setRestored] = useState(Boolean(saved));
  const [cornerInputs, setCornerInputs] = useState(
    saved?.cornerInputs ?? EMPTY_ANSWERS,
  );
  const [phase, setPhase] = useState(saved?.phase ?? "input");
  const [generations, setGenerations] = useState(() =>
    saved?.initialCorners ? buildGenerations(saved.initialCorners) : [],
  );
  const [currentGenIndex, setCurrentGenIndex] = useState(
    saved?.currentGenIndex ?? 0,
  );
  const [userAnswers, setUserAnswers] = useState(
    saved?.userAnswers ?? EMPTY_ANSWERS,
  );
  const [answerStates, setAnswerStates] = useState(() =>
    saved?.phase === "playing"
      ? saved.userAnswers.map(
          (answer, side) =>
            checkAnswer(
              answer,
              correctDifference(
                buildGenerations(saved.initialCorners)[saved.currentGenIndex],
                side,
              ),
            ).state,
        )
      : EMPTY_STATES,
  );
  const [skipIntroAnimation, setSkipIntroAnimation] = useState(Boolean(saved));
  useEffect(() => {
    writeProgress("diffy-squares", {
      phase,
      cornerInputs,
      initialCorners: generations[0] ?? null,
      currentGenIndex,
      userAnswers,
    });
  }, [phase, cornerInputs, generations, currentGenIndex, userAnswers]);
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
      setRestored(false);
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
      if (generation !== currentGenIndex || generation >= total - 1) return;
      setRestored(false);
      resetAnswers();
      const next = generation + 1;
      setCurrentGenIndex(next);
      clearCompletion();
      if (next >= total - 1)
        completionTimer.current = setTimeout(
          () => setPhase("complete"),
          TOTAL_DRAW_MS,
        );
    },
    [clearCompletion, currentGenIndex, resetAnswers],
  );
  const reset = useCallback(
    (drafts = EMPTY_ANSWERS) => {
      setCornerInputs(drafts);
      setRestored(false);
      clearCompletion();
      setSkipIntroAnimation(true);
      setPhase("input");
      setGenerations([]);
      setCurrentGenIndex(0);
      resetAnswers();
    },
    [clearCompletion, resetAnswers],
  );
  return {
    restored,
    cornerInputs,
    setCornerInputs,
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
