import { Pressable } from 'react-native';

// Explicitly mark forward actions; navigation, choices and resets never auto-activate.
export default function AdvanceButton({ enterEnabled = true, ...props }) {
  return <Pressable {...props} dataSet={{ ...props.dataSet, enterAdvance: String(enterEnabled) }} />;
}
