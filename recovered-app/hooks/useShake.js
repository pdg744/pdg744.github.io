import { useRef } from "react";
import { Animated } from "react-native";
export function useShake() {
  const anim = useRef(new Animated.Value(0)).current;
  return {
    anim,
    shake: () =>
      Animated.sequence(
        [
          [8, 60],
          [-8, 60],
          [6, 50],
          [-6, 50],
          [0, 40],
        ].map(([toValue, duration]) =>
          Animated.timing(anim, {
            toValue,
            duration,
            useNativeDriver: true,
          }),
        ),
      ).start(),
  };
}
