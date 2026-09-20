import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  View,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { Colors } from "../constants/theme.js";

import { FACTOR_DIGITS, SUM_DIGITS, isCompleteFactorInput } from "../game/factorAndAdd.js";

const measure = (node) =>
  new Promise((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) =>
      resolve({ x, y, width, height }),
    );
  });

export default function FactorEntry({
  transitioning = false,
  circleSize,
  entryOpen,
  addAnother,
  factors,
  pairs,
  value,
  sumInputRef,
  unitFactorRef,
  automaticSum,
  pairedValue,
  onPairedChange,
  onChange,
  onAdd,
  reduceMotion,
  summing,
  number,
  prompt,
}) {
  const root = useRef(null);
  const sources = useRef({});
  const pairViewport = useRef(null);
  const targets = useRef({});
  const input = useRef(null);
  const secondInput = useRef(null);
  const sumInput = useRef(null);
  const previousMode = useRef(summing);
  const transition = useRef(new Animated.Value(summing ? 1 : 0)).current;
  const [sprites, setSprites] = useState([]);
  const [atSum, setAtSum] = useState(summing);
  const addends = factors.filter((factor) => factor !== number);
  const stageHeight = Math.floor(circleSize * (circleSize < 330 ? 0.86 : 0.82));
  const cellSize = 44;
  const sumTop = circleSize * 0.1 + 40;
  const sumRowHeight = Math.min(32, Math.max(20,
    Math.floor((stageHeight - sumTop - 64) / Math.max(1, addends.length))));
  const sumFontSize = Math.min(24, sumRowHeight - 3);
  const sumWidth = Math.max(104, String(number).length * sumFontSize * 0.65 + 24);
  const cellStyle = { width: cellSize, height: cellSize, borderRadius: 14 };
  const rowGap = 4;
  const availableRowsHeight = stageHeight - circleSize * 0.1 - (circleSize < 330 ? 48 : 58) - circleSize * 0.05 - 12 - (entryOpen ? cellSize + rowGap : 0);
  const savedSize = Math.min(cellSize, Math.max(18, Math.floor(availableRowsHeight / Math.max(1, pairs.length) - rowGap)));
  const savedStyle = { width: savedSize, height: savedSize, borderRadius: 10 };
  // Preserve access for exceptional discovered numbers with dozens of pairs.
  const needsOverflow = pairs.length * (savedSize + rowGap) > availableRowsHeight;
  const PairContainer = needsOverflow ? ScrollView : View;
  const sumStyle = { width: sumWidth, height: 44, borderRadius: 10 };
  const textStyle = {
    fontSize:
      number >= 10000 ? 10 : number >= 1000 ? 13 : number >= 100 ? 16 : 20,
  };
  const savedTextStyle = { fontSize: Math.min(textStyle.fontSize, savedSize * 0.55) };
  const fadeOut = transition.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 0, 0],
  });
  const reveal = transition.interpolate({
    inputRange: [0, 0.75, 1],
    outputRange: [0, 0, 1],
  });

  useEffect(() => {
    if (previousMode.current === summing) return;
    previousMode.current = summing;
    let cancelled = false;
    let animation;
    // Both pair and sum layouts remain mounted for measured transitions.
    const frame = requestAnimationFrame(async () => {
      const origin = await measure(root.current);
      const clip = await measure(pairViewport.current);
      const occurrences = pairs.flatMap((pair, row) =>
        pair.map((factor, column) => ({ factor, key: `${row}-${column}` })),
      );
      const seen = new Set();
      const measured = await Promise.all(
        occurrences.map(async ({ factor, key }) => {
          const duplicate = seen.has(factor);
          seen.add(factor);
          const [from, target] = await Promise.all([
            measure(sources.current[key]),
            measure(targets.current[factor]),
          ]);
          if (
            !from ||
            !origin ||
            (clip &&
              (from.y < clip.y - 1 ||
                from.y + from.height > clip.y + clip.height + 1))
          )
            return null;
          const to = target || from;
          return {
            key,
            factor,
            fade: factor === number || duplicate,
            from: {
              x: from.x - origin.x,
              y: from.y - origin.y,
              width: from.width,
              height: from.height,
            },
            to: {
              x: to.x - origin.x,
              y: to.y - origin.y,
              width: to.width,
              height: to.height,
            },
          };
        }),
      );
      if (cancelled) return;
      setSprites(measured.filter(Boolean));
      setAtSum(false);
      animation = Animated.timing(transition, {
        toValue: summing ? 1 : 0,
        duration: reduceMotion ? 0 : 1600,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      animation.start(({ finished }) => {
        if (!finished || cancelled) return;
        setSprites([]);
        setAtSum(summing);
        requestAnimationFrame(() => {
          if (!cancelled && !(summing && automaticSum))
            (summing
              ? sumInput
              : entryOpen
                ? input
                : addAnother
            ).current?.focus();
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      animation?.stop();
    };
  }, [summing, reduceMotion, transition, pairs]);

  useLayoutEffect(() => {
    if (summing || transitioning) return;
    // Initial entry must wait until the board's zoom transition reveals the field.
    // Focus the cleared left field in the same commit, before a new row is painted.
    if (entryOpen) input.current?.focus();
    else addAnother.current?.focus();
  }, [entryOpen, summing, pairs.length, transitioning]);

  function changeFactor(text, second = false) {
    if (!/^\d*$/.test(text) || text.length > FACTOR_DIGITS) return;
    (second ? onPairedChange : onChange)(text);
    const first = second ? value : text;
    const last = second ? text : pairedValue;
    if (
      first && last && Number(first) * Number(last) === number &&
      [first, last].some((item) => !factors.includes(Number(item)))
    ) {
      onAdd([first, last]);
    } else if (!second && text.length > value.length &&
      isCompleteFactorInput(number, text, factors)) {
      secondInput.current?.focus();
    }
  }

  const symbol = (text, width = 26) => (
    <Text style={[styles.operator, { width }]}>{text}</Text>
  );
  const hiddenPair = summing;
  return (
    <View
      ref={root}
      collapsable={false}
      style={{ width: "100%", height: stageHeight, alignItems: "center" }}
    >
      <Animated.View
        pointerEvents={summing ? "none" : "auto"}
        aria-hidden={hiddenPair}
        accessibilityElementsHidden={hiddenPair}
        importantForAccessibility={hiddenPair ? "no-hide-descendants" : "auto"}
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          opacity: fadeOut,
        }}
      >
        <Text
          accessibilityRole="header"
          style={[
            styles.question,
            {
              marginTop: circleSize * 0.1,
              height: circleSize < 330 ? 48 : 58,
              maxWidth: circleSize * 0.76,
              fontSize: circleSize < 330 ? 20 : 24,
              lineHeight: circleSize < 330 ? 24 : 29,
            },
          ]}
        >
          {prompt}
        </Text>
        <View
          ref={pairViewport}
          collapsable={false}
          style={{
            width: "100%",
            flex: 1,
            minHeight: 0,
            marginTop: 4,
            marginBottom: circleSize * 0.05,
          }}
        >
          <PairContainer
            {...(needsOverflow
              ? { keyboardShouldPersistTaps: "handled", contentContainerStyle: { gap: rowGap, alignItems: "center" } }
              : { style: { gap: rowGap, alignItems: "center" } })}
          >
            {pairs.map((pair, row) => (
              <View
                key={`${row}-${pair.join("-")}`}
                style={[
                  styles.entryPair,
                  { width: "100%", justifyContent: "center" },
                ]}
              >
                {pair.map((factor, column) => (
                  <View key={column} style={styles.entryPair}>
                    {column === 1 && symbol("×")}
                    <View
                      ref={(node) => {
                        sources.current[`${row}-${column}`] = node;
                        if (factor === 1 && unitFactorRef)
                          unitFactorRef.current = node;
                      }}
                      collapsable={false}
                      style={[
                        styles.box,
                        savedStyle,
                        { opacity: sprites.length ? 0 : 1 },
                      ]}
                    >
                      <Text style={[styles.factor, savedTextStyle]}>
                        {factor}
                      </Text>
                    </View>
                  </View>
                ))}
                {symbol("=")}
                <Text style={[styles.factor, savedTextStyle]}>{number}</Text>
              </View>
            ))}
            {entryOpen ? (
              <>
                <View
                  style={[
                    styles.entryPair,
                    {
                      width: "100%",
                      justifyContent: "center",
                      marginTop: 0,
                    },
                  ]}
                >
                  <TextInput
                    ref={input}
                    accessibilityLabel="First factor"
                    value={summing ? "" : value}
                    onChangeText={(text) => changeFactor(text)}
                    keyboardType="number-pad"
                    maxLength={FACTOR_DIGITS}
                    editable={!summing}
                    onSubmitEditing={() => secondInput.current?.focus()}
                    submitBehavior="submit"
                    returnKeyType="next"
                    style={[styles.box, styles.input, cellStyle, textStyle]}
                  />
                  {symbol("×")}
                  <TextInput
                    ref={secondInput}
                    accessibilityLabel="Second factor"
                    value={pairedValue}
                    onChangeText={(text) => changeFactor(text, true)}
                    keyboardType="number-pad"
                    maxLength={FACTOR_DIGITS}
                    editable={!summing}
                    onSubmitEditing={onAdd}
                    submitBehavior="submit"
                    returnKeyType="done"
                    style={[styles.box, styles.input, cellStyle, textStyle]}
                  />
                  {symbol("=")}
                  <Text style={[styles.factor, textStyle]}>{number}</Text>
                </View>
              </>
            ) : null}
          </PairContainer>
        </View>
      </Animated.View>
      {summing && (
        <Animated.Text
          accessibilityRole="header"
          style={[
            styles.question,
            {
              position: "absolute",
              top: circleSize * 0.1,
              width: "100%",
              fontSize: circleSize < 330 ? 20 : 24,
              lineHeight: circleSize < 330 ? 24 : 29,
              opacity: reveal,
            },
          ]}
        >
          Now add them!
        </Animated.Text>
      )}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingBottom: 8 }}
        pointerEvents={summing && atSum ? "auto" : "none"}
        aria-hidden={!summing}
        accessibilityElementsHidden={!summing}
        importantForAccessibility={!summing ? "no-hide-descendants" : "auto"}
        style={[StyleSheet.absoluteFill, { top: sumTop }]}
      >
        <View style={{ width: sumWidth + 28, alignItems: "flex-end" }}>
          {addends.map((factor, index) => (
            <View key={factor} style={[styles.entryPair, { height: sumRowHeight, width: "100%", justifyContent: "flex-end" }]}>
              {index === addends.length - 1 && addends.length > 1 && (
                <Animated.View style={{ opacity: reveal }}>
                  {symbol("+", 28)}
                </Animated.View>
              )}
              <View
                ref={(node) => {
                  targets.current[factor] = node;
                  if (automaticSum && factor === 1 && sumInputRef)
                    sumInputRef.current = node;
                }}
                collapsable={false}
                style={{ height: sumRowHeight, paddingHorizontal: 10, justifyContent: "center", opacity: atSum ? 1 : 0 }}
              >
                <Text style={[styles.factor, { fontSize: sumFontSize, textAlign: "right", fontVariant: ["tabular-nums"] }]}>{factor}</Text>
              </View>
            </View>
          ))}
          {!addends.length && (
            <Animated.Text style={[styles.factor, { opacity: reveal }]}>
              0
            </Animated.Text>
          )}
          {!automaticSum && (
            <Animated.View style={{ width: "100%", alignItems: "flex-end", opacity: reveal,
              borderTopWidth: 2, borderTopColor: Colors.teal, marginTop: 5, paddingTop: 8 }}>
              <TextInput
                ref={(node) => {
                  sumInput.current = node;
                  if (sumInputRef) sumInputRef.current = node;
                }}
                accessibilityLabel="Sum of the factors"
                value={summing ? value : ""}
                onChangeText={onChange}
                keyboardType="number-pad"
                maxLength={SUM_DIGITS}
                editable={summing && atSum}
                onSubmitEditing={onAdd}
                submitBehavior="submit"
                returnKeyType="done"
                style={[styles.box, styles.input, sumStyle, { fontSize: sumFontSize, textAlign: "right", paddingRight: 10, fontVariant: ["tabular-nums"] }]}
              />
            </Animated.View>
          )}
        </View>
      </ScrollView>
      {sprites.map((sprite) => (
        <Animated.View
          key={sprite.key}
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.box,
            cellStyle,
            {
              position: "absolute",
              borderWidth: transition.interpolate({ inputRange: [0, 0.78, 1], outputRange: [1.5, 1.5, 0] }),
              width: transition.interpolate({
                inputRange: [0, 0.3, 0.78, 1],
                outputRange: [
                  sprite.from.width,
                  sprite.from.width,
                  sprite.to.width,
                  sprite.to.width,
                ],
              }),
              height: transition.interpolate({
                inputRange: [0, 0.3, 0.78, 1],
                outputRange: [
                  sprite.from.height,
                  sprite.from.height,
                  sprite.to.height,
                  sprite.to.height,
                ],
              }),
              backgroundColor: Colors.surface,
              opacity: sprite.fade ? fadeOut : 1,
              left: transition.interpolate({
                inputRange: [0, 0.3, 0.78, 1],
                outputRange: [
                  sprite.from.x,
                  sprite.from.x,
                  sprite.to.x,
                  sprite.to.x,
                ],
              }),
              top: transition.interpolate({
                inputRange: [0, 0.3, 0.78, 1],
                outputRange: [
                  sprite.from.y,
                  sprite.from.y,
                  sprite.to.y,
                  sprite.to.y,
                ],
              }),
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.factor,
              {
                fontSize: transition.interpolate({
                  inputRange: [0, 0.3, 0.78, 1],
                  outputRange: [
                    savedTextStyle.fontSize,
                    savedTextStyle.fontSize,
                    sumFontSize,
                    sumFontSize,
                  ],
                }),
              },
            ]}
          >
            {sprite.factor}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  question: {
    color: Colors.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 0,
  },
  operator: {
    color: Colors.gold,
    fontSize: 22,
    textAlign: "center",
    overflow: "hidden",
  },
  entryPair: { flexDirection: "row", alignItems: "center" },
  row: {
    width: "100%",
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  box: {
    width: 64,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitted: { backgroundColor: Colors.surfaceAlt },
  factor: { color: Colors.teal, fontSize: 20, fontWeight: "700" },
  input: {
    color: Colors.textPrimary,
    fontSize: 20,
    textAlign: "center",
    padding: 2,
    backgroundColor: Colors.surface,
  },
});
