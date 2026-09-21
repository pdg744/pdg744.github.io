import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { classifyNoticingExample, classifyExample, continueConjectureQuestions, conjectureText } from '../game/factorConjectures.js';

export default function FactorClassify({ value, connections, onChange }) {
  const [retry, setRetry] = useState(false);
  const conjecture = value.conjectures.find((item) => item.kind === (value.targetKind ?? 'size'));
  const edge = value.targetEdge;
  const classified = value.stage === 'classified';
  function choose(group) {
    const next = classifyNoticingExample(value, group);
    setRetry(next === value);
    if (next !== value) onChange(next);
  }
  return <View style={styles.card}>
    <Text style={styles.label}>Conjecture {conjecture.kind === 'size' ? 1 : 2}</Text>
    <Text style={styles.text}>{conjectureText(conjecture)}</Text>
    <Text style={styles.text}>We started with {edge.from} and got back {edge.to}.</Text>
    {classified ? <>
      <Text accessibilityLiveRegion="polite" style={styles.text}>{classifyExample(conjecture, edge) === 'examples'
        ? 'It fits this time. Does it always?' : 'One counterexample is enough!'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Continue" style={styles.button}
        onPress={() => onChange(continueConjectureQuestions(value, connections))}><Text style={styles.action}>→</Text></Pressable>
    </> : <>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => choose('examples')}><Text style={styles.action}>Supports it</Text></Pressable>
        <Pressable accessibilityRole="button" style={styles.button} onPress={() => choose('counterexamples')}><Text style={styles.action}>Proves it wrong</Text></Pressable>
      </View>
      {retry && <Text accessibilityRole="alert" style={styles.label}>Compare the result with the conjecture. Try again.</Text>}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { marginVertical: 12, padding: 16, borderRadius: 16, backgroundColor: Colors.surface, gap: 10 },
  label: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  text: { color: Colors.textPrimary, fontSize: 17, textAlign: 'center', lineHeight: 23 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.teal, borderRadius: 12 },
  action: { color: Colors.lightTeal, fontSize: 17 },
});
