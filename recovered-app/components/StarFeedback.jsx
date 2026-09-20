import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme.js';
import { PRACTICE_TYPES } from '../game/practiceStars.js';
import { usePracticeStars } from '../hooks/usePracticeStars.js';

export default function StarFeedback() {
  const { events } = usePracticeStars();
  const last = events.at(-1);
  const seen = useRef(last?.id);
  const [label, setLabel] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduceMotion(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    if (!last || seen.current === last.id) return;
    seen.current = last.id;
    setLabel(PRACTICE_TYPES.find((type) => type.id === last.type).label);
    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: reduceMotion ? 0 : 140, useNativeDriver: true }),
      Animated.delay(1100),
      Animated.timing(opacity, { toValue: 0, duration: reduceMotion ? 0 : 240, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) setLabel(''); });
    return () => animation.stop();
  }, [last?.id, opacity]);
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 8, opacity,
      transform: [{ translateY: reduceMotion ? 0 : opacity.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
      <Text accessibilityLiveRegion="polite" style={styles.text}>{label ? `★ +1 ${label}` : ''}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', alignSelf: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  text: { color: Colors.gold, fontSize: 14, fontWeight: '700' },
});
