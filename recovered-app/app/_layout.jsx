// Recovered from Metro module 10. See ../../recovery/README.md.
// Install durable, synchronous device storage before any activity mounts.
// Expo excludes this polyfill on web, which keeps the browser's own storage.
import "expo-sqlite/localStorage/install";
import * as Router from "expo-router";
import * as StatusBarModule from "expo-status-bar";
import * as React from "react";
import * as SafeArea from "react-native-safe-area-context";
import * as Theme from "../constants/theme.js";
import * as Session from "../context/SessionContext.js";
function RootLayout() {
  const f = React.useRef(false);
  return (
    <SafeArea.SafeAreaProvider>
      <Session.SessionContext.Provider
        value={{
          hasSeenIntro: () => f.current,
          markIntroSeen: () => {
            f.current = true;
          },
        }}
      >
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
      </Session.SessionContext.Provider>
    </SafeArea.SafeAreaProvider>
  );
}
export default RootLayout;
