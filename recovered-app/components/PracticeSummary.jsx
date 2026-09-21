import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { PRACTICE_TYPES, practiceTotals } from '../game/practiceStars.js';
import { usePracticeStars } from '../hooks/usePracticeStars.js';

export default function PracticeSummary({ onSelect }) {
  const { events } = usePracticeStars();
  const [days, setDays] = useState(null);
  const [now, setNow] = useState(Date.now);
  useFocusEffect(useCallback(() => { setNow(Date.now()); }, []));
  const Total = onSelect ? Pressable : View;
  const totals = practiceTotals(events, days, Math.max(now, Date.now()));
  return (
    <View style={styles.card}>
      <View style={styles.periods}>
        {[{ label: 'All time', value: null }, { label: 'Last 7 days', value: 7 }].map((period) => (
          <Pressable key={period.label} accessibilityRole="button" accessibilityState={{ selected: days === period.value }}
            onPress={() => { setDays(period.value); setNow(Date.now()); }}
            style={[styles.period, days === period.value && styles.active]}>
            <Text style={{ color: days === period.value ? Colors.textPrimary : Colors.textSecondary }}>{period.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.totals}>
        {PRACTICE_TYPES.map((type) => (
          <Total key={type.id} style={styles.total} onPress={onSelect ? () => onSelect(type.id, days) : undefined} accessibilityRole={onSelect ? "button" : undefined} accessible accessibilityLabel={`${type.label}: ${totals[type.id]} ${totals[type.id] === 1 ? 'star' : 'stars'}`}>
            <Text style={styles.stars}>★ {totals[type.id].toLocaleString()}</Text>
            <Text style={styles.label}>{type.label}</Text>
          </Total>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  periods: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  period: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10 },
  active: { backgroundColor: Colors.surfaceAlt },
  totals: { flexDirection: 'row', gap: 8 },
  total: { flex: 1, alignItems: 'center', gap: 4 },
  stars: { color: Colors.gold, fontSize: 24, fontWeight: '800' },
  label: { color: Colors.textPrimary, fontSize: 12, textAlign: 'center' },
});
