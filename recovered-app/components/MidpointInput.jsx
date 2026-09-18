// Recovered from Metro module 700. See ../../recovery/README.md.
import * as React from "react";
import { Animated, StyleSheet, TextInput } from "react-native";
import * as Theme from "../constants/theme.js";
import * as Shake from "../hooks/useShake.js";
import * as Geometry from "../utils/geometry.js";
function MidpointInput({
  side,
  state,
  value,
  onChangeText,
  inputRef,
  x,
  y,
  genIndex,
  outerSide,
  enterAnim,
  flyX,
  flyY,
  opacityAnim,
}) {
  const { anim: shakeOffset, shake } = Shake.useShake();
  React.useEffect(() => {
    "incorrect" === state && shake();
  }, [state]);
  const boxSize = Geometry.midpointBoxSize(genIndex, outerSide);
  const fontSize = Math.max(9, 16 - 2 * genIndex);
  const borderColor =
    "correct" === state
      ? Theme.Colors.teal
      : "incorrect" === state
        ? Theme.Colors.textError
        : Theme.Colors.gold;
  const backgroundColor =
    "correct" === state
      ? Theme.Colors.surfaceAlt
      : "incorrect" === state
        ? Theme.Colors.surfaceError
        : Theme.Colors.surface;
  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          left: x - boxSize / 2,
          top: y - boxSize / 2,
          opacity: opacityAnim,
          transform: [
            {
              scale: enterAnim,
            },
            {
              translateX: Animated.add(shakeOffset, flyX),
            },
            {
              translateY: flyY,
            },
          ],
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        accessibilityLabel={
          "Difference on " + ["top", "right", "bottom", "left"][side] + " side"
        }
        accessibilityState={{
          disabled: state === "correct",
        }}
        style={[
          styles.input,
          {
            borderColor,
            backgroundColor,
            width: boxSize,
            height: boxSize,
            borderRadius: boxSize / 2,
            fontSize,
          },
        ]}
        keyboardType={"number-pad"}
        maxLength={4}
        value={value}
        editable={"correct" !== state}
        onChangeText={(e) => onChangeText(e, "correct" === state)}
        placeholder={"?"}
        placeholderTextColor={"#444"}
      />
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
  },
  input: {
    borderWidth: 2,
    color: Theme.Colors.textPrimary,
    fontWeight: "700",
    textAlign: "center",
  },
});
export default MidpointInput;
