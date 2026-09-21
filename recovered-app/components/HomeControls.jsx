import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { readProgress } from '../utils/progressStorage.js';
import { validateFactorProgress } from '../game/factorProgress.js';
import { Colors } from '../constants/theme.js';
import { practiceStore } from '../utils/practiceStorage.js';
import { featureSettingsStore } from '../utils/featureSettings.js';
import { readAttempts } from '../utils/problemAttempts.js';
import { usePracticeStars } from '../hooks/usePracticeStars.js';
import { useFeatureSettings } from '../hooks/useFeatureSettings.js';

export default function HomeControls() {
  const settings = useFeatureSettings();
  const { events } = usePracticeStars();
  const hasData = {
    stars: events.length > 0 || readAttempts().length > 0,
    conjectures: Boolean(readProgress('factor-and-add', validateFactorProgress)?.noticing),
  };
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(null);
  return <View style={styles.panel}>
    {['stars', 'conjectures'].map((feature) => <View key={feature} style={styles.settingRow}>
      <Text style={[styles.body, { flex: 1 }]}>{feature === 'stars' ? 'Stars' : 'Conjectures'}</Text>
      {settings[feature] && hasData[feature] && <Pressable accessibilityRole="button" accessibilityLabel={`Reset ${feature}`} style={styles.link}
        onPress={() => { setConfirmReset(feature); setMessage(''); }}><Text style={styles.linkText}>Reset</Text></Pressable>}
      <Switch accessibilityLabel={`Enable ${feature}`} value={settings[feature]} onValueChange={(enabled) => {
        setConfirmReset(null);
        const persisted = featureSettingsStore.set(feature, enabled);
        setMessage(persisted ? '' : 'Changes apply for this session only. Your device could not save them.');
      }} trackColor={{ true: Colors.teal }} />
    </View>)}
    {confirmReset && settings[confirmReset] && hasData[confirmReset] && <View style={styles.reset}>
      <Text style={styles.heading}>Reset {confirmReset}?</Text>
      <Text style={styles.body}>{confirmReset === 'stars'
        ? 'Clears stars and problem history on this device. Activities and conjectures stay saved. This cannot be undone.'
        : 'Starts both activities fresh and clears conjectures and counterexamples. Stars and problem history stay saved. This cannot be undone.'}</Text>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
        const persisted = confirmReset === 'stars' ? practiceStore.reset() : featureSettingsStore.resetConjectures();
        setConfirmReset(null);
        setMessage(persisted ? '' : 'Reset for this session only. Your device could not save the reset; old data may return after reopening.');
      }}><Text style={styles.buttonText}>Reset {confirmReset}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setConfirmReset(null)} style={styles.link}><Text style={styles.linkText}>Cancel</Text></Pressable>
    </View>}
    {!!message && <Text accessibilityRole="alert" style={styles.body}>{message}</Text>}
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
