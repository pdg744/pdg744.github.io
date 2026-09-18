import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  View,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { Colors } from "../constants/theme.js";

const measure = (node) =>
  new Promise((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) =>
      resolve({ x, y, width, height }),
    );
  });

export default function FactorEntry({
  factors,
  pairs,
  onRemovePair,
  value,
  sumInputRef,
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
  const targets = useRef({});
  const input = useRef(null);
  const secondInput = useRef(null);
  const sumInput = useRef(null);
  const previousMode = useRef(false);
  const previousCount = useRef(factors.length);
  const transition = useRef(new Animated.Value(0)).current;
  const [sprites, setSprites] = useState([]);
  const [atSum, setAtSum] = useState(false);
  const canAdd =
    [value, pairedValue].every(
      (item) => /^\d+$/.test(item) && Number(item) >= 1 && Number(item) <= 30,
    ) && [value, pairedValue].some((item) => !factors.includes(Number(item)));
  const addends = factors.filter((factor) => factor !== number);
  const cellSize = factors.length > 18 ? 28 : factors.length > 10 ? 36 : 44;
  const cellStyle = {
    width: cellSize,
    height: cellSize,
    borderRadius: Math.min(14, cellSize / 3),
  };
  const textStyle = { fontSize: cellSize < 36 ? 15 : 20 };
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
    // Both layouts remain mounted, so source positions are exactly those shown before Next.
    const frame = requestAnimationFrame(async () => {
      const origin = await measure(root.current);
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
          if (!from || !origin) return null;
          const to = target || from;
          return {
            key,
            factor,
            fade: factor === number || duplicate,
            from: { x: from.x - origin.x, y: from.y - origin.y },
            to: { x: to.x - origin.x, y: to.y - origin.y },
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
          if (!cancelled) (summing ? sumInput : input).current?.focus();
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      animation?.stop();
    };
  }, [summing, reduceMotion, transition, pairs]);

  useEffect(() => {
    if (factors.length > previousCount.current && !summing)
      input.current?.focus();
    previousCount.current = factors.length;
  }, [factors.length, summing]);

  const symbol = (text, width = 26) => (
    <Text style={[styles.operator, { width }]}>{text}</Text>
  );
  const hiddenPair = summing;
  return (
    <View
      ref={root}
      collapsable={false}
      style={{ width: "100%", alignItems: "center" }}
    >
      <Animated.View
        pointerEvents={summing ? "none" : "auto"}
        aria-hidden={hiddenPair}
        accessibilityElementsHidden={hiddenPair}
        importantForAccessibility={hiddenPair ? "no-hide-descendants" : "auto"}
        style={{ width: "100%", alignItems: "center", opacity: fadeOut }}
      >
        <Text accessibilityRole="header" style={styles.question}>
          {prompt}
        </Text>
        <View style={styles.row}>
          {pairs.map((pair, row) => (
            <Pressable
              key={row}
              accessibilityRole="button"
              accessibilityLabel={`Remove pair ${pair[0]} times ${pair[1]} equals ${number}`}
              onPress={() => onRemovePair(row)}
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
                    }}
                    collapsable={false}
                    style={[
                      styles.box,
                      cellStyle,
                      { opacity: sprites.length ? 0 : 1 },
                    ]}
                  >
                    <Text style={[styles.factor, textStyle]}>{factor}</Text>
                  </View>
                </View>
              ))}
              {symbol("=")}
              <Text style={[styles.factor, textStyle]}>{number}</Text>
            </Pressable>
          ))}
          <View
            style={[
              styles.entryPair,
              {
                width: "100%",
                justifyContent: "center",
                marginTop: factors.length ? 8 : 0,
              },
            ]}
          >
            <TextInput
              ref={input}
              accessibilityLabel="First factor"
              value={summing ? "" : value}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={2}
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
              onChangeText={onPairedChange}
              keyboardType="number-pad"
              maxLength={2}
              editable={!summing}
              onSubmitEditing={onAdd}
              submitBehavior="submit"
              returnKeyType="done"
              style={[styles.box, styles.input, cellStyle, textStyle]}
            />
            {symbol("=")}
            <Text style={[styles.factor, textStyle]}>{number}</Text>
          </View>
        </View>
        <View style={{ height: cellSize + 10, paddingTop: 10 }}>
          {!summing && canAdd && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add factor pair"
              onPress={onAdd}
              style={[styles.plusButton, cellStyle]}
            >
              <Text style={styles.plus}>+</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
      <View
        pointerEvents={summing && atSum ? "auto" : "none"}
        aria-hidden={!summing}
        accessibilityElementsHidden={!summing}
        importantForAccessibility={!summing ? "no-hide-descendants" : "auto"}
        style={[StyleSheet.absoluteFill, { justifyContent: "center" }]}
      >
        <View style={[styles.row, { marginTop: 0 }]}>
          {addends.map((factor, index) => (
            <View key={factor} style={styles.entryPair}>
              {index > 0 && (
                <Animated.View style={{ opacity: reveal }}>
                  {symbol("+", 20)}
                </Animated.View>
              )}
              <View
                ref={(node) => {
                  targets.current[factor] = node;
                }}
                collapsable={false}
                style={[styles.box, cellStyle, { opacity: atSum ? 1 : 0 }]}
              >
                <Text style={[styles.factor, textStyle]}>{factor}</Text>
              </View>
            </View>
          ))}
          {!addends.length && (
            <Animated.Text style={[styles.factor, { opacity: reveal }]}>
              0
            </Animated.Text>
          )}
          <Animated.View style={[styles.entryPair, { opacity: reveal }]}>
            {symbol("=", 20)}
            <TextInput
              ref={(node) => {
                sumInput.current = node;
                if (sumInputRef) sumInputRef.current = node;
              }}
              accessibilityLabel="Sum of the factors"
              value={summing ? value : ""}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={6}
              editable={summing && atSum}
              onSubmitEditing={onAdd}
              submitBehavior="submit"
              returnKeyType="done"
              style={[styles.box, styles.input, cellStyle, textStyle]}
            />
          </Animated.View>
        </View>
      </View>
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
          <Text style={[styles.factor, textStyle]}>{sprite.factor}</Text>
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
    marginTop: 12,
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
  plusButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { color: Colors.teal, fontSize: 28, lineHeight: 32 },
});
