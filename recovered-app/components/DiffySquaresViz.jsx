// Recovered from Metro module 671. See ../../recovery/README.md.
import * as React from "react";
import { Animated, View } from "react-native";
import * as Svg from "react-native-svg";
import * as Theme from "../constants/theme.js";
import * as Geometry from "../utils/geometry.js";
Animated.createAnimatedComponent(Svg.Circle);
const AnimatedLine = Animated.createAnimatedComponent(Svg.Line);
const GENERATION_COLORS = [
  Theme.Colors.orange,
  Theme.Colors.teal,
  Theme.Colors.gold,
  Theme.Colors.darkTeal,
  Theme.Colors.deepOrange,
  Theme.Colors.lightTeal,
  Theme.Colors.amber,
  Theme.Colors.navy,
];
const EDGE_DRAW_MS = 600;
const LABEL_DELAY_MS = 600;
const TOTAL_DRAW_MS = 2400;
const VIZ_PADDING = 36;
const LABEL_FADE_THRESHOLD = 60;
function lineLength(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
function midpoints(points) {
  return points.map((t, n) => {
    const r = points[(n + 1) % points.length];
    return [(t[0] + r[0]) / 2, (t[1] + r[1]) / 2];
  });
}
function squareCorners(size, padding) {
  const side = size - 2 * padding;
  return [
    [padding, padding],
    [padding + side, padding],
    [padding + side, padding + side],
    [padding, padding + side],
  ];
}
function DrawingLine({ x1, y1, x2, y2, stroke, strokeWidth, animate, delay }) {
  const length = lineLength(x1, y1, x2, y2);
  const progress = React.useRef(new Animated.Value(animate ? 0 : 1)).current;
  React.useEffect(() => {
    animate &&
      (progress.setValue(0),
      Animated.timing(progress, {
        toValue: 1,
        duration: EDGE_DRAW_MS,
        delay,
        useNativeDriver: false,
      }).start());
  }, [animate]);
  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [length, 0],
  });
  return (
    <AnimatedLine
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={length}
      strokeDashoffset={dashOffset}
    />
  );
}
function SpringLabel({
  cx,
  cy,
  val: value,
  color,
  fontSize,
  animate,
  delay,
  opacity = 1,
}) {
  const scale = React.useRef(new Animated.Value(animate ? 0 : 1)).current;
  React.useEffect(() => {
    animate &&
      (scale.setValue(0),
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 180,
        friction: 8,
      }).start());
  }, [animate]);
  const radius = 1.05 * fontSize;
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: cx - radius,
        top: cy - radius,
        width: 2 * radius,
        height: 2 * radius,
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: [
          {
            scale,
          },
        ],
      }}
    >
      <Svg.default width={2 * radius} height={2 * radius}>
        <Svg.Circle cx={radius} cy={radius} r={radius} fill={"transparent"} />
        <Svg.Text
          x={radius}
          y={radius + 0.38 * fontSize}
          fontSize={fontSize}
          fontWeight={"700"}
          fill={color}
          textAnchor={"middle"}
        >
          {value}
        </Svg.Text>
      </Svg.default>
    </Animated.View>
  );
}
function DiffySquaresViz({
  generations,
  size,
  animateGenIndex,
  suppressNewestLabels = false,
  showLabels = true,
}) {
  const padding = VIZ_PADDING;
  const [labelsReady, setLabelsReady] = React.useState(-1 === animateGenIndex);
  React.useEffect(() => {
    if (-1 === animateGenIndex) return void setLabelsReady(true);
    setLabelsReady(false);
    const e = setTimeout(() => setLabelsReady(true), 2480);
    return () => clearTimeout(e);
  }, [animateGenIndex]);
  const pointsByGeneration = [];
  let points = squareCorners(size, padding);
  pointsByGeneration.push(points);
  for (let t = 1; t < generations.length; t++) {
    points = midpoints(points);
    pointsByGeneration.push(points);
  }
  const centerX = size / 2;
  const centerY = size / 2;
  const generationCount = pointsByGeneration.length;
  return (
    <View
      style={{
        width: size,
        height: size,
      }}
    >
      <Svg.default
        width={size}
        height={size}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {pointsByGeneration
          .map((e, t) => {
            const n = GENERATION_COLORS[t % GENERATION_COLORS.length];
            const r = t === (animateGenIndex ?? -1);
            const s = 0 === t ? 2.5 : 1.5;
            return (
              <Svg.G key={t}>
                {e.map((t, o) => {
                  const l = e[(o + 1) % e.length];
                  return (
                    <DrawingLine
                      x1={t[0]}
                      y1={t[1]}
                      x2={l[0]}
                      y2={l[1]}
                      stroke={n}
                      strokeWidth={s}
                      animate={r}
                      delay={o * LABEL_DELAY_MS}
                      key={o}
                    />
                  );
                })}
              </Svg.G>
            );
          })
          .reverse()}
      </Svg.default>
      {showLabels && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
          }}
        >
          {pointsByGeneration.map((t, n) => {
            const r = GENERATION_COLORS[n % GENERATION_COLORS.length];
            const o = generations[n];
            const s = n === (animateGenIndex ?? -1);
            const h = Math.max(10, 16 - 1 * n);
            if (s && (!labelsReady || suppressNewestLabels)) return null;
            const p = 0 === n;
            if (!p && !(n >= generationCount - 3)) return null;
            const y =
              p && generationCount > 4
                ? Math.max(0.25, 1 - 0.15 * (generationCount - 4))
                : 1;
            return t.map((e, t) => {
              const [l, c] = Geometry.pushFromCenter(
                e[0],
                e[1],
                centerX,
                centerY,
              );
              return (
                <SpringLabel
                  cx={l}
                  cy={c}
                  val={o[t]}
                  color={r}
                  fontSize={h}
                  animate={s}
                  delay={t * LABEL_FADE_THRESHOLD}
                  opacity={y}
                  key={`${n}-${t}`}
                />
              );
            });
          })}
        </View>
      )}
    </View>
  );
}
export default DiffySquaresViz;
export { TOTAL_DRAW_MS };
export { VIZ_PADDING };
