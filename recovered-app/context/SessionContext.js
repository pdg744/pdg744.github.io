// Recovered from Metro module 669. See ../../recovery/README.md.
import * as React from "react";
export function useSession() {
  return React.useContext(SessionContext);
}
const SessionContext = React.createContext({
  hasSeenIntro: () => false,
  markIntroSeen: () => {},
});
export { SessionContext };
