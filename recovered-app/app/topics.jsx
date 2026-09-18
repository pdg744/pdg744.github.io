// Recovered from Metro module 734. See ../../recovery/README.md.
import * as Router from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Svg from "react-native-svg";
import * as SafeArea from "react-native-safe-area-context";
import * as Theme from "../constants/theme.js";
import logoAsset from "../assets/logo-mark.png";
function DiffyIcon({ size = 48 }) {
  return (
    <Svg.default width={size} height={size} viewBox={"0 0 100 100"}>
      <Svg.Polygon
        points={"8,8 92,8 92,92 8,92"}
        fill={"none"}
        stroke={Theme.Colors.orange}
        strokeWidth={"3"}
        strokeLinejoin={"round"}
      />
      <Svg.Polygon
        points={"50,8 92,50 50,92 8,50"}
        fill={"none"}
        stroke={Theme.Colors.teal}
        strokeWidth={"2.5"}
        strokeLinejoin={"round"}
      />
      <Svg.Polygon
        points={"71,29 71,71 29,71 29,29"}
        fill={"none"}
        stroke={Theme.Colors.gold}
        strokeWidth={"2"}
        strokeLinejoin={"round"}
      />
      <Svg.Polygon
        points={"71,50 50,71 29,50 50,29"}
        fill={"none"}
        stroke={Theme.Colors.darkTeal}
        strokeWidth={"1.75"}
        strokeLinejoin={"round"}
      />
      <Svg.Polygon
        points={"60.5,60.5 39.5,60.5 39.5,39.5 60.5,39.5"}
        fill={"none"}
        stroke={Theme.Colors.deepOrange}
        strokeWidth={"1.5"}
        strokeLinejoin={"round"}
      />
    </Svg.default>
  );
}
const activities = [
  {
    id: "diffy-squares",
    label: "Diffy Squares",
    icon: "diffy-squares",
    description: "Does it always go to zero?",
    color: Theme.Colors.orange,
  },
  {
    id: "factor-and-add",
    label: "Factor and Add",
    emoji: "＋",
    description: "Find factors. Add them. Follow the connections.",
    color: Theme.Colors.teal,
  },
];
function TopicsScreen() {
  const router = Router.useRouter();
  return (
    <SafeArea.SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>{"\u2190 Back"}</Text>
          </Pressable>
          <Image source={logoAsset} style={styles.logo} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {activities.map((o) => (
          <Pressable
            accessibilityRole="button"
            style={({ pressed: e }) => [
              styles.card,
              {
                borderColor: o.color,
              },
              e && styles.cardPressed,
            ]}
            onPress={() => router.push(`/${o.id}`)}
            key={o.id}
          >
            <View style={styles.cardRow}>
              {"diffy-squares" === o.icon ? (
                <View style={styles.cardIconWrapper}>
                  <DiffyIcon size={64} />
                </View>
              ) : (
                <Text style={[styles.cardEmoji, { color: o.color }]}>
                  {o.emoji}
                </Text>
              )}
              <View style={styles.cardText}>
                <Text
                  style={[
                    styles.cardLabel,
                    {
                      color: o.color,
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {o.label}
                </Text>
                <Text style={styles.cardDescription}>{o.description}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeArea.SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 58,
    height: 58,
  },
  backButton: {},
  backText: {
    color: Theme.Colors.teal,
    fontSize: 16,
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Theme.Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
  },
  cardPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardIconWrapper: {},
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardDescription: {
    color: Theme.Colors.textSecondary,
    fontSize: 14,
    fontWeight: "400",
  },
});
export default TopicsScreen;
