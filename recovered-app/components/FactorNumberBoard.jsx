import { useMemo } from "react";
import { layoutFactorGraph } from "../game/factorGraph.js";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Defs, Marker } from "react-native-svg";
import { Colors } from "../constants/theme.js";
import { STARTING_NUMBERS } from "../game/factorAndAdd.js";

export default function FactorNumberBoard({
  width,
  phase,
  chosen,
  selected,
  connections,
  latest,
  onNumberPress,
  savedFactors = {},
  nodeRefs,
}) {
  const { numbers, positions, diameter, height } = useMemo(
    () => layoutFactorGraph(connections, savedFactors, width),
    [connections, savedFactors, width],
  );
  const radius = diameter / 2;
  const unexplored = STARTING_NUMBERS.filter(
    (number) => number >= 2 && !numbers.includes(number),
  );

  function edgePath({ from, to }) {
    const a = positions.get(from),
      b = positions.get(to);
    if (from === to)
      return `M ${a.x - radius * 0.55} ${a.y - radius * 0.84} C ${a.x - radius * 1.4} ${a.y - radius - 40}, ${a.x + radius * 1.4} ${a.y - radius - 40}, ${a.x + radius * 0.55} ${a.y - radius * 0.84}`;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      length = Math.hypot(dx, dy);
    const ux = dx / length,
      uy = dy / length;
    const bend = Math.min(28, length * 0.15);
    return `M ${a.x + ux * radius} ${a.y + uy * radius} Q ${(a.x + b.x) / 2 - uy * bend} ${(a.y + b.y) / 2 + ux * bend} ${b.x - ux * (radius + 5)} ${b.y - uy * (radius + 5)}`;
  }

  return (
    <View style={{ width }}>
      {numbers.length > 0 && (
        <View style={{ width, height }}>
          <Svg
            width={width}
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
                latest?.from === edge.from && latest?.to === edge.to;
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
            const factors = savedFactors[number]?.slice().sort((a, b) => a - b);
            const isSelected = phase === "factors" && selected.includes(number);
            const isChosen = number === chosen && phase !== "choose";
            const disabled =
              phase === "sum" ||
              (phase === "choose" && (number < 2 || number > 30)) ||
              (phase === "factors" && !STARTING_NUMBERS.includes(number));
            return (
              <Pressable
                key={number}
                ref={(node) => {
                  if (nodeRefs) nodeRefs.current[number] = node;
                }}
                collapsable={false}
                accessibilityHint={
                  factors
                    ? `Saved factors: ${factors.join(", ")}. Open to edit.`
                    : undefined
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
                  factors && styles.recorded,
                  isChosen && styles.chosen,
                  isSelected && styles.selected,
                  phase === "choose" && disabled && styles.unavailable,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[
                    styles.number,
                    isSelected && styles.selectedNumber,
                    number > 999 && { fontSize: 11 },
                  ]}
                >
                  {number}
                </Text>
                {factors && (
                  <Text
                    numberOfLines={4}
                    style={[
                      styles.factorSummary,
                      { fontSize: diameter < 90 ? 9 : 11 },
                    ]}
                  >
                    {factors.length
                      ? factors.slice(0, 8).join(", ") +
                        (factors.length > 8 ? ` +${factors.length - 8}` : "")
                      : "—"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
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
  unavailable: { opacity: 0.5 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  number: { color: Colors.textPrimary, fontSize: 17, fontWeight: "700" },
  selectedNumber: { color: Colors.background },
});
