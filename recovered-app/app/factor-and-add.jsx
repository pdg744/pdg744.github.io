import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/theme.js";
import FactorEntry from "../components/FactorEntry.jsx";
import FactorFocusCircle from "../components/FactorFocusCircle.jsx";
import FactorNumberBoard from "../components/FactorNumberBoard.jsx";
import {
  addConnection,
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
import logoAsset from "../assets/logo-mark.png";

export default function FactorAndAddScreen() {
  const router = useRouter();
  const [initialProgress] = useState(
    () =>
      readProgress("factor-and-add", validateFactorProgress) ||
      emptyFactorProgress(),
  );
  const scrollRef = useRef(null);
  const rootRef = useRef(null);
  const focusRef = useRef(null);
  const sumInputRef = useRef(null);
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
  const [sum, setSum] = useState(initialProgress.sum);
  const [feedback, setFeedback] = useState("");
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [connections, setConnections] = useState(initialProgress.connections);
  const [latest, setLatest] = useState(initialProgress.latest);
  useEffect(() => {
    writeProgress("factor-and-add", {
      phase,
      chosen,
      selected,
      pairs,
      savedFactors,
      savedPairs,
      factorInput,
      pairedInput,
      sum,
      connections,
      latest,
    });
  }, [
    phase,
    chosen,
    selected,
    pairs,
    savedFactors,
    savedPairs,
    factorInput,
    pairedInput,
    sum,
    connections,
    latest,
  ]);
  function startOver() {
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
    setConnections(empty.connections);
    setLatest(empty.latest);
    setFeedback("");
    setConfirmRestart(false);
    setPhase(empty.phase);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const boardWidth = Math.min(600, width - 48);
  const circleSize = Math.min(460, width - 24);
  const nextEnabled = !transitioning && selected.length > 0;
  const nextPrimary =
    nextEnabled && selected.length > 0 && !factorInput && !pairedInput;
  const addends = factorsToAdd(chosen, selected);
  const automaticSum =
    hasAllFactors(chosen, selected) && addends.length === 1 && addends[0] === 1;
  const prompt =
    phase === "choose"
      ? "Pick a number · 2–30"
      : phase === "factors"
        ? `What are the factors of ${chosen}?`
        : "Add the factors.";

  async function selectNumber(number) {
    if (transitioning || explorationLimit(number, connections, savedFactors))
      return;
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
    setFactorInput("");
    setPairedInput("");
    setSum("");
    setPhase("factors");
  }
  function addFactor() {
    const pair = [factorInput, pairedInput];
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
    setSelected((previous) => [...new Set([...previous, ...values])]);
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
          : "Some factors are missing.",
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
    if (transitioning) return;
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
    else router.canGoBack() ? router.back() : router.replace("/topics");
  }

  return (
    <SafeAreaView ref={rootRef} collapsable={false} style={styles.container}>
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
          scrollEnabled={!transitioning}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={previousStep}
              disabled={transitioning}
            >
              <Text style={styles.back}>← Back</Text>
            </Pressable>
            <Image source={logoAsset} style={styles.logo} />
          </View>
          <View style={styles.heading}>
            {phase === "choose" && (
              <Text style={styles.title}>Factor and Add</Text>
            )}
            {phase === "choose" &&
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
          {phase === "choose" && (
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
                width={boardWidth}
                availableHeight={viewportHeight - 160}
                phase={phase}
                chosen={chosen}
                selected={selected}
                connections={connections}
                latest={latest}
                onNumberPress={selectNumber}
                savedFactors={savedFactors}
                nodeRefs={nodeRefs}
              />
              {(connections.length > 0 ||
                Object.keys(savedFactors).length > 0) && (
                <View style={{ alignItems: "center", marginTop: 24 }}>
                  {confirmRestart ? (
                    <>
                      <Text
                        style={{
                          color: Colors.textSecondary,
                          textAlign: "center",
                        }}
                      >
                        Clear this graph and start over?
                      </Text>
                      <View
                        style={{ flexDirection: "row", gap: 24, marginTop: 8 }}
                      >
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setConfirmRestart(false)}
                          style={{ padding: 12 }}
                        >
                          <Text style={{ color: Colors.textSecondary }}>
                            Cancel
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={startOver}
                          disabled={transitioning}
                          style={{ padding: 12 }}
                        >
                          <Text style={{ color: Colors.orange }}>
                            Start over
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setConfirmRestart(true)}
                      disabled={transitioning}
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: Colors.textSecondary }}>
                        Start over
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </Animated.View>
          )}
          {phase !== "choose" && (
            <View style={{ marginTop: 20, opacity: transitioning ? 0 : 1 }}>
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
                  circleSize={circleSize}
                  sumInputRef={sumInputRef}
                  unitFactorRef={unitFactorRef}
                  automaticSum={automaticSum}
                  factors={selected}
                  pairs={pairs}
                  onRemovePair={(index) => {
                    const remaining = pairs.filter((_, i) => i !== index);
                    setPairs(remaining);
                    setSelected([...new Set(remaining.flat())]);
                    setFeedback("");
                  }}
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
                      if (phase === "sum") setSum(value);
                      else setFactorInput(value);
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
            </View>
          )}
          {phase === "factors" && (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={!nextEnabled}
                style={[
                  styles.primary,
                  !nextPrimary && styles.secondaryAction,
                  !nextEnabled && { opacity: 0.4 },
                ]}
                onPress={finishFactors}
              >
                <Text
                  style={[
                    styles.primaryText,
                    !nextPrimary && { color: Colors.teal },
                  ]}
                >
                  Next →
                </Text>
              </Pressable>
            </View>
          )}
          {phase === "sum" && !automaticSum && (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={!sum || transitioning}
                style={[
                  styles.primary,
                  (!sum || transitioning) && styles.secondaryAction,
                ]}
                onPress={finishSum}
              >
                <Text
                  style={[styles.primaryText, !sum && { color: Colors.teal }]}
                >
                  Connect →
                </Text>
              </Pressable>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    width: "100%",
    maxWidth: 600,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  logo: { width: 58, height: 58 },
  back: {
    color: Colors.teal,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
  },
  heading: { width: "100%", maxWidth: 600 },
  title: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
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
