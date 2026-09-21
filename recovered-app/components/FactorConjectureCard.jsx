import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { classifyExample, classifyNoticingExample, conjectureText, finishConjectureResponse } from '../game/factorConjectures.js';

export default function FactorConjectureCard({ value, conjecture, connections, ready, onChange, onOpen, reduceMotion }) {
  const [retry, setRetry] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const question = value.stage === 'classify';
  const answered = value.stage === 'classified';
  const counterexample = answered && classifyExample(conjecture, value.targetEdge) === 'counterexamples';
  useEffect(() => { setRetry(false); }, [value.targetEdge, value.targetKind]);
  useEffect(() => {
    if (!answered || !ready) return;
    const animation = counterexample && !reduceMotion ? Animated.sequence([
      Animated.spring(pulse, { toValue: 1.06, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true }),
    ]) : null;
    animation?.start();
    const timer = setTimeout(() => onChange(finishConjectureResponse(value, connections)), counterexample ? 2200 : 1200);
    return () => { clearTimeout(timer); animation?.stop(); pulse.setValue(1); };
  }, [answered, ready, counterexample, reduceMotion, value, connections, onChange, pulse]);
  function choose(group) {
    const next = classifyNoticingExample(value, group);
    setRetry(next === value);
    if (next !== value) onChange(next);
  }
  return <View style={styles.card}>
    <Pressable accessibilityRole={onOpen ? 'button' : undefined} disabled={!onOpen} onPress={onOpen}>
      <Text style={styles.statement}>{conjectureText(conjecture)}</Text>
    </Pressable>
    {(question || answered) && <Text style={styles.result}>You found {value.targetEdge.from} → {value.targetEdge.to}.</Text>}
    {answered ? <Animated.Text accessibilityLiveRegion="polite" style={[styles.prompt, counterexample && styles.celebration, { transform: [{ scale: pulse }] }]}>
      {counterexample ? 'You found a counterexample!' : 'Keep looking.'}
    </Animated.Text> : question ? <>
      <Text style={styles.prompt}>Is this a counterexample?</Text>
      <View style={styles.choices}>
        <Pressable accessibilityRole="button" disabled={!ready} style={styles.choice} onPress={() => choose('counterexamples')}><Text style={styles.prompt}>Yes</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={!ready} style={styles.choice} onPress={() => choose('examples')}><Text style={styles.prompt}>No</Text></Pressable>
      </View>
      {retry && <Text accessibilityRole="alert" style={styles.retry}>Take another look.</Text>}
    </> : <Text style={styles.prompt}>Can you find a counterexample?</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, borderRadius: 12, backgroundColor: Colors.surface, gap: 6 },
  statement: { color: Colors.textPrimary, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  result: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21 },
  prompt: { color: Colors.lightTeal, fontSize: 14, lineHeight: 20 },
  choices: { flexDirection: 'row', gap: 12 },
  choice: { minWidth: 64, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.teal, borderRadius: 10 },
  retry: { color: Colors.gold, fontSize: 14 },
  celebration: { color: Colors.gold, fontWeight: '700', marginVertical: 6 },
});
