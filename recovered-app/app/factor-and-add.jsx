import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/theme.js";
import FactorEntry from "../components/FactorEntry.jsx";
import FactorEntryFrame from "../components/FactorEntryFrame.jsx";
import FactorFocusCircle from "../components/FactorFocusCircle.jsx";
import NumberUnlockCelebration from "../components/NumberUnlockCelebration.jsx";
import FactorNumberBoard from "../components/FactorNumberBoard.jsx";
import FactorColorControls from "../components/FactorColorControls.jsx";
import FactorNoticing from "../components/FactorNoticing.jsx";
import FactorConjectures from "../components/FactorConjectures.jsx";
import FactorConjectureCard from "../components/FactorConjectureCard.jsx";
import { emptyNoticing, noticeNextExample, currentConjecture } from "../game/factorConjectures.js";
import {
  addConnection,
  startingNumberProgress,
  explorationLimit,
  FACTOR_DIGITS,
  SUM_DIGITS,
  factorsOf,
  factorsToAdd,
  hasAllFactors,
  properFactorSum,
} from "../game/factorAndAdd.js";
import {
  emptyFactorProgress,
  validateFactorProgress,
} from "../game/factorProgress.js";
import { readProgress, writeProgress } from "../utils/progressStorage.js";
import { useProblemTimer } from "../hooks/useProblemTimer.js";
import { useFeatureSettings } from "../hooks/useFeatureSettings.js";
import { awardStar, ensurePracticeRun } from "../utils/practiceStorage.js";
import { newPracticeRunId } from "../game/practiceStars.js";
import AdvanceButton from "../components/AdvanceButton.jsx";
import ActivityHeader from "../components/ActivityHeader.jsx";

export default function FactorAndAddRoute() {
  useFeatureSettings();
  const runId = readProgress('factor-and-add', (value) => value?.practiceRunId);
  return <FactorAndAddScreen key={runId ?? 'initial'} />;
}

