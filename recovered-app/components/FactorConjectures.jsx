import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { conjectureEdgeKey, conjectureText, groupConjectureConnections, isConjectureDisproved } from '../game/factorConjectures.js';

export default function FactorConjectures({ conjectures, connections }) {
  const [page, setPage] = useState(0);
  const index = Math.min(page, conjectures.length - 1);
  const conjecture = conjectures[index];
  if (!conjecture) return null;
  const groups = groupConjectureConnections(conjecture, connections);
  const disproved = isConjectureDisproved(conjecture, connections);
  return <View style={styles.container}>
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.topLine}>
          <Text accessibilityLabel={`Conjecture ${index + 1} of ${conjectures.length}`} style={styles.position}>{index + 1} / {conjectures.length}</Text>
          <View style={[styles.statusBadge, disproved && styles.falseBadge]}>
            <Text style={[styles.status, disproved && styles.falseText]}>{disproved ? 'Proven False' : 'Open'}</Text>
          </View>
        </View>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.statement}>{conjectureText(conjecture)}</Text>
      </View>
      <View style={styles.evidenceRow}>
        {[['examples', 'Supporting examples'], ['counterexamples', 'Counterexamples']].map(([key, label]) => (
          <View key={key} style={[styles.group, key === 'counterexamples' && styles.rightGroup]}>
            <Text accessibilityRole="header" style={styles.label}>{label}</Text>
            <View style={styles.results}>
              {groups[key].map((edge) => <Text key={conjectureEdgeKey(edge)} style={styles.result}>{edge.from} → {edge.to}</Text>)}
              {!groups[key].length && <Text style={styles.empty}>None yet</Text>}
            </View>
          </View>
        ))}
      </View>
    </View>
    {conjectures.length > 1 && <View style={styles.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous conjecture" accessibilityState={{ disabled: index === 0 }}
        disabled={index === 0} onPress={() => setPage(index - 1)} style={[styles.arrowButton, index === 0 && styles.disabled]}>
        <Text style={styles.arrow}>←</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Next conjecture" accessibilityState={{ disabled: index === conjectures.length - 1 }}
        disabled={index === conjectures.length - 1} onPress={() => setPage(index + 1)} style={[styles.arrowButton, index === conjectures.length - 1 && styles.disabled]}>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 600, marginTop: 16 },
  card: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 22, overflow: 'hidden' },
  top: { minHeight: 190, padding: 22, gap: 26, justifyContent: 'space-between' },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  position: { color: Colors.textSecondary, fontSize: 15 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.background },
  falseBadge: { backgroundColor: Colors.surfaceAlt },
  status: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  falseText: { color: Colors.lightTeal },
  statement: { color: Colors.textPrimary, fontSize: 24, lineHeight: 33, fontWeight: '600' },
  evidenceRow: { flexDirection: 'row', minHeight: 170, borderTopWidth: 1, borderTopColor: Colors.border },
  group: { flex: 1, minWidth: 0, padding: 14, gap: 16 },
  rightGroup: { borderLeftWidth: 1, borderLeftColor: Colors.border },
  label: { color: Colors.textPrimary, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  results: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  result: { maxWidth: '100%', color: Colors.textPrimary, fontSize: 17, paddingVertical: 6 },
  empty: { color: Colors.textSecondary, fontSize: 14 },
  navigation: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 18 },
  arrowButton: { width: 52, height: 48, borderRadius: 14, borderWidth: 1, borderColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  arrow: { color: Colors.lightTeal, fontSize: 26 },
  disabled: { opacity: 0.25 },
});
