import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  View,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { Colors } from "../constants/theme.js";

export default function FactorEntry({
  factors,
  value,
  onChange,
  onAdd,
  onRemove,
  reduceMotion,
  summing,
  number,
  prompt,
}) {
  const input = useRef(null);
  const transition = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.timing(transition, {
      toValue: summing ? 1 : 0,
      duration: reduceMotion ? 0 : 480,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && summing) input.current?.focus();
    });
    return () => animation.stop();
  }, [summing, reduceMotion, transition]);
  const fadeOut = transition.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });
  const reveal = transition.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const addends = factors.filter((factor) => factor !== number);
  const operator = (symbol) => (
    <Animated.Text
      aria-hidden={!summing}
      accessibilityElementsHidden={!summing}
      style={[
        styles.operator,
        {
          opacity: reveal,
          width: transition.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          }),
        },
      ]}
    >
      {symbol}
    </Animated.Text>
  );
  const cellSize =
    factors.length > 18
      ? 28
      : factors.length > 10
        ? 36
        : factors.length > 3
          ? 44
          : 56;
  const cellStyle = {
    width: cellSize,
    height: cellSize,
    borderRadius: Math.min(14, cellSize / 3),
  };
  const textStyle = { fontSize: cellSize < 36 ? 15 : 20 };
  const previousCount = useRef(factors.length);
  const grow = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const added = factors.length > previousCount.current;
    previousCount.current = factors.length;
    if (!added) {
      grow.setValue(1);
      return;
    }
    input.current?.focus();
    grow.setValue(reduceMotion ? 1 : 0);
    const animation = Animated.timing(grow, {
      toValue: 1,
      duration: reduceMotion ? 0 : 180,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [factors.length, grow, reduceMotion]);

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Animated.Text
        accessibilityRole="header"
        aria-hidden={summing}
        accessibilityElementsHidden={summing}
        importantForAccessibility={summing ? "no-hide-descendants" : "auto"}
        style={[styles.question, { opacity: fadeOut }]}
      >
        {prompt}
      </Animated.Text>
      <View style={styles.row}>
        {factors.map((factor) => (
          <Animated.View
            key={factor}
            style={[
              styles.entryPair,
              factor === number && {
                opacity: fadeOut,
                width: transition.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [cellSize, cellSize, 0],
                }),
                marginRight: transition.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0, -6],
                }),
                overflow: "hidden",
              },
            ]}
            aria-hidden={summing && factor === number}
            accessibilityElementsHidden={summing && factor === number}
            importantForAccessibility={
              summing && factor === number ? "no-hide-descendants" : "auto"
            }
          >
            {factor !== number && addends.indexOf(factor) > 0 && operator("+")}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                summing ? `Factor ${factor}` : `Remove factor ${factor}`
              }
              disabled={summing}
              onPress={() => onRemove(factor)}
              style={[styles.box, styles.submitted, cellStyle]}
            >
              <Text style={[styles.factor, textStyle]}>{factor}</Text>
            </Pressable>
          </Animated.View>
        ))}
        {summing && !addends.length && <Text style={styles.factor}>0</Text>}
        <View style={styles.entryPair}>
          {operator("=")}
          <Animated.View
            style={{
              width: grow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, cellSize],
              }),
              overflow: "hidden",
            }}
          >
            <TextInput
              key={factors.length}
              ref={input}
              accessibilityLabel={
                summing ? "Sum of the factors" : "Add a factor"
              }
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={summing ? 6 : 2}
              onSubmitEditing={onAdd}
              submitBehavior="submit"
              returnKeyType="next"
              style={[styles.box, styles.input, cellStyle, textStyle]}
            />
          </Animated.View>
          {!summing && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add factor"
              onPress={onAdd}
              style={[styles.plusButton, cellStyle]}
            >
              <Text style={styles.plus}>+</Text>
            </Pressable>
          )}
        </View>
      </View>
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
    marginLeft: 6,
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
