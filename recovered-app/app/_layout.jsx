// Recovered from Metro module 10. See ../../recovery/README.md.
// Install durable, synchronous device storage before any activity mounts.
// Expo excludes this polyfill on web, which keeps the browser's own storage.
import "expo-sqlite/localStorage/install";
import * as Router from "expo-router";
import * as StatusBarModule from "expo-status-bar";
import * as SafeArea from "react-native-safe-area-context";
import * as Theme from "../constants/theme.js";
import StarFeedback from "../components/StarFeedback.jsx";
import { useSyncExternalStore } from "react";
import { featureSettingsStore } from "../utils/featureSettings.js";
function RootLayout() {
  const { stars } = useSyncExternalStore(featureSettingsStore.subscribe, featureSettingsStore.getSnapshot, featureSettingsStore.getSnapshot);
  return (
    <SafeArea.SafeAreaProvider>
      <StatusBarModule.StatusBar style={"light"} />
      <Router.Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Theme.Colors.background,
          },
          animation: "slide_from_right",
        }}
      />
      {stars && <StarFeedback />}
    </SafeArea.SafeAreaProvider>
  );
}
export default RootLayout;
