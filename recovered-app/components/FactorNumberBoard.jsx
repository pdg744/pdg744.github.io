import { useMemo } from "react";
import { fitFactorGraph, layoutFactorGraph } from "../game/factorGraph.js";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { factorGraphEdge } from "../game/factorGraphEdge.js";
import { factorViewColor } from "../game/factorViews.js";
import { Colors } from "../constants/theme.js";
import {
  STARTING_NUMBERS,
  explorationLimit,
  MAX_EXPLORATIONS,
} from "../game/factorAndAdd.js";

export default function FactorNumberBoard({
  view = {},
  width,
  availableHeight = 600,
  phase,
  chosen,
  selected,
  connections,
  latest,
  onNumberPress,
  savedFactors = {},
  nodeRefs,
}) {
  const graph = useMemo(
    () => layoutFactorGraph(connections, savedFactors, width),
    [connections, savedFactors, width],
  );
  const { numbers } = graph;
  // Completed destinations (including terminal 1 and self-loops) are settled.
  const highlightedNumber =
    latest?.to > 1 && !connections.some((edge) => edge.from === latest.to)
      ? latest.to
      : null;
  const unexplored = STARTING_NUMBERS.filter(
    (number) => number >= 2 && !numbers.includes(number),
  );
  const pickerRows = Math.ceil(
    unexplored.length / Math.max(1, Math.floor((width + 8) / 50)),
  );
  const frameHeight = Math.max(200, availableHeight - pickerRows * 50 - (unexplored.length ? 66 : 0));
  const { scale, diameter, positions } = fitFactorGraph(graph, width, frameHeight);
  const radius = diameter / 2;
  const graphWidth = width;
  const height = frameHeight;

  return (
    <View style={{ width }}>
      {numbers.length > 0 && (
        <View style={{ width: graphWidth, height }}>
          <Svg
            width={graphWidth}
            height={height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            accessible={false}
          >
            {connections.map((edge) => {
              const isLatest =
                highlightedNumber === edge.to && latest?.from === edge.from;
              const arrow = factorGraphEdge(
                positions.get(edge.from),
                positions.get(edge.to),
                radius,
                scale,
                edge.from === edge.to,
              );
              const color = factorViewColor(edge.from, view) || (isLatest ? Colors.gold : Colors.teal);
              return (
                <G key={`${edge.from}-${edge.to}`} opacity={isLatest || factorViewColor(edge.from, view) ? 1 : 0.55}>
                  <Path
                    d={arrow.shaft}
                    fill="none"
                    stroke={color}
                    strokeWidth={(isLatest ? 2.5 : 1.5) * scale}
                  />
                  <Path d={arrow.head} fill={color} />
                </G>
              );
            })}
          </Svg>
          {numbers.map((number) => {
            const { x, y } = positions.get(number);
            const factors = savedFactors[number]
              ?.slice()
              .sort((a, b) => a - b);
            const isSelected =
              phase === "factors" && selected.includes(number);
            const isChosen = number === chosen && phase !== "choose";
            const completed = connections.some(
              (edge) => edge.from === number,
            );
            const limit = explorationLimit(
              number,
              connections,
              savedFactors,
            );
            const disabled = phase !== "choose" || !!limit;
            const patternColor = factorViewColor(number, view);
            const needsWork = number > 1 && !completed && !limit;
            return (
              <Pressable
                key={number}
                ref={(node) => {
                  if (nodeRefs) nodeRefs.current[number] = node;
                }}
                collapsable={false}
                accessibilityHint={
                  completed
                    ? `Completed.${factors ? ` Factors: ${factors.join(", ")}.` : ""}`
                    : disabled
                      ? limit || "Result node."
                      : factors
                        ? `Saved factors: ${factors.join(", ")}. Open to edit.`
                        : "Needs factoring. Select to continue this branch."
                }
                accessibilityRole="button"
                accessibilityLabel={`${phase === "factors" ? "Factor" : "Number"} ${number}`}
                accessibilityState={{ disabled, selected: isSelected }}
                disabled={disabled}
                onPress={() => onNumberPress(number)}
                style={({ pressed }) => [
                  styles.circle,
                  {
                    left: x - radius,
                    top: y - radius,
                    width: diameter,
                    height: diameter,
                    borderRadius: radius,
                  },
                  (number === 1 || completed || factors) && styles.recorded,
                  isChosen && styles.chosen,
                  isSelected && styles.selected,
                  needsWork && styles.pendingNode,
                  { borderWidth: needsWork ? Math.max(1.5, 2.5 * scale) : (isChosen ? 2.5 : 1.5) * scale },
                  pressed && styles.pressed,
                  patternColor && { backgroundColor: patternColor, borderColor: needsWork ? Colors.gold : patternColor },
                ]}
              >
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[
                    styles.number,
                    {
                      fontSize: Math.min(
                        diameter >= 120 ? 32 : diameter >= 65 ? 26 : 20,
                        diameter * 0.58,
                        diameter / (String(number).length * 0.75),
                      ),
                    },
                    isSelected && styles.selectedNumber,
                    (needsWork || patternColor) && styles.pendingNumber,
                  ]}
                >
                  {number}
                </Text>
                {needsWork && diameter >= 65 && (
                  <Text style={[styles.pendingLabel, { fontSize: diameter < 100 ? 10 : 12 }]}>
                    {factors?.length ? "Continue" : "Factor me"}
                  </Text>
                )}
                {number > 1 && limit && limit !== "Completed" && diameter >= 65 && (
                  <Text
                    style={{
                      color: Colors.textSecondary,
                      fontSize: 10,
                      textAlign: "center",
                    }}
                  >
                    Limit reached
                  </Text>
                )}
                {factors && !needsWork && diameter >= 80 && (
                  <Text
                    numberOfLines={4}
                    style={[
                      styles.factorSummary,
                      patternColor && { color: Colors.background },
                      {
                        fontSize: diameter < 100 ? 11 : 13,
                        lineHeight: diameter < 100 ? 14 : 17,
                      },
                    ]}
                  >
                    {factors.length
                      ? factors.slice(0, 8).join(", ") +
                        (factors.length > 8
                          ? ` +${factors.length - 8}`
                          : "")
                      : "—"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
      {Object.keys(savedFactors).length >= MAX_EXPLORATIONS && (
        <Text style={{ color: Colors.textSecondary, textAlign: "center" }}>
          Graph limit: 128 explored numbers. Start over to explore more.
        </Text>
      )}
      {unexplored.length > 0 && <View
        style={{
          borderTopWidth: numbers.length ? 1 : 0,
          borderTopColor: Colors.border,
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        {unexplored.length > 0 && numbers.length > 0 && (
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 14,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Pick a number
          </Text>
        )}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {unexplored.map((number) => (
            <Pressable
              key={number}
              ref={(node) => {
                if (nodeRefs) nodeRefs.current[number] = node;
              }}
              collapsable={false}
              accessibilityRole="button"
              accessibilityLabel={`Number ${number}`}
              disabled={!!explorationLimit(number, connections, savedFactors)}
              accessibilityHint={
                explorationLimit(number, connections, savedFactors) || undefined
              }
              onPress={() => onNumberPress(number)}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                borderWidth: 1,
                borderColor: Colors.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
                backgroundColor: factorViewColor(number, view) || "transparent",
              })}
            >
              <Text style={{ color: factorViewColor(number, view) ? Colors.background : Colors.textPrimary, fontSize: 16 }}>
                {number}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  recorded: { borderColor: Colors.teal },
  factorSummary: {
    color: Colors.teal,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 12,
    lineHeight: 13,
  },
  chosen: { borderColor: Colors.orange, borderWidth: 2.5 },
  selected: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  pendingNode: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  pendingNumber: { color: Colors.background, fontWeight: "800" },
  pendingLabel: { color: Colors.background, fontWeight: "700", textAlign: "center", marginTop: 2 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  number: { color: Colors.textPrimary, fontSize: 17, fontWeight: "700" },
  selectedNumber: { color: Colors.background },
});
