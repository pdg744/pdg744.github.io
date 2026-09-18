import { forwardRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/theme.js";

const FactorFocusCircle = forwardRef(function FactorFocusCircle(
  { number, factors, size, onRemove, children, showNumber = true },
  ref,
) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {showNumber && <Text style={styles.number}>{number}</Text>}
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={{
          marginTop: factors.length ? 10 : 0,
          maxHeight: size * 0.16,
          flexGrow: 0,
          width: "100%",
          maxWidth: 240,
        }}
        contentContainerStyle={styles.factors}
      >
        {factors.length
          ? [...factors]
              .sort((a, b) => a - b)
              .map((factor) => (
                <Pressable
                  key={factor}
                  accessibilityRole="button"
                  accessibilityLabel={
                    onRemove
                      ? `Remove factor ${factor}`
                      : `Factor ${factor}${factor === number ? ", excluded from sum" : ""}`
                  }
                  disabled={!onRemove}
                  onPress={() => onRemove?.(factor)}
                  style={styles.factor}
                >
                  <Text
                    style={[
                      styles.factorText,
                      !onRemove && factor === number && styles.excluded,
                    ]}
                  >
                    {factor}
                  </Text>
                </Pressable>
              ))
          : null}
      </ScrollView>
      {children}
    </View>
  );
});
export default FactorFocusCircle;
const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    borderColor: Colors.teal,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
  },
  number: { color: Colors.textPrimary, fontSize: 40, fontWeight: "800" },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 16,
  },
  factors: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    maxWidth: 240,
  },
  factor: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  factorText: { color: Colors.teal, fontSize: 17, fontWeight: "700" },
  excluded: {
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
});
