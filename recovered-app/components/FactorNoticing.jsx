import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { conjectureFromExample, numberChange, numberParity } from '../game/factorConjectures.js';

function Choices({ options, value, onChange, label, stacked = false, disabled = false }) {
  return (
    <View style={[styles.choices, stacked && styles.stackedChoices]} accessibilityLabel={label}>
      {options.map((option) => (
        <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={`${label}: ${option.label}`}
          disabled={disabled} accessibilityState={{ selected: value === option.value, disabled }} onPress={() => onChange(option.value)}
          style={[styles.choice, value === option.value && styles.chosen]}>
          <Text style={[styles.choiceText, value === option.value && { color: Colors.background }]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
function TextEvent({ children, delay = 180 }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    let active = true;
    let animation;
    let timer;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      timer = setTimeout(() => {
        setRevealed(true);
        animation = Animated.timing(progress, {
          toValue: 1, duration: reduceMotion ? 0 : 450,
          easing: Easing.out(Easing.cubic), useNativeDriver: true,
        });
        animation.start();
      }, delay);
    });
    return () => { active = false; clearTimeout(timer); animation?.stop(); };
  }, [progress, delay]);
  return (
    <Animated.View style={[styles.textEvent, { opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {revealed && children}
    </Animated.View>
  );
}

const parityOptions = [{ value: 'even', label: 'even' }, { value: 'odd', label: 'odd' }];

export default function FactorNoticing({ edge, value, onChange }) {
  const [feedback, setFeedback] = useState('');
  const parity = value.stage.startsWith('parity');
  const kind = parity ? 'parity' : 'size';
  const intro = value.stage === `${kind}Intro`;
  const bet = value.stage === `${kind}Bet`;
  const formed = value.stage === `${kind}Conjecture`;
  function choose(field, selection) {
    const next = { ...value, [field]: selection };
    const accurate = parity
      ? next.fromParity === numberParity(edge.from) && next.toParity === numberParity(edge.to)
      : next.sizeChoice === numberChange(edge);
    const ready = parity ? next.fromParity && next.toParity : next.sizeChoice;
    setFeedback(ready && !accurate ? 'Take another look at the numbers.' : '');
    onChange({ ...next, stage: accurate ? `${kind}Bet` : kind });
  }
  function makeConjecture() {
    onChange({ ...value, stage: `${kind}Conjecture`,
      conjectures: [...value.conjectures.filter((c) => c.kind !== kind), conjectureFromExample(kind, edge)] });
  }
  return (
    <View style={styles.card}>
      {intro ? (
        <View style={styles.introRow}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.title, styles.introTitle]}>{parity ? 'I noticed something else!' : 'I noticed something!'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Continue" style={styles.introArrow} onPress={() => onChange({ ...value, stage: kind })}>
            <Text style={styles.arrowText}>→</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.statement}>We started with {edge.from} and got back {edge.to}.</Text>
          {!parity ? (
            <>
              <Text style={styles.statement}>{bet || formed
                ? `The number ${value.sizeChoice === 'same' ? 'stayed the same' : `got ${value.sizeChoice}`}.`
                : 'The number …'}</Text>
              {!bet && !formed && <Choices stacked label="The number" value={value.sizeChoice} onChange={(choice) => choose('sizeChoice', choice)}
                options={[{ value: 'bigger', label: 'got bigger' }, { value: 'smaller', label: 'got smaller' }, { value: 'same', label: 'stayed the same' }]} />}
            </>
          ) : (
            <>
              <Text style={styles.sentence}>We started with an …</Text>
              <Choices disabled={formed} label="Starting number" options={parityOptions} value={value.fromParity} onChange={(choice) => choose('fromParity', choice)} />
              <Text style={styles.sentence}>… and got back an …</Text>
              <Choices disabled={formed} label="Result number" options={parityOptions} value={value.toParity} onChange={(choice) => choose('toParity', choice)} />
            </>
          )}
          {!!feedback && <Text accessibilityRole="alert" style={styles.feedback}>{feedback}</Text>}
          {(bet || formed) && (
            <TextEvent delay={1200}>
              <View style={styles.introRow}>
                <Text accessibilityLiveRegion="polite" style={[styles.title, styles.introTitle]}>I bet that always happens!</Text>
                {!formed && <Pressable accessibilityRole="button" accessibilityLabel="Continue" style={styles.introArrow} onPress={makeConjecture}>
                  <Text style={styles.arrowText}>→</Text>
                </Pressable>}
              </View>
            </TextEvent>
          )}
          {formed && (
            <TextEvent>
              <View style={{ gap: 12 }}>
                <Text accessibilityLiveRegion="polite" style={styles.statement}>Can you prove me wrong?</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Try another number"
                  style={styles.continueButton} onPress={() => onChange({ ...value, stage: parity ? 'done' : 'awaitingExample' })}>
                  <Text style={styles.continueArrow}>→</Text>
                </Pressable>
              </View>
            </TextEvent>
          )}
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 600, padding: 20, borderRadius: 20, backgroundColor: Colors.surface, marginTop: 16, gap: 12 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  introTitle: { flexShrink: 1 },
  introArrow: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  continueButton: { alignSelf: 'center', width: 56, height: 48, borderRadius: 14, backgroundColor: Colors.teal, alignItems: 'center', justifyContent: 'center' },
  continueArrow: { color: Colors.background, fontSize: 28 },
  arrowText: { color: Colors.lightTeal, fontSize: 28 },
  statement: { color: Colors.textPrimary, fontSize: 19, lineHeight: 27, textAlign: 'center' },
  sentence: { color: Colors.textPrimary, fontSize: 17, textAlign: 'center' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  stackedChoices: { flexDirection: 'column', flexWrap: 'nowrap' },
  choice: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.teal, justifyContent: 'center' },
  chosen: { backgroundColor: Colors.teal },
  choiceText: { color: Colors.lightTeal, fontSize: 16, textAlign: 'center' },
  textEvent: { marginTop: 36 },
  feedback: { color: Colors.gold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
