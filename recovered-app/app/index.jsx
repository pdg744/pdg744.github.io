// The original native intro used expo-av. Reconstructed with SDK 55's expo-video.
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { Colors } from "../constants/theme";
import { useSession } from "../context/SessionContext";
export default function IntroScreen() {
  const router = useRouter();
  const { hasSeenIntro, markIntroSeen } = useSession();
  const player = useVideoPlayer(require("../assets/intro.mp4"), (player) => {
    player.muted = true;
    if (!hasSeenIntro()) player.play();
  });
  useEffect(() => {
    return () => {
      markIntroSeen();
    };
  }, [markIntroSeen]);
  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => {
          player.pause();
          markIntroSeen();
          router.push("/topics");
        }}
      >
        <Text style={styles.buttonText}>Start Exploring</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
  },
  video: {
    flex: 1,
    width: "100%",
  },
  button: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 50,
    marginBottom: 64,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
