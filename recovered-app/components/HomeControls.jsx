import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Colors } from '../constants/theme.js';
import { practiceStore } from '../utils/practiceStorage.js';
import { featureSettingsStore } from '../utils/featureSettings.js';
import { readAttempts } from '../utils/problemAttempts.js';
import { usePracticeStars } from '../hooks/usePracticeStars.js';
import { useFeatureSettings } from '../hooks/useFeatureSettings.js';

export default function HomeControls() {
  const settings = useFeatureSettings();
  const { events } = usePracticeStars();
  const hasPracticeData = events.length > 0 || readAttempts().length > 0;
  const [settingsMessage, setSettingsMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  return <View style={styles.panel}>
        {['stars', 'conjectures'].map((feature) => <View key={feature} style={styles.settingRow}>
          <Text style={styles.body}>{feature === 'stars' ? 'Stars' : 'Conjectures'}</Text>
          <Switch accessibilityLabel={`Enable ${feature}`} value={settings[feature]} onValueChange={(enabled) => {
            const persisted = featureSettingsStore.set(feature, enabled);
            setSettingsMessage(persisted ? '' : 'This setting applies for this session only. Your device could not save it.');
          }} trackColor={{ true: Colors.teal }} />
        </View>)}
        {!!settingsMessage && <Text accessibilityRole="alert" style={styles.body}>{settingsMessage}</Text>}
      {hasPracticeData && <View style={styles.reset}>
        {confirmReset ? <>
          <Text style={styles.heading}>Reset practice data?</Text>
          <Text style={styles.note}>Saved on this device only.</Text>
          <Text style={styles.body}>This clears all stars and solved and unfinished problem history on this device. Current activities stay saved. This cannot be undone.</Text>
          <Pressable accessibilityRole="button" onPress={() => {
            const persisted = practiceStore.reset();
            setConfirmReset(false);
            setResetMessage(persisted ? '' : 'Practice data reset for this session. Your device could not save the reset; old data may return after reopening.');
          }} style={styles.button}><Text style={styles.buttonText}>Reset stars and problem history</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={styles.link}><Text style={styles.linkText}>Cancel</Text></Pressable>
        </> : <Pressable accessibilityRole="button" onPress={() => { setConfirmReset(true); setResetMessage(''); }} style={styles.link}><Text style={styles.linkText}>Reset practice data</Text></Pressable>}
      </View>}
      {!!resetMessage && <Text accessibilityRole="alert" style={styles.body}>{resetMessage}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { width: '100%', maxWidth: 360, alignSelf: 'flex-end', marginTop: 8, backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, padding: 16, borderRadius: 12, gap: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 16 },
  heading: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  body: { color: Colors.textSecondary, fontSize: 16, lineHeight: 24 },
  note: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  reset: { borderTopColor: Colors.border, borderTopWidth: 1, paddingTop: 8, gap: 8 },
  button: { backgroundColor: Colors.orange, padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: Colors.background, fontSize: 16, fontWeight: '700' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: Colors.teal, fontSize: 16, fontWeight: '600' },
});
