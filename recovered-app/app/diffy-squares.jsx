// Recovered from Metro module 670. See ../../recovery/README.md.
import * as Router from "expo-router";
import * as React from "react";
import {
  Animated,
  useWindowDimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SafeArea from "react-native-safe-area-context";
import * as Visualization from "../components/DiffySquaresViz.jsx";
import * as Theme from "../constants/theme.js";
import * as Game from "../hooks/useDiffySquares.js";
import * as KeyboardHeight from "../hooks/useKeyboardHeight.js";
import * as PinchZoom from "../hooks/usePinchZoom.js";
import * as MidpointInputModule from "../components/MidpointInput.jsx";
import * as Geometry from "../utils/geometry.js";
import * as jsxRuntime from "react/jsx-runtime";
import logoAsset from "../assets/logo-mark.png";
const EMPTY_CORNERS = [0, 0, 0, 0];
function DiffySquaresScreen() {
  const { width, height } = useWindowDimensions();
  const SQUARE_SIZE = Math.max(100, Math.min(width - 48, height - 294, 300));
  const OUTER_SIDE = SQUARE_SIZE - 2 * Visualization.VIZ_PADDING;
  const INITIAL_POINTS = [
    [Visualization.VIZ_PADDING, Visualization.VIZ_PADDING],
    [SQUARE_SIZE - Visualization.VIZ_PADDING, Visualization.VIZ_PADDING],
    [
      SQUARE_SIZE - Visualization.VIZ_PADDING,
      SQUARE_SIZE - Visualization.VIZ_PADDING,
    ],
    [Visualization.VIZ_PADDING, SQUARE_SIZE - Visualization.VIZ_PADDING],
  ];
  const CORNER_INPUT_POSITIONS = INITIAL_POINTS.map(([x, y]) => {
    const [labelX, labelY] = Geometry.pushFromCenter(
      x,
      y,
      SQUARE_SIZE / 2,
      SQUARE_SIZE / 2,
    );
    return {
      left: labelX - 18,
      top: labelY - 18,
    };
  });
  const sessionEpoch = React.useRef(0);
  const timers = React.useRef(new Set());
  const schedule = React.useCallback((callback, delay) => {
    const epoch = sessionEpoch.current;
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (epoch === sessionEpoch.current) callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  }, []);
  const cancelScheduled = React.useCallback(() => {
    sessionEpoch.current += 1;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);
  React.useEffect(() => cancelScheduled, [cancelScheduled]);
  const router = Router.useRouter();
  const {
    phase,
    currentCorners,
    initialCorners,
    currentGenIndex,
    totalGens,
    totalSteps,
    userAnswers,
    answerStates,
    confirmedGenerations,
    isLastGen,
    skipIntroAnimation,
    start,
    setAnswer,
    advanceGeneration,
    resetAnswers,
    reset,
  } = Game.useDiffySquares();
  const [cornerInputs, setCornerInputs] = React.useState(["", "", "", ""]);
  const [hasFocusedInput, setHasFocusedInput] = React.useState(false);
  const cornerRefs = React.useRef([null, null, null, null]);
  const midpointRefs = React.useRef([null, null, null, null]);
  const keyboardHeight = KeyboardHeight.useKeyboardHeight();
  const pendingVariation = React.useRef(null);
  const { zoomScale, panResponder, resetZoom } = PinchZoom.usePinchZoom(
    "playing" === phase,
  );
  const [showCornerInputs, setShowCornerInputs] = React.useState(false);
  const cornerOpacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if ("input" !== phase) return;
    if (skipIntroAnimation) {
      const e = pendingVariation.current ?? ["", "", "", ""];
      pendingVariation.current = null;
      setCornerInputs(e);
      setHasFocusedInput(false);
      setShowCornerInputs(true);
      return void cornerOpacity.setValue(1);
    }
    setShowCornerInputs(false);
    cornerOpacity.setValue(0);
    const e = setTimeout(() => {
      setShowCornerInputs(true);
      Animated.timing(cornerOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }, Visualization.TOTAL_DRAW_MS);
    return () => clearTimeout(e);
  }, [phase]);
  const inputPhaseOpacity = React.useRef(new Animated.Value(1)).current;
  const playingPhaseOpacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    "complete" === phase && resetZoom();
    "input" === phase &&
      (resetZoom(),
      skipIntroAnimation
        ? Animated.parallel([
            Animated.timing(inputPhaseOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(playingPhaseOpacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start()
        : (inputPhaseOpacity.setValue(1), playingPhaseOpacity.setValue(0)));
  }, [phase]);
  const flyAnimations = React.useRef(
    [0, 1, 2, 3].map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;
  const midpointEnterScale = React.useRef(new Animated.Value(0)).current;
  const [showMidpoints, setShowMidpoints] = React.useState(false);
  const [displayGeneration, setDisplayGeneration] = React.useState(0);
  const [isFlying, setIsFlying] = React.useState(false);
  const transitionInProgress = React.useRef(false);
  const [suppressNewestLabels, setSuppressNewestLabels] = React.useState(false);
  const answersLocked = React.useRef(false);
  React.useEffect(() => {
    if ("playing" !== phase) return;
    if (transitionInProgress.current) return;
    answersLocked.current = false;
    setIsFlying(false);
    setSuppressNewestLabels(false);
    setShowMidpoints(false);
    midpointEnterScale.setValue(0);
    flyAnimations.forEach(({ x: e, y: t, opacity: o }) => {
      e.setValue(0);
      t.setValue(0);
      o.setValue(0);
    });
    const e = setTimeout(() => {
      setDisplayGeneration(currentGenIndex);
      setShowMidpoints(true);
      flyAnimations.forEach(({ opacity: e }) => e.setValue(1));
      Animated.spring(midpointEnterScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 180,
        friction: 8,
      }).start();
    }, Visualization.TOTAL_DRAW_MS);
    return () => clearTimeout(e);
  }, [currentGenIndex, phase]);
  const restart = () => {
    cancelScheduled();
    transitionInProgress.current = false;
    answersLocked.current = false;
    frozenMidpoints.current = null;
    flyAnimations.forEach(({ x, y, opacity }) => {
      x.stopAnimation();
      y.stopAnimation();
      opacity.stopAnimation();
    });
    setIsFlying(false);
    setShowMidpoints(false);
    setSuppressNewestLabels(false);
    reset();
  };
  const completeGeneration = React.useCallback(
    (points) => {
      if (answersLocked.current) return;
      answersLocked.current = true;
      const epoch = sessionEpoch.current;
      Keyboard.dismiss();
      const animations = points.map(([x, y], side) => {
        const [labelX, labelY] = Geometry.pushFromCenter(
          x,
          y,
          SQUARE_SIZE / 2,
          SQUARE_SIZE / 2,
        );
        return Animated.parallel([
          Animated.spring(flyAnimations[side].x, {
            toValue: labelX - x,
            useNativeDriver: true,
            tension: 160,
            friction: 10,
          }),
          Animated.spring(flyAnimations[side].y, {
            toValue: labelY - y,
            useNativeDriver: true,
            tension: 160,
            friction: 10,
          }),
        ]);
      });
      transitionInProgress.current = true;
      frozenMidpoints.current = points;
      setIsFlying(true);
      setSuppressNewestLabels(true);
      Animated.parallel(animations).start();
      advanceGeneration(currentGenIndex, totalGens);
      schedule(() => {
        setSuppressNewestLabels(false);
        Animated.stagger(
          40,
          flyAnimations.map(({ opacity }) =>
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ),
        ).start(({ finished }) => {
          if (!finished || epoch !== sessionEpoch.current) return;
          transitionInProgress.current = false;
          frozenMidpoints.current = null;
          setIsFlying(false);
          flyAnimations.forEach(({ x, y, opacity }) => {
            x.setValue(0);
            y.setValue(0);
            opacity.setValue(1);
          });
          midpointEnterScale.setValue(0);
          answersLocked.current = false;
          resetAnswers();
          setDisplayGeneration(currentGenIndex + 1);
          setShowMidpoints(true);
          Animated.spring(midpointEnterScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 180,
            friction: 8,
          }).start();
        });
      }, Visualization.TOTAL_DRAW_MS + 80);
    },
    [
      currentGenIndex,
      totalGens,
      advanceGeneration,
      resetAnswers,
      flyAnimations,
      SQUARE_SIZE,
      schedule,
    ],
  );
  const startGame = () => {
    const corners = cornerInputs.map((value) => Number.parseInt(value, 10));
    if (corners.some((value) => Number.isNaN(value) || value < 0)) return;
    const epoch = sessionEpoch.current;
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(inputPhaseOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(playingPhaseOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cornerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || epoch !== sessionEpoch.current) return;
      setDisplayGeneration(0);
      start(corners);
    });
  };
  const canStart = cornerInputs.every(
    (e) => "" !== e && !isNaN(parseInt(e, 10)),
  );
  const padding = Visualization.VIZ_PADDING;
  const sideLength = SQUARE_SIZE - 2 * padding;
  let currentPoints = [
    [padding, padding],
    [padding + sideLength, padding],
    [padding + sideLength, padding + sideLength],
    [padding, padding + sideLength],
  ];
  if ("playing" === phase && currentCorners)
    for (let e = 0; e < currentGenIndex; e++)
      currentPoints = currentPoints.map((e, t) => {
        const o = currentPoints[(t + 1) % 4];
        return [(e[0] + o[0]) / 2, (e[1] + o[1]) / 2];
      });
  const midpointPositions = currentPoints.map((e, t) => {
    const o = currentPoints[(t + 1) % 4];
    return [(e[0] + o[0]) / 2, (e[1] + o[1]) / 2];
  });
  const visibleGenerations =
    "input" === phase ? [EMPTY_CORNERS] : confirmedGenerations;
  const animateGenIndex =
    "input" === phase
      ? skipIntroAnimation
        ? -1
        : 0
      : 1 !== confirmedGenerations.length || skipIntroAnimation
        ? confirmedGenerations.length - 1
        : -1;
  const showLabels = "input" !== phase;
  const frozenMidpoints = React.useRef(null);
  const shouldShowMidpoints =
    "playing" === phase && (showMidpoints || isFlying) && !isLastGen;
  const displayMidpoints =
    isFlying && frozenMidpoints.current
      ? frozenMidpoints.current
      : midpointPositions;
  return (
    <jsxRuntime.Fragment>
      {"input" === phase && keyboardHeight > 0 && (
        <View
          style={[
            styles.inputAccessory,
            {
              bottom: keyboardHeight,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            style={({ pressed: e }) => [
              styles.accessoryButton,
              e && styles.accessoryButtonPressed,
            ]}
            onPress={() => {
              const e = cornerInputs.findIndex(
                (e) => "" === e || isNaN(parseInt(e, 10)),
              );
              -1 === e ? startGame() : cornerRefs.current[e]?.focus();
            }}
          >
            <Text style={styles.accessoryButtonText}>
              {canStart ? "Start \u2192" : "Next \u2192"}
            </Text>
          </Pressable>
        </View>
      )}
      <SafeArea.SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable
                accessibilityRole="button"
                onPress={
                  "input" === phase
                    ? () =>
                        router.canGoBack()
                          ? router.back()
                          : router.replace("/topics")
                    : restart
                }
                style={styles.backButton}
              >
                <Text style={styles.backText}>
                  {"input" === phase ? "\u2190 Back" : "\u2190 New Game"}
                </Text>
              </Pressable>
              <Image source={logoAsset} style={styles.logo} />
            </View>
            <Text style={styles.title}>{"Diffy Squares"}</Text>
            <Animated.Text
              style={[
                styles.subtitle,
                {
                  opacity: inputPhaseOpacity,
                },
              ]}
            >
              {"Enter a number at each corner"}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.stepCounter,
                {
                  opacity: playingPhaseOpacity,
                },
              ]}
            >
              {"playing" === phase ? `Level ${displayGeneration + 1}` : ""}
            </Animated.Text>
          </View>
          <View style={styles.squareWrapper}>
            {
              <Animated.View
                style={{
                  width: SQUARE_SIZE,
                  height: SQUARE_SIZE,
                  transform: [
                    {
                      scale: zoomScale,
                    },
                  ],
                }}
                {...panResponder.panHandlers}
              >
                <Visualization.default
                  generations={visibleGenerations}
                  size={SQUARE_SIZE}
                  animateGenIndex={animateGenIndex}
                  showLabels={showLabels}
                  suppressNewestLabels={suppressNewestLabels}
                />
                {"input" === phase &&
                  showCornerInputs &&
                  [0, 1, 2, 3].map((e) => (
                    <Animated.View
                      style={[
                        styles.cornerInputWrapper,
                        CORNER_INPUT_POSITIONS[e],
                        {
                          opacity: cornerOpacity,
                        },
                      ]}
                      key={e}
                    >
                      <TextInput
                        ref={(t) => {
                          cornerRefs.current[e] = t;
                        }}
                        accessibilityLabel={
                          [
                            "Top left",
                            "Top right",
                            "Bottom right",
                            "Bottom left",
                          ][e] + " corner"
                        }
                        style={styles.cornerInput}
                        keyboardType={"number-pad"}
                        maxLength={4}
                        value={cornerInputs[e]}
                        onFocus={() => setHasFocusedInput(true)}
                        onChangeText={(t) => {
                          const o = [...cornerInputs];
                          o[e] = t.replace(/[^0-9]/g, "");
                          setCornerInputs(o);
                        }}
                        placeholder={"?"}
                        placeholderTextColor={"#444"}
                        onSubmitEditing={() =>
                          cornerRefs.current[(e + 1) % 4]?.focus()
                        }
                      />
                    </Animated.View>
                  ))}
                {shouldShowMidpoints &&
                  [0, 1, 2, 3].map((e) => {
                    const [t, o] = displayMidpoints[e];
                    return (
                      <MidpointInputModule.default
                        side={e}
                        state={answerStates[e]}
                        value={userAnswers[e]}
                        genIndex={currentGenIndex}
                        outerSide={OUTER_SIDE}
                        enterAnim={midpointEnterScale}
                        flyX={flyAnimations[e].x}
                        flyY={flyAnimations[e].y}
                        opacityAnim={flyAnimations[e].opacity}
                        onChangeText={(t, o) => {
                          const { isCorrect: n, allCorrect: s } = setAnswer(
                            e,
                            t,
                            currentCorners,
                            currentGenIndex,
                            answerStates,
                          );
                          if (n)
                            if (s) completeGeneration(midpointPositions);
                            else {
                              const t = [1, 2, 3, 0]
                                .map((t) => (e + t) % 4)
                                .find(
                                  (t) =>
                                    t !== e && "correct" !== answerStates[t],
                                );
                              void 0 !== t &&
                                schedule(
                                  () => midpointRefs.current[t]?.focus(),
                                  50,
                                );
                            }
                        }}
                        inputRef={(t) => {
                          midpointRefs.current[e] = t;
                        }}
                        x={t}
                        y={o}
                        key={e}
                      />
                    );
                  })}
              </Animated.View>
            }
          </View>
          {"playing" === phase && (
            <Animated.View
              style={[
                styles.hintRow,
                {
                  opacity: playingPhaseOpacity,
                },
              ]}
            >
              <Text style={styles.hintText}>
                {"Fill in the difference between the neighboring corners"}
              </Text>
            </Animated.View>
          )}
          <Animated.View
            style={[
              styles.actions,
              {
                opacity: inputPhaseOpacity,
              },
            ]}
          >
            {"input" === phase && !hasFocusedInput && (
              <Pressable
                accessibilityRole="button"
                style={({ pressed: e }) => [
                  styles.diceButton,
                  e && styles.pressed,
                ]}
                onPress={() => {
                  setHasFocusedInput(false);
                  setCornerInputs(
                    [
                      Math.floor(10 * Math.random()),
                      Math.floor(10 * Math.random()),
                      Math.floor(10 * Math.random()),
                      Math.floor(10 * Math.random()),
                    ].map(String),
                  );
                }}
              >
                <Text style={styles.diceText}>
                  {"\ud83c\udfb2 Roll Random"}
                </Text>
              </Pressable>
            )}
            {"input" === phase && (
              <Pressable
                accessibilityRole="button"
                style={({ pressed: e }) => [
                  styles.primaryButton,
                  !canStart && styles.primaryButtonDisabled,
                  e && canStart && styles.pressed,
                ]}
                onPress={startGame}
                disabled={!canStart}
              >
                <Text style={styles.primaryButtonText}>{"Start \u2192"}</Text>
              </Pressable>
            )}
          </Animated.View>
          {"complete" === phase && (
            <View style={styles.actions}>
              <Text style={styles.celebrationText}>
                {totalSteps <= 3
                  ? "That was quick \u2014 only " +
                    totalSteps +
                    " level" +
                    (1 !== totalSteps ? "s" : "") +
                    "!"
                  : totalSteps <= 7
                    ? totalSteps + " levels to reach zero."
                    : totalSteps <= 12
                      ? "Whoa \u2014 " +
                        totalSteps +
                        " levels! Most numbers collapse way faster."
                      : "That's rare. " +
                        totalSteps +
                        " levels \u2014 you found something."}
              </Text>
              <Text style={styles.curiosityPrompt}>
                {totalSteps <= 3
                  ? "What do you notice? \n What do you wonder?"
                  : "Can you find a combo that lasts even longer?"}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed: e }) => [
                  styles.primaryButton,
                  e && styles.pressed,
                ]}
                onPress={() => {
                  initialCorners &&
                    ((pendingVariation.current = initialCorners.map(String)),
                    restart());
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {"Try a Variation"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={({ pressed: e }) => [
                  styles.secondaryButton,
                  e && styles.pressed,
                ]}
                onPress={restart}
              >
                <Text style={styles.secondaryButtonText}>{"Fresh Start"}</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeArea.SafeAreaView>
    </jsxRuntime.Fragment>
  );
}
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  logo: {
    width: 58,
    height: 58,
  },
  backButton: {},
  backText: {
    color: Theme.Colors.teal,
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: Theme.Colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Theme.Colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  stepCounter: {
    color: Theme.Colors.orange,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  squareWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  cornerInputWrapper: {
    position: "absolute",
    width: 36,
    height: 36,
  },
  cornerInput: {
    width: 36,
    height: 36,
    backgroundColor: Theme.Colors.surface,
    borderWidth: 2,
    borderColor: Theme.Colors.orange,
    borderRadius: 18,
    color: Theme.Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  hintRow: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: "center",
  },
  hintText: {
    color: Theme.Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
    alignItems: "center",
  },
  diceButton: {
    backgroundColor: Theme.Colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.Colors.teal,
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  diceText: {
    color: Theme.Colors.teal,
    fontSize: 17,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: Theme.Colors.orange,
    borderRadius: 50,
    paddingHorizontal: 48,
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: Theme.Colors.primaryButtonDisabled,
  },
  primaryButtonText: {
    color: Theme.Colors.background,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },
  celebrationText: {
    color: Theme.Colors.gold,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  startingNumbers: {
    color: Theme.Colors.teal,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  curiosityPrompt: {
    color: Theme.Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: Theme.Colors.teal,
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: Theme.Colors.teal,
    fontSize: 16,
    fontWeight: "700",
  },
  inputAccessory: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Theme.Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.Colors.border,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accessoryButton: {
    backgroundColor: Theme.Colors.orange,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  accessoryButtonPressed: {
    opacity: 0.75,
  },
  accessoryButtonText: {
    color: Theme.Colors.background,
    fontSize: 16,
    fontWeight: "800",
  },
});
export default DiffySquaresScreen;
