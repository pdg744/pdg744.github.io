// Recovered from Metro module 733. See ../../recovery/README.md.
import * as Router from "expo-router";
import * as React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import * as Theme from "../constants/theme.js";
import * as Session from "../context/SessionContext.js";
import introAsset from "../assets/intro.mp4";
const VIDEO_BOTTOM_SPACE = 100;
function IntroScreen() {
  const router = Router.useRouter();
  const { hasSeenIntro, markIntroSeen } = Session.useSession();
  const buttonOpacity = React.useRef(new Animated.Value(0)).current;
  const seenIntro = hasSeenIntro();
  const videoRef = React.useRef(null);
  const [videoSource] = React.useState(() => introAsset);
  const containerRef = React.useRef(null);
  const [viewport, setViewport] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const [buttonTop, setButtonTop] = React.useState(void 0);
  const updateLayout = () => {
    const e = videoRef.current;
    const t = containerRef.current;
    const n = t?.getBoundingClientRect().height ?? window.innerHeight;
    const o = t?.getBoundingClientRect().width ?? window.innerWidth;
    if (
      (setViewport({
        w: o,
        h: n,
      }),
      !e || !e.videoWidth || !e.videoHeight)
    )
      return;
    const u = e.videoWidth / e.videoHeight;
    const s = n - VIDEO_BOTTOM_SPACE;
    const c = u > o / n ? Math.min(o / u, s) : s;
    const l = (n - VIDEO_BOTTOM_SPACE - c) / 2 + c;
    setButtonTop(l + 0.35 * (n - l));
  };
  React.useEffect(() => {
    seenIntro &&
      (buttonOpacity.setValue(1),
      videoRef.current &&
        (videoRef.current.currentTime = videoRef.current.duration || 9999));
  }, [seenIntro, buttonOpacity]);
  const videoHeight = viewport.h - VIDEO_BOTTOM_SPACE;
  return (
    <View ref={containerRef} style={styles.container} onLayout={updateLayout}>
      <video
        ref={videoRef}
        src={videoSource}
        autoPlay={!seenIntro}
        muted={true}
        playsInline={true}
        onTimeUpdate={() => {
          const e = videoRef.current;
          if (!e || hasSeenIntro()) return;
          e.duration - e.currentTime <= 1.6 &&
            (markIntroSeen(),
            Animated.timing(buttonOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start());
        }}
        onLoadedMetadata={updateLayout}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: videoHeight,
          objectFit: "contain",
          objectPosition: "center center",
        }}
      />
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacity,
            top: buttonTop ?? "80%",
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          style={({ pressed: e }) => [styles.button, e && styles.buttonPressed]}
          onPress={() => router.push("/topics")}
        >
          <Text style={styles.buttonText}>{"Start Exploring"}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.background,
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: Theme.Colors.orange,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 50,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.97,
      },
    ],
  },
  buttonText: {
    color: Theme.Colors.background,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
export default IntroScreen;