function FactorAndAddScreen() {
  const { conjectures: conjecturesEnabled } = useFeatureSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [initialProgress] = useState(
    () =>
      ensurePracticeRun("factor-and-add", readProgress("factor-and-add", validateFactorProgress) ||
      emptyFactorProgress()),
  );
  const [practiceRunId, setPracticeRunId] = useState(initialProgress.practiceRunId);
  const scrollRef = useRef(null);
  const rootRef = useRef(null);
  const focusRef = useRef(null);
  const sumInputRef = useRef(null);
  const sumSubmission = useRef(false);
  const addAnotherRef = useRef(null);
  const unitFactorRef = useRef(null);
  const nodeRefs = useRef({});
  const boardScroll = useRef(0);
  const currentScroll = useRef(0);
  const pendingZoom = useRef(null);
  const animation = useRef(new Animated.Value(0)).current;
  const [zoom, setZoom] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
      animation.stopAnimation();
    };
  }, [animation]);
  const measure = (node) =>
    new Promise((resolve) => {
      if (!node) {
        resolve(null);
        return;
      }
      node.measureInWindow((x, y, width, height) =>
        resolve({ x, y, width, height }),
      );
    });
  const { width, height: viewportHeight } = useWindowDimensions();
  const [visibleHeight, setVisibleHeight] = useState(null);
  useEffect(() => {
    if (Platform.OS !== "web" || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const updateHeight = () => setVisibleHeight(viewport.height);
    updateHeight();
    viewport.addEventListener("resize", updateHeight);
    return () => viewport.removeEventListener("resize", updateHeight);
  }, []);
  const [phase, setPhase] = useState(initialProgress.phase);
  const previousPhase = useRef("choose");
  useEffect(() => {
    if (phase === "choose" || previousPhase.current === "choose") {
      scrollRef.current?.scrollTo({
        y: phase === "choose" ? boardScroll.current : 0,
        animated: false,
      });
    }
    previousPhase.current = phase;
    let active = true;
    // Wait for the new scene and its scroll offset before measuring the shared circle.
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        const pending = pendingZoom.current;
        if (!pending) return;
        let target = await measure(
          phase === "choose"
            ? nodeRefs.current[pending.number]
            : focusRef.current,
        );
        if (
          pending.result &&
          target &&
          target.y + target.height > viewportHeight - 24
        ) {
          const offset = Math.max(
            0,
            currentScroll.current +
              target.y +
              target.height / 2 -
              viewportHeight * 0.6,
          );
          boardScroll.current = offset;
          scrollRef.current?.scrollTo({ y: offset, animated: false });
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          target = await measure(nodeRefs.current[pending.number]);
        }
        const root = await measure(rootRef.current);
        const sourceTarget = pending.source
          ? await measure(nodeRefs.current[pending.source.number])
          : null;
        if (!active) return;
        pendingZoom.current = null;
        if (!target || !root || reduceMotion) {
          setTransitioning(false);
          return;
        }
        const relative = (rect) => ({
          ...rect,
          x: rect.x - root.x,
          y: rect.y - root.y,
        });
        animation.setValue(0);
        setZoom({
          number: pending.number,
          result: pending.result,
          direct: pending.direct,
          source: sourceTarget
            ? {
                number: pending.source.number,
                from: relative(pending.source.from),
                to: relative(sourceTarget),
              }
            : null,
          from: relative(pending.from),
          to: relative(target),
        });
        Animated.timing(animation, {
          toValue: 1,
          duration: pending.result ? 1500 : 650,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (active && finished) {
            setZoom(null);
            setTransitioning(false);
          }
        });
      }),
    );
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [phase]);
  const [chosen, setChosen] = useState(initialProgress.chosen);
  const [selected, setSelected] = useState(initialProgress.selected);
  const [savedFactors, setSavedFactors] = useState(
    initialProgress.savedFactors,
  );
  const [pairs, setPairs] = useState(initialProgress.pairs);
  const [savedPairs, setSavedPairs] = useState(initialProgress.savedPairs);
  const [factorInput, setFactorInput] = useState(initialProgress.factorInput);
  const [pairedInput, setPairedInput] = useState(initialProgress.pairedInput);
  const [entryOpen, setEntryOpen] = useState(initialProgress.entryOpen);
  const [sum, setSum] = useState(initialProgress.sum);
  const [feedback, setFeedback] = useState("");
  const problemTimer = useProblemTimer(
    `${practiceRunId}:${chosen}:${phase === "sum" ? "sum" : `pair-${pairs.length}`}`,
    !transitioning && ((phase === "factors" && entryOpen) || (phase === "sum" && factorsToAdd(chosen, selected).length > 1)),
    phase === "sum"
      ? { type: "addition", label: `${factorsToAdd(chosen, selected).join(" + ")} = ?` }
      : { type: "multiplication", label: `□ × □ = ${chosen}` },
  );
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [boardView, setBoardView] = useState({});
  const [selectedView, setActiveView] = useState("data");
  const activeView = conjecturesEnabled ? selectedView : "data";
  const [headerHeight, setHeaderHeight] = useState(58);
  const [boardHeadingHeight, setBoardHeadingHeight] = useState(44);
  const [connections, setConnections] = useState(initialProgress.connections);
  const [latest, setLatest] = useState(initialProgress.latest);
  const [noticing, setNoticing] = useState(initialProgress.noticing ?? null);
  useEffect(() => {
    if (!conjecturesEnabled) {
      setActiveView("data");
    } else if (!noticing && connections.length > 0) {
      setNoticing(emptyNoticing());
    }
  }, [conjecturesEnabled, noticing, connections.length]);
  const noticingReady = conjecturesEnabled && phase === "choose" && !transitioning && noticing && noticing.stage !== "done" && connections.length > 0;
  const noticingIntro = noticing?.stage === "sizeIntro" || noticing?.stage === "parityIntro";
  const classifying = conjecturesEnabled && (noticing?.stage === "classify" || noticing?.stage === "classified");
  const showNoticing = noticingReady && !noticingIntro && !classifying && noticing.stage !== "awaitingExample" && activeView === "data";
  const showNoticingOnBoard = noticingReady && noticingIntro && activeView === "data";
  const liveConjecture = !conjecturesEnabled ? null : classifying
    ? noticing.conjectures.find(item => item.kind === (noticing.targetKind ?? 'size'))
    : currentConjecture(noticing, connections);
  const showLiveConjecture = liveConjecture && activeView === "data" && !showNoticing && !showNoticingOnBoard;
  function openConjectures() {
    setActiveView("conjectures");
    setConfirmRestart(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }
  useEffect(() => {
    writeProgress("factor-and-add", {
      practiceRunId,
      noticing,
      phase,
      chosen,
      selected,
      pairs,
      savedFactors,
      savedPairs,
      factorInput,
      pairedInput,
      entryOpen,
      sum,
      connections,
      latest,
    });
  }, [
    practiceRunId,
    noticing,
    phase,
    chosen,
    selected,
    pairs,
    savedFactors,
    savedPairs,
    factorInput,
    pairedInput,
    entryOpen,
    sum,
    connections,
    latest,
  ]);
  function startOver() {
    setActiveView("data");
    setNoticing(null);
    setPracticeRunId(newPracticeRunId());
    const empty = emptyFactorProgress();
    pendingZoom.current = null;
    animation.stopAnimation();
    setZoom(null);
    setTransitioning(false);
    boardScroll.current = 0;
    currentScroll.current = 0;
    setChosen(empty.chosen);
    setSelected(empty.selected);
    setPairs(empty.pairs);
    setSavedFactors(empty.savedFactors);
    setSavedPairs(empty.savedPairs);
    setFactorInput(empty.factorInput);
    setPairedInput(empty.pairedInput);
    setSum(empty.sum);
    setEntryOpen(true);
    setConnections(empty.connections);
    setLatest(empty.latest);
    setFeedback("");
    setConfirmRestart(false);
    setBoardView({});
    setPhase(empty.phase);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const boardWidth = Math.min(600, width - 48);
  const circleSize = Math.min(460, width - 48);
  const addends = factorsToAdd(chosen, selected);
  const automaticSum =
    hasAllFactors(chosen, selected) && addends.length === 1 && addends[0] === 1;
  const prompt =
    phase === "choose"
      ? "Pick a number"
      : phase === "factors"
        ? `What are the factors of ${chosen}?`
        : "Now add them!";

  async function selectNumber(number) {
    if (transitioning || explorationLimit(number, connections, savedFactors))
      return;
    sumSubmission.current = false;
    setFeedback("");
    boardScroll.current = currentScroll.current;
    const from = await measure(nodeRefs.current[number]);
    if (from && !reduceMotion) {
      pendingZoom.current = { number, from };
      setTransitioning(true);
    }
    setChosen(number);
    setSelected(savedFactors[number] || []);
    setPairs(savedPairs[number] || []);
    setEntryOpen(!savedPairs[number]?.length);
    setFactorInput("");
    setPairedInput("");
    setSum("");
    setPhase("factors");
  }
  function addFactor(submittedPair) {
    const pair = Array.isArray(submittedPair) ? submittedPair : [factorInput, pairedInput];
    if (
      pair.some(
        (value) =>
          !/^\d+$/.test(value) ||
          Number(value) < 1 ||
          !Number.isSafeInteger(Number(value)) ||
          Number(value) > chosen,
      )
    ) {
      setFeedback(`Enter 1–${chosen} in both boxes.`);
      return;
    }
    const values = pair.map(Number);
    if (values[0] * values[1] !== chosen) {
      setFeedback(`The pair should multiply to ${chosen}.`);
      return;
    }
    if (values.every((factor) => selected.includes(factor))) {
      setFeedback("Already added.");
      return;
    }
    const nextSelected = [...new Set([...selected, ...values])];
    const eventId = `${practiceRunId}:factor:${chosen}:${[...values].sort((a, b) => a - b).join("x")}`;
    awardStar(eventId, "multiplication", values, chosen, problemTimer.finish(eventId));
    const complete = hasAllFactors(chosen, nextSelected);
    if (complete) Keyboard.dismiss();
    setEntryOpen(!complete);
    setSelected(nextSelected);
    setPairs((previous) => [...previous, values]);
    setFactorInput("");
    setPairedInput("");
    setFeedback("");
  }
  function saveFactors() {
    setSavedPairs((previous) => ({ ...previous, [chosen]: pairs }));
    setSavedFactors((previous) => ({
      ...previous,
      [chosen]: [...selected],
    }));
  }
  async function returnToBoard() {
    if (transitioning) return;
    saveFactors();
    const from = await measure(focusRef.current);
    if (from && !reduceMotion) {
      pendingZoom.current = { number: chosen, from };
      setTransitioning(true);
    }
    Keyboard.dismiss();
    setFeedback("");
    setPhase("choose");
  }
  function finishFactors() {
    if (!hasAllFactors(chosen, selected)) {
      const expected = factorsOf(chosen);
      setFeedback(
        selected.some((value) => !expected.includes(value))
          ? "Check your factors."
          : "There are more factors to find.",
      );
      return;
    }
    if (automaticSum) {
      finishSum(1, true);
      return;
    }
    saveFactors();
    setFeedback("");
    setPhase("sum");
  }
  async function finishSum(automaticTotal, direct = false) {
    const answer =
      typeof automaticTotal === "number" ? String(automaticTotal) : sum;
    if (transitioning || sumSubmission.current) return;
    if (!/^\d+$/.test(answer)) {
      setFeedback("Enter a whole number.");
      return;
    }
    const total = Number(answer);
    if (!hasAllFactors(chosen, selected)) {
      setFeedback("Check your factors first.");
      return;
    }
    if (total !== properFactorSum(chosen)) {
      setFeedback("Check your sum.");
      return;
    }
    sumSubmission.current = true;
    if (!automaticSum && !direct) {
      const eventId = `${practiceRunId}:sum:${chosen}`;
      awardStar(eventId, "addition", addends, total, problemTimer.finish(eventId));
    }
    const [from, sourceCircle] = await Promise.all([
      measure(direct ? unitFactorRef.current : sumInputRef.current),
      measure(focusRef.current),
    ]);
    if (from && !reduceMotion) {
      pendingZoom.current = {
        number: total,
        from,
        result: true,
        direct,
        source:
          sourceCircle && total !== chosen
            ? { number: chosen, from: sourceCircle }
            : null,
      };
      animation.setValue(0);
      setTransitioning(true);
    }
    boardScroll.current = 0;
    saveFactors();
    Keyboard.dismiss();
    setFeedback("");
    const edge = { from: chosen, to: total };
    if (conjecturesEnabled) {
      if (!noticing) setNoticing(emptyNoticing());
      else setNoticing((current) => noticeNextExample(current, edge, addConnection(connections, chosen, total)));
    }
    setConnections((previous) => addConnection(previous, chosen, total));
    setLatest(edge);
    setPhase("choose");
  }
  useEffect(() => {
    if (phase !== "sum" || !automaticSum) return;
    setSum("1");
    // Let the existing factor-to-sum animation finish before returning to the graph.
    const timer = setTimeout(() => finishSum(1), reduceMotion ? 0 : 1750);
    return () => clearTimeout(timer);
  }, [phase, chosen, automaticSum, reduceMotion]);

  function previousStep() {
    if (transitioning) return;
    Keyboard.dismiss();
    setFeedback("");
    if (phase === "sum") setPhase("factors");
    else if (phase === "factors") returnToBoard();
    else if (activeView === "conjectures") {
      setActiveView("data");
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
    else router.canGoBack() ? router.back() : router.replace("/");
  }

  return (
    <SafeAreaView
      ref={rootRef}
      collapsable={false}
      style={[styles.container, visibleHeight !== null && { height: visibleHeight, maxHeight: visibleHeight }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            currentScroll.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          scrollEnabled={phase === "choose" && !transitioning}
          contentContainerStyle={[styles.content, phase !== "choose" && styles.entryContent]}
          keyboardShouldPersistTaps="handled"
        >
          <ActivityHeader title={activeView === "conjectures" ? "Conjectures" : "Factor and Add"}
            backLabel={activeView === "conjectures" ? "Back to exploring" : "Back"} onBack={previousStep} disabled={transitioning}
            onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            {phase === "choose" && !showNoticing && activeView === "data" ? (close) => <>
              <FactorColorControls value={boardView} onChange={setBoardView} disabled={transitioning} />
              {(connections.length > 0 || Object.keys(savedFactors).length > 0) && (
                confirmRestart ? <>
                  <Text style={styles.caption}>Clear this graph and start over?</Text>
                  <Pressable accessibilityRole="button" style={styles.menuAction} disabled={transitioning} onPress={() => { startOver(); close(); }}><Text style={{ color: Colors.orange }}>Start over</Text></Pressable>
                  <Pressable accessibilityRole="button" style={styles.menuAction} disabled={transitioning} onPress={() => setConfirmRestart(false)}><Text style={styles.back}>Cancel</Text></Pressable>
                </> : <Pressable accessibilityRole="button" style={styles.menuAction} disabled={transitioning} onPress={() => setConfirmRestart(true)}><Text style={styles.back}>Start over</Text></Pressable>
              )}
            </> : null}
          </ActivityHeader>
          <View style={styles.heading} onLayout={(event) => {
            if (phase === "choose") setBoardHeadingHeight(event.nativeEvent.layout.height);
          }}>
            {showLiveConjecture && <FactorConjectureCard value={noticing} conjecture={liveConjecture} connections={connections}
              ready={phase === "choose" && !transitioning} onChange={setNoticing} reduceMotion={reduceMotion}
              onOpen={phase === "choose" && !transitioning && !classifying ? openConjectures : undefined} />}
            {phase === "choose" && !showNoticing && (
              <>
                {conjecturesEnabled && !showLiveConjecture && activeView === "data" && !showNoticingOnBoard && noticing?.conjectures.length > 0 && (
                  <View style={styles.conjectureShortcut}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Open conjectures" disabled={transitioning}
                      style={styles.conjectureButton} onPress={openConjectures}>
                      <Text style={styles.conjectureMark}>!</Text>
                    </Pressable>
                  </View>
                )}
                {showNoticingOnBoard && (
                  <View style={{ marginBottom: 12 }}>
                    <FactorNoticing edge={connections[0]} value={noticing} onChange={setNoticing} />
                  </View>
                )}
              </>
            )}
            {phase === "choose" && activeView === "data" &&
              connections.length === 0 &&
              Object.keys(savedFactors).length === 0 && (
                <Text
                  accessibilityRole="header"
                  accessibilityLiveRegion="polite"
                  style={styles.prompt}
                >
                  {prompt}
                </Text>
              )}
          </View>
          {showNoticing && (
            <FactorNoticing edge={connections[0]} value={noticing} onChange={setNoticing} />
          )}
          {phase === "choose" && !showNoticing && activeView === "conjectures" && (
            <FactorConjectures conjectures={noticing?.conjectures ?? []} connections={connections}
              />
          )}
          {phase === "choose" && !showNoticing && activeView === "data" && (
            <Animated.View
              style={{
                opacity: transitioning
                  ? animation.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 0, 1],
                    })
                  : 1,
              }}
            >
              <FactorNumberBoard
                view={boardView}
                width={boardWidth}
                availableHeight={viewportHeight - insets.top - insets.bottom - 110 - headerHeight - boardHeadingHeight}
                phase={phase}
                chosen={chosen}
                selected={selected}
                connections={connections}
                latest={latest}
                onNumberPress={selectNumber}
                savedFactors={savedFactors}
                nodeRefs={nodeRefs}
              />
            </Animated.View>
          )}
          {phase !== "choose" && (
            <FactorEntryFrame size={circleSize} hidden={transitioning} reduceMotion={reduceMotion}>
              <FactorFocusCircle
                ref={focusRef}
                number={chosen}
                showNumber={false}
                factors={[]}
                size={circleSize}
                onRemove={
                  phase === "factors"
                    ? (factor) => {
                        setSelected((previous) =>
                          previous.filter((value) => value !== factor),
                        );
                        setFeedback("");
                      }
                    : undefined
                }
              >
                <FactorEntry
                  transitioning={transitioning}
                  circleSize={circleSize}
                  entryOpen={entryOpen}
                  addAnother={addAnotherRef}
                  sumInputRef={sumInputRef}
                  unitFactorRef={unitFactorRef}
                  automaticSum={automaticSum}
                  factors={selected}
                  pairs={pairs}
                  number={chosen}
                  summing={phase === "sum"}
                  prompt={`What are the factors of ${chosen}?`}
                  pairedValue={pairedInput}
                  onPairedChange={(value) => {
                    if (/^\d*$/.test(value) && value.length <= FACTOR_DIGITS) {
                      setPairedInput(value);
                      setFeedback("");
                    }
                  }}
                  value={phase === "sum" ? sum : factorInput}
                  onChange={(value) => {
                    if (
                      /^\d*$/.test(value) &&
                      value.length <=
                        (phase === "sum" ? SUM_DIGITS : FACTOR_DIGITS)
                    ) {
                      if (phase === "sum") {
                        setSum(value);
                        if (value && Number(value) === properFactorSum(chosen)) {
                          finishSum(Number(value));
                        }
                      } else setFactorInput(value);
                      setFeedback("");
                    }
                  }}
                  onAdd={phase === "sum" ? finishSum : addFactor}
                  onRemove={(factor) => {
                    setSelected((previous) =>
                      previous.filter((value) => value !== factor),
                    );
                    setFeedback("");
                  }}
                  reduceMotion={reduceMotion}
                />
              </FactorFocusCircle>
            </FactorEntryFrame>
          )}
          {phase === "factors" && !entryOpen && (
            <View
              style={[styles.actions, { width: 260, maxWidth: "100%", gap: 8 }]}
            >
              {!hasAllFactors(chosen, selected) && <Pressable
                ref={addAnotherRef}
                accessibilityRole="button"
                disabled={transitioning}
                onPress={() => {
                  setEntryOpen(true);
                  setFeedback("");
                }}
                style={styles.choice}
              >
                <Text style={styles.choiceText}>Add another factor pair</Text>
              </Pressable>}
              <AdvanceButton enterEnabled={hasAllFactors(chosen, selected)}
                accessibilityRole="button"
                disabled={transitioning}
                onPress={finishFactors}
                style={styles.choice}
              >
                <Text style={styles.choiceText}>That's all the factors</Text>
              </AdvanceButton>
            </View>
          )}
          {!!feedback && (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={styles.feedback}
            >
              {feedback}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {transitioning && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {zoom?.source && (
            <Animated.View
              style={{
                position: "absolute",
                left: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.source.from.x,
                    zoom.direct
                      ? zoom.source.from.x +
                        (zoom.source.to.x - zoom.source.from.x) * 0.3
                      : zoom.source.from.x,
                    zoom.source.to.x,
                  ],
                }),
                top: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.source.from.y,
                    zoom.direct
                      ? zoom.source.from.y +
                        (zoom.source.to.y - zoom.source.from.y) * 0.3
                      : zoom.source.from.y,
                    zoom.source.to.y,
                  ],
                }),
                width: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.source.from.width,
                    zoom.direct
                      ? zoom.source.from.width +
                        (zoom.source.to.width - zoom.source.from.width) * 0.3
                      : zoom.source.from.width,
                    zoom.source.to.width,
                  ],
                }),
                height: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.source.from.height,
                    zoom.direct
                      ? zoom.source.from.height +
                        (zoom.source.to.height - zoom.source.from.height) * 0.3
                      : zoom.source.from.height,
                    zoom.source.to.height,
                  ],
                }),
                borderRadius: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    zoom.source.from.width / 2,
                    zoom.source.to.width / 2,
                  ],
                }),
                opacity: animation.interpolate({
                  inputRange: [0, 0.3, 0.8, 1],
                  outputRange: [1, 1, 1, 0],
                }),
                borderWidth: 2,
                borderColor: Colors.teal,
                backgroundColor: Colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: 20,
                  fontWeight: "700",
                  opacity: animation.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 0, 1],
                  }),
                }}
              >
                {zoom.source.number}
              </Animated.Text>
            </Animated.View>
          )}
          {zoom && (
            <Animated.View
              style={{
                position: "absolute",
                left: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.from.x,
                    zoom.direct
                      ? zoom.from.x + (zoom.to.x - zoom.from.x) * 0.3
                      : zoom.result
                        ? zoom.from.x + (zoom.from.width - 96) / 2
                        : zoom.from.x,
                    zoom.to.x,
                  ],
                }),
                top: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.from.y,
                    zoom.direct
                      ? zoom.from.y + (zoom.to.y - zoom.from.y) * 0.3
                      : zoom.result
                        ? zoom.from.y + (zoom.from.height - 96) / 2
                        : zoom.from.y,
                    zoom.to.y,
                  ],
                }),
                width: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.from.width,
                    zoom.direct
                      ? zoom.from.width +
                        (zoom.to.width - zoom.from.width) * 0.3
                      : zoom.result
                        ? 96
                        : zoom.from.width,
                    zoom.to.width,
                  ],
                }),
                height: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.from.height,
                    zoom.direct
                      ? zoom.from.height +
                        (zoom.to.height - zoom.from.height) * 0.3
                      : zoom.result
                        ? 96
                        : zoom.from.height,
                    zoom.to.height,
                  ],
                }),
                borderRadius: animation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [
                    zoom.result ? 14 : zoom.from.width / 2,
                    zoom.direct
                      ? 14 + (zoom.to.width / 2 - 14) * 0.3
                      : zoom.result
                        ? 48
                        : zoom.from.width / 2,
                    zoom.to.width / 2,
                  ],
                }),
                borderWidth: 2,
                borderColor: Colors.teal,
                backgroundColor: Colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.Text
                style={{
                  color: Colors.textPrimary,
                  fontWeight: "800",
                  fontSize: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: zoom.result
                      ? [20, 17]
                      : phase === "choose"
                        ? [48, 17]
                        : [17, 48],
                  }),
                }}
              >
                {zoom.number}
              </Animated.Text>
            </Animated.View>
          )}
        </View>
      )}
      <NumberUnlockCelebration unlockedThrough={startingNumberProgress(connections).last}
        ready={phase === "choose" && !transitioning && activeView === "data" && !showNoticing}
        reduceMotion={reduceMotion} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  choice: {
    width: "100%",
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: {
    color: Colors.teal,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  entryContent: {
    height: "100%",
    paddingBottom: 12,
  },
  menuAction: { minHeight: 44, justifyContent: "center" },
  back: {
    color: Colors.teal,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  conjectureShortcut: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  conjectureButton: { minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.teal },
  conjectureMark: { color: Colors.lightTeal, fontSize: 26, fontWeight: "700" },
  heading: { width: "100%", maxWidth: 600 },
  caption: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  prompt: {
    color: Colors.textPrimary,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "700",
    marginBottom: 8,
  },
  focusPrompt: {
    color: Colors.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 12,
  },
  latest: { color: Colors.gold, fontSize: 14, marginBottom: 6 },
  actions: {
    alignItems: "center",
    width: "100%",
    maxWidth: 600,
    gap: 12,
    marginTop: 20,
  },
  selection: { color: Colors.teal, fontSize: 15, textAlign: "center" },
  primary: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
  },
  secondaryAction: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.teal,
  },
  primaryText: { color: Colors.background, fontSize: 16, fontWeight: "800" },
  sumPanel: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
  },
  equation: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  sumInput: {
    width: 180,
    borderWidth: 2,
    borderColor: Colors.teal,
    borderRadius: 18,
    padding: 10,
    fontSize: 22,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    textAlign: "center",
  },
  feedback: {
    color: Colors.textError,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 18,
    maxWidth: 600,
  },
  connections: { width: "100%", maxWidth: 600, marginTop: 24, gap: 10 },
  connectionList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  connection: {
    color: Colors.teal,
    fontSize: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
