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
  Switch,
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
  factorsOf,
  factorsToAdd,
  hasAllFactors,
  properFactorSum,
} from "../game/factorAndAdd.js";
import logoAsset from "../assets/logo-mark.png";

export default function FactorAndAddScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const rootRef = useRef(null);
  const focusRef = useRef(null);
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
  const { width } = useWindowDimensions();
  const [phase, setPhase] = useState("choose");
  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: phase === "choose" ? boardScroll.current : 0,
      animated: false,
    });
    let active = true;
    // Wait for the new scene and its scroll offset before measuring the shared circle.
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        const pending = pendingZoom.current;
        if (!pending) return;
        const target = await measure(
          phase === "choose"
            ? nodeRefs.current[pending.number]
            : focusRef.current,
        );
        const root = await measure(rootRef.current);
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
          from: relative(pending.from),
          to: relative(target),
        });
        Animated.timing(animation, {
          toValue: 1,
          duration: 420,
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
  const [chosen, setChosen] = useState(null);
  const [selected, setSelected] = useState([]);
  const [savedFactors, setSavedFactors] = useState({});
  const [factorInput, setFactorInput] = useState("");
  const [enforce, setEnforce] = useState(true);
  const [sum, setSum] = useState("");
  const [feedback, setFeedback] = useState("");
  const [connections, setConnections] = useState([]);
  const [latest, setLatest] = useState(null);
  const boardWidth = Math.min(600, width - 48);
  const addends = factorsToAdd(chosen, selected);
  const prompt =
    phase === "choose"
      ? "Pick a number · 2–30"
      : phase === "factors"
        ? `What are the factors of ${chosen}?`
        : "Add the factors.";

  async function selectNumber(number) {
    if (transitioning) return;
    setFeedback("");
    boardScroll.current = currentScroll.current;
    const from = await measure(nodeRefs.current[number]);
    if (from && !reduceMotion) {
      pendingZoom.current = { number, from };
      setTransitioning(true);
    }
    setChosen(number);
    setSelected(savedFactors[number] || []);
    setFactorInput("");
    setSum("");
    setPhase("factors");
  }
  function addFactor() {
    const factor = Number(factorInput);
    if (!/^\d+$/.test(factorInput) || factor < 1 || factor > 30) {
      setFeedback("Enter 1–30.");
      return;
    }
    if (selected.includes(factor)) {
      setFeedback("Already added.");
      return;
    }
    setSelected((previous) => [...previous, factor]);
    setFactorInput("");
    setFeedback("");
  }
  function saveFactors() {
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
    if (enforce && !hasAllFactors(chosen, selected)) {
      const expected = factorsOf(chosen);
      setFeedback(
        selected.some((value) => !expected.includes(value))
          ? "Check your factors."
          : "Some factors are missing.",
      );
      return;
    }
    saveFactors();
    setFeedback("");
    setPhase("sum");
  }
  async function finishSum() {
    if (!/^\d+$/.test(sum)) {
      setFeedback("Enter a whole number.");
      return;
    }
    const total = Number(sum);
    if (enforce && !hasAllFactors(chosen, selected)) {
      setFeedback("Check your factors first.");
      return;
    }
    if (enforce && total !== properFactorSum(chosen)) {
      setFeedback("Check your sum.");
      return;
    }
    const edge = { from: chosen, to: total };
    setConnections((previous) => addConnection(previous, chosen, total));
    setLatest(edge);
    await returnToBoard();
  }
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
            <View style={styles.mode}>
              <Text style={styles.modeLabel}>Check answers</Text>
              <Switch
                accessibilityLabel="Check answers"
                accessibilityHint="When off, incorrect factors and sums are allowed."
                value={enforce}
                onValueChange={(value) => {
                  setEnforce(value);
                  setFeedback("");
                }}
                trackColor={{ false: Colors.border, true: Colors.teal }}
                thumbColor={Colors.textPrimary}
              />
            </View>
            {phase === "choose" && (
              <Text
                accessibilityRole="header"
                accessibilityLiveRegion="polite"
                style={styles.prompt}
              >
                {prompt}
              </Text>
            )}
            {phase === "choose" && latest && (
              <Text accessibilityLiveRegion="polite" style={styles.latest}>
                {latest.from} → {latest.to}
              </Text>
            )}
          </View>
          {phase === "choose" && (
            <FactorNumberBoard
              width={boardWidth}
              phase={phase}
              chosen={chosen}
              selected={selected}
              connections={connections}
              latest={latest}
              onNumberPress={selectNumber}
              savedFactors={savedFactors}
              nodeRefs={nodeRefs}
            />
          )}
          {phase !== "choose" && (
            <View style={{ marginTop: 20, opacity: transitioning ? 0 : 1 }}>
              <FactorFocusCircle
                ref={focusRef}
                number={chosen}
                factors={[]}
                size={Math.min(boardWidth, 400)}
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
                  factors={selected}
                  number={chosen}
                  summing={phase === "sum"}
                  prompt={`What are the factors of ${chosen}?`}
                  value={phase === "sum" ? sum : factorInput}
                  onChange={(value) => {
                    if (/^\d*$/.test(value)) {
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
                style={styles.primary}
                onPress={finishFactors}
              >
                <Text style={styles.primaryText}>Next →</Text>
              </Pressable>
            </View>
          )}
          {phase === "sum" && (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                style={styles.primary}
                onPress={finishSum}
              >
                <Text style={styles.primaryText}>Connect →</Text>
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
          {phase === "choose" && connections.length > 0 && (
            <View style={styles.connections}>
              <View style={styles.connectionList}>
                {connections.map((edge) => (
                  <Text
                    key={`${edge.from}-${edge.to}`}
                    style={styles.connection}
                  >
                    {edge.from} → {edge.to}
                  </Text>
                ))}
              </View>
            </View>
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
          {zoom && (
            <Animated.View
              style={{
                position: "absolute",
                left: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [zoom.from.x, zoom.to.x],
                }),
                top: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [zoom.from.y, zoom.to.y],
                }),
                width: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [zoom.from.width, zoom.to.width],
                }),
                height: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [zoom.from.height, zoom.to.height],
                }),
                borderRadius: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [zoom.from.width / 2, zoom.to.width / 2],
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
                    outputRange: phase === "choose" ? [48, 17] : [17, 48],
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
  mode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    justifyContent: "flex-end",
    marginVertical: 16,
  },
  modeText: { flex: 1, gap: 4 },
  modeLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: "600" },
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
