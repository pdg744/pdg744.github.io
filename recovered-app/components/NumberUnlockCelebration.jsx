import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';

const confetti = Array.from({ length: 12 }, (_, index) => ({
  angle: index * Math.PI / 6,
  color: [Colors.gold, Colors.teal, Colors.orange][index % 3],
}));

export default function NumberUnlockCelebration({ unlockedThrough, ready, reduceMotion }) {
  // Initialize from restored progress so reopening the activity never replays an unlock.
  const seen = useRef(unlockedThrough);
  const animation = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;
  const [range, setRange] = useState(null);
  useEffect(() => () => animation.current?.stop(), []);
  useEffect(() => {
    if (unlockedThrough < seen.current) {
      seen.current = unlockedThrough;
      animation.current?.stop();
      setRange(null);
      return;
    }
    if (!ready || unlockedThrough === seen.current) return;
    const first = seen.current + 1;
    seen.current = unlockedThrough;
    animation.current?.stop();
    setRange(`${first}–${unlockedThrough}`);
    progress.setValue(0);
    animation.current = Animated.sequence([
      Animated.timing(progress, { toValue: 0.25, duration: reduceMotion ? 0 : 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(progress, { toValue: 1, duration: reduceMotion ? 0 : 450, useNativeDriver: true }),
    ]);
    animation.current.start(({ finished }) => { if (finished) setRange(null); });
  }, [unlockedThrough, ready, reduceMotion, progress]);
  if (!range) return null;
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] });
  return <View pointerEvents="none" style={styles.overlay}>
    <Animated.View style={[styles.burst, { opacity }]} accessible={false}>
      {!reduceMotion && confetti.map(({ angle, color }, index) => <Animated.View key={index} style={[styles.particle, {
        backgroundColor: color,
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, Math.cos(angle) * 105, Math.cos(angle) * 125] }) },
          { translateY: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, Math.sin(angle) * 65, Math.sin(angle) * 65 + 30] }) },
          { rotate: `${index * 35}deg` },
        ],
      }]} />)}
    </Animated.View>
    <Animated.View style={[styles.badge, { opacity, transform: [{ scale: reduceMotion ? 1 : progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.7, 1, 1] }) }] }]}>
      <Text accessibilityLiveRegion="polite" style={styles.label}>{range} unlocked!</Text>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: '22%', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 30 },
  burst: { position: 'absolute' },
  particle: { position: 'absolute', width: 7, height: 11, borderRadius: 2 },
  badge: { backgroundColor: Colors.surface, borderColor: Colors.gold, borderWidth: 2, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 16 },
  label: { color: Colors.gold, fontSize: 22, fontWeight: '800', textAlign: 'center' },
});
