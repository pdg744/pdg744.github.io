import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { Colors } from "../constants/theme.js";

import { FACTOR_DIGITS, SUM_DIGITS } from "../game/factorAndAdd.js";

const measure = (node) =>
  new Promise((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) =>
      resolve({ x, y, width, height }),
    );
  });

export default function FactorEntry({
  circleSize,
  entryOpen,
  addAnother,
  onCancelEntry,
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
  const pairList = useRef(null);
  const pairViewport = useRef(null);
  const targets = useRef({});
  const input = useRef(null);
  const secondInput = useRef(null);
  const sumInput = useRef(null);
  const previousMode = useRef(summing);
  const transition = useRef(new Animated.Value(summing ? 1 : 0)).current;
  const [sprites, setSprites] = useState([]);
  const [atSum, setAtSum] = useState(summing);
  const canAdd =
    [value, pairedValue].every(
      (item) =>
        /^\d+$/.test(item) &&
        Number(item) >= 1 &&
        Number.isSafeInteger(Number(item)) &&
        Number(item) <= number,
    ) && [value, pairedValue].some((item) => !factors.includes(Number(item)));
  const addends = factors.filter((factor) => factor !== number);
  const stageHeight = Math.floor(circleSize * (circleSize < 330 ? 0.86 : 0.82));
  const cellSize = 44;
  const sumSize =
    factors.length > 18
      ? 26
      : factors.length > 10
        ? 32
        : circleSize < 330
          ? 34
          : 44;
  const cellStyle = { width: cellSize, height: cellSize, borderRadius: 14 };
  const savedStyle = cellStyle;
  const sumStyle = { width: sumSize, height: sumSize, borderRadius: 10 };
  const textStyle = {
    fontSize:
      number >= 10000 ? 10 : number >= 1000 ? 13 : number >= 100 ? 16 : 20,
  };
  const savedTextStyle = textStyle;
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

  useEffect(() => {
    if (summing) return;
    const frame = requestAnimationFrame(() => {
      if (entryOpen) input.current?.focus();
      else addAnother.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [entryOpen, summing]);

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
          <ScrollView
            ref={pairList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!summing && !sprites.length}
            onContentSizeChange={() => {
              if (!summing) pairList.current?.scrollToEnd({ animated: false });
            }}
            contentContainerStyle={{
              gap: circleSize < 330 ? 4 : 8,
              alignItems: "center",
              paddingBottom: 8,
            }}
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
                    onChangeText={onChange}
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
                    onChangeText={onPairedChange}
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
                <View
                  style={{
                    height: cellSize + 6,
                    paddingTop: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={cellStyle}>
                    {!summing && canAdd && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Add factor pair"
                        onPress={onAdd}
                        style={[
                          styles.plusButton,
                          cellStyle,
                          {
                            backgroundColor: Colors.orange,
                            borderColor: Colors.orange,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.plus, { color: Colors.background }]}
                        >
                          +
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {pairs.length > 0 && !summing && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={onCancelEntry}
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: Colors.textSecondary }}>
                        Cancel
                      </Text>
                    </Pressable>
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Animated.View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        pointerEvents={summing && atSum ? "auto" : "none"}
        aria-hidden={!summing}
        accessibilityElementsHidden={!summing}
        importantForAccessibility={!summing ? "no-hide-descendants" : "auto"}
        style={StyleSheet.absoluteFill}
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
                  if (automaticSum && factor === 1 && sumInputRef)
                    sumInputRef.current = node;
                }}
                collapsable={false}
                style={[styles.box, sumStyle, { opacity: atSum ? 1 : 0 }]}
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
          {!automaticSum && (
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
                maxLength={SUM_DIGITS}
                editable={summing && atSum}
                onSubmitEditing={onAdd}
                submitBehavior="submit"
                returnKeyType="done"
                style={[styles.box, styles.input, sumStyle, textStyle]}
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
                    textStyle.fontSize,
                    textStyle.fontSize,
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
