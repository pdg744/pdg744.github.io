import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { attentionProblems, readAttempts } from '../utils/problemAttempts.js';
import { usePracticeStars } from '../hooks/usePracticeStars.js';

function duration(ms) {
  if (ms === undefined) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 1) return '<1s';
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function ProblemHistory({ type, days = null }) {
  const { events } = usePracticeStars();
  const [limit, setLimit] = useState(20);
  const problems = attentionProblems(events, readAttempts(), type, days);
  return <View style={styles.card}>
    <View style={styles.row}><Text style={styles.muted}>Problem</Text><Text style={styles.muted}>Time</Text></View>
    {!problems.length && <Text style={styles.muted}>No problems yet.</Text>}
    {problems.slice(0, limit).map((event) => <View key={event.id} style={styles.entry}>
      <View style={styles.row}>
        <Text style={[styles.text, styles.equation]}>{event.unfinished ? event.label : `${event.problem.operands.join(type === 'multiplication' ? ' × ' : type === 'addition' ? ' + ' : ' − ')} = ${event.problem.answer}`}</Text>
        <Text style={styles.text}>{duration(event.durationMs)}</Text>
      </View>
      {event.unfinished && <Text style={[styles.date, { color: Colors.gold }]}>Unfinished</Text>}
      <Text style={styles.date}>{new Date(event.at).toLocaleString()}</Text>
    </View>)}
    {problems.length > limit && <Pressable accessibilityRole="button" onPress={() => setLimit(limit + 20)} style={styles.filter}><Text style={styles.text}>More</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  filter: { paddingHorizontal: 12, minHeight: 44, justifyContent: 'center', borderRadius: 10 },
  selected: { backgroundColor: Colors.surfaceAlt },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  entry: { borderTopWidth: 1, borderColor: Colors.border, paddingTop: 12, gap: 6 },
  equation: { flex: 1 },
  text: { color: Colors.textPrimary, fontSize: 16 },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  date: { color: Colors.textSecondary, fontSize: 12 },
});
