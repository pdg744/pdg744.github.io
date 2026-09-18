// Recovered from Metro module 699. See ../../recovery/README.md.
import * as React from "react";
import { Animated, PanResponder } from "react-native";
export function usePinchZoom(enabled) {
  const zoomScale = React.useRef(new Animated.Value(1)).current;
  const savedScale = React.useRef(1);
  const startDistance = React.useRef(null);
  const lastTap = React.useRef(0);
  const enabledRef = React.useRef(enabled);
  enabledRef.current = enabled;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        if (!enabledRef.current) return false;
        if (1 === e.nativeEvent.touches.length) {
          const e = Date.now();
          e - lastTap.current < 300 &&
            ((savedScale.current = 1),
            Animated.spring(zoomScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 120,
              friction: 8,
            }).start());
          lastTap.current = e;
          return false;
        }
        return 2 === e.nativeEvent.touches.length;
      },
      onMoveShouldSetPanResponder: (e) =>
        enabledRef.current && 2 === e.nativeEvent.touches.length,
      onPanResponderGrant: (e) => {
        if (!enabledRef.current) return;
        const [t, n] = e.nativeEvent.touches;
        const u = n.pageX - t.pageX;
        const o = n.pageY - t.pageY;
        startDistance.current = Math.sqrt(u * u + o * o);
      },
      onPanResponderMove: (e) => {
        if (!enabledRef.current || null === startDistance.current) return;
        if (2 !== e.nativeEvent.touches.length) return;
        const [t, n] = e.nativeEvent.touches;
        const u = n.pageX - t.pageX;
        const v = n.pageY - t.pageY;
        const h = Math.sqrt(u * u + v * v) / startDistance.current;
        const R = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, savedScale.current * h),
        );
        zoomScale.setValue(R);
      },
      onPanResponderRelease: () => {
        savedScale.current = zoomScale.__getValue();
        startDistance.current = null;
      },
      onPanResponderTerminate: () => {
        savedScale.current = zoomScale.__getValue();
        startDistance.current = null;
      },
    }),
  ).current;
  const resetZoom = React.useCallback(() => {
    savedScale.current = 1;
    Animated.spring(zoomScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [zoomScale]);
  return {
    zoomScale,
    panResponder,
    resetZoom,
  };
}
const MIN_SCALE = 1;
const MAX_SCALE = 6;
