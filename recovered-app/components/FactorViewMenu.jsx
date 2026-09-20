import { useRef, useState } from "react";
import { Pressable, Switch, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/theme.js";
import { FACTOR_VIEWS } from "../game/factorViews.js";

export default function FactorViewMenu({ value, onChange, disabled, children }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const hasColors = FACTOR_VIEWS.some((view) => value[view.id]);
  function close() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }
  return (
    <View style={{ width: "100%" }}>
      <View style={styles.header}>
        {children}
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel="Pattern views"
        accessibilityHint="Color odds, evens, or primes"
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => open ? close() : setOpen(true)}
        style={styles.trigger}
      >
        <View accessible={false} style={{ gap: 5 }}>
          {[0, 1, 2].map((line) => <View key={line} style={styles.line} />)}
        </View>
        {hasColors && <View style={styles.dot} />}
      </Pressable>
      </View>
      {open && (
          <View style={styles.panel}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>Color all the …</Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close views" style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.options}>
              {FACTOR_VIEWS.map((view) => (
                <View key={view.id} style={styles.option}>
                  <Text style={[styles.optionText, { color: view.color }]}>{view.label}</Text>
                  <Switch
                    accessibilityLabel={view.label}
                    value={!!value[view.id]}
                    onValueChange={(enabled) => onChange({ ...value, [view.id]: enabled })}
                    trackColor={{ false: "#39393D", true: "#34C759" }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#39393D"
                  />
                </View>
              ))}
            </View>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  line: { width: 22, height: 2, borderRadius: 1, backgroundColor: Colors.lightTeal },
  dot: { position: "absolute", right: 5, top: 5, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold },
  panel: { width: "100%", paddingHorizontal: 12, paddingBottom: 10, marginBottom: 8, borderRadius: 16, backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  closeText: { color: Colors.textSecondary, fontSize: 28 },
  options: { flexDirection: "row", justifyContent: "space-around" },
  option: { minHeight: 64, alignItems: "center", justifyContent: "center", gap: 8 },
  optionText: { color: Colors.textPrimary, fontSize: 16 },
});
