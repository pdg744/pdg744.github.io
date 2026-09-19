import { useMemo } from "react";
import { layoutFactorGraph } from "../game/factorGraph.js";
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Defs, Marker } from "react-native-svg";
import { Colors } from "../constants/theme.js";
import {
  STARTING_NUMBERS,
  explorationLimit,
  MAX_EXPLORATIONS,
} from "../game/factorAndAdd.js";

export default function FactorNumberBoard({
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
  const frameHeight = Math.max(200, availableHeight - pickerRows * 50 - 66);
  const fitScale = Math.min(1, width / graph.width, frameHeight / graph.height);
  // Keep numbers readable when a large graph needs scrolling.
  const scale = Math.max(fitScale, 32 / graph.diameter);
  const diameter = graph.diameter * scale;
  const radius = diameter / 2;
  const graphWidth = Math.max(width, graph.width * scale);
  const height = Math.max(frameHeight, graph.height * scale);
  const positions = new Map(
    [...graph.positions].map(([number, point]) => [
      number,
      {
        x: point.x * scale + (graphWidth - graph.width * scale) / 2,
        y: point.y * scale + (height - graph.height * scale) / 2,
      },
    ]),
  );
  function edgePath({ from, to }) {
    const a = positions.get(from),
      b = positions.get(to);
    if (from === to)
      return `M ${a.x - radius * 0.55} ${a.y - radius * 0.84} C ${a.x - radius * 1.4} ${a.y - radius - 40 * scale}, ${a.x + radius * 1.4} ${a.y - radius - 40 * scale}, ${a.x + radius * 0.55} ${a.y - radius * 0.84}`;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    const ux = dx / length,
      uy = dy / length;
    const bend = 0;
    return `M ${a.x + ux * radius} ${a.y + uy * radius} Q ${(a.x + b.x) / 2 - uy * bend} ${(a.y + b.y) / 2 + ux * bend} ${b.x - ux * (radius + 5)} ${b.y - uy * (radius + 5)}`;
  }

  return (
    <View style={{ width }}>
      {numbers.length > 0 && (
        <View>
          <ScrollView
            nestedScrollEnabled
            style={{ height: frameHeight }}
            keyboardShouldPersistTaps="handled"
          >
            <ScrollView
              horizontal
              nestedScrollEnabled
              style={{ width }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ width: graphWidth, height }}>
                <Svg
                  width={graphWidth}
                  height={height}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                  accessible={false}
                >
                  <Defs>
                    <Marker
                      id="connection-arrow"
                      markerWidth="7"
                      markerHeight="7"
                      refX="6"
                      refY="3.5"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <Path d="M 0 0 L 7 3.5 L 0 7 Z" fill={Colors.teal} />
                    </Marker>
                    <Marker
                      id="latest-arrow"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <Path d="M 0 0 L 8 4 L 0 8 Z" fill={Colors.gold} />
                    </Marker>
                  </Defs>
                  {connections.map((edge) => {
                    const isLatest =
                      highlightedNumber === edge.to && latest?.from === edge.from;
                    return (
                      <Path
                        key={`${edge.from}-${edge.to}`}
                        d={edgePath(edge)}
                        fill="none"
                        stroke={isLatest ? Colors.gold : Colors.teal}
                        strokeWidth={isLatest ? 2.5 : 1.5}
                        opacity={isLatest ? 1 : 0.55}
                        markerEnd={`url(#${isLatest ? "latest-arrow" : "connection-arrow"})`}
                      />
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
                              : "Explore this number."
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
                        highlightedNumber === number && styles.latestNode,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        style={[
                          styles.number,
                          {
                            fontSize:
                              diameter >= 120 ? 28 : diameter >= 65 ? 22 : 16,
                          },
                          isSelected && styles.selectedNumber,
                          number > 999 && { fontSize: 11 },
                        ]}
                      >
                        {number}
                      </Text>
                      {number > 1 && limit && limit !== "Completed" && (
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
                      {factors && diameter >= 80 && (
                        <Text
                          numberOfLines={4}
                          style={[
                            styles.factorSummary,
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
            </ScrollView>
          </ScrollView>
        </View>
      )}
      {Object.keys(savedFactors).length >= MAX_EXPLORATIONS && (
        <Text style={{ color: Colors.textSecondary, textAlign: "center" }}>
          Graph limit: 128 explored numbers. Start over to explore more.
        </Text>
      )}
      <View
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
              })}
            >
              <Text style={{ color: Colors.textPrimary, fontSize: 16 }}>
                {number}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
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
  latestNode: { borderColor: Colors.gold, borderWidth: 2.5 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  number: { color: Colors.textPrimary, fontSize: 17, fontWeight: "700" },
  selectedNumber: { color: Colors.background },
});
