import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// The keyboard can report its final layout in a single step, especially on
// dismissal. Animate both the circle's center and size from the same height.
export default function FactorEntryFrame({ size, hidden, reduceMotion, children }) {
  const height = useRef(new Animated.Value(size)).current;
  const measuredHeight = useRef(null);
  useEffect(() => () => height.stopAnimation(), [height]);
  const scale = height.interpolate({
    inputRange: [0, size], outputRange: [0, 1], extrapolate: 'clamp',
  });
  return <View style={styles.area} onLayout={(event) => {
    const next = Math.max(0, event.nativeEvent.layout.height);
    const previous = measuredHeight.current;
    if (next === previous) return;
    measuredHeight.current = next;
    height.stopAnimation();
    if (previous === null || next < previous || reduceMotion || hidden) {
      height.setValue(next);
    } else {
      Animated.timing(height, {
        toValue: next,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }}>
    <Animated.View style={{
      position: 'absolute', width: size, height: size,
      left: '50%', marginLeft: -size / 2,
      top: Animated.divide(Animated.subtract(height, size), 2),
      transform: [{ scale }], opacity: hidden ? 0 : 1,
    }}>
      {children}
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  area: { flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' },
});
