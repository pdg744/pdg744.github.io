import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme.js';
import { activityOverview, readProfile, saveProfile } from '../utils/familyStorage.js';
import PracticeSummary from '../components/PracticeSummary.jsx';
import { practiceStore } from '../utils/practiceStorage.js';
import { featureSettingsStore } from '../utils/featureSettings.js';
import { useFeatureSettings } from '../hooks/useFeatureSettings.js';

export default function ParentScreen() {
  const router = useRouter();
  const settings = useFeatureSettings();
  const [settingsMessage, setSettingsMessage] = useState('');
  const [profile, setProfile] = useState(readProfile);
  const [name, setName] = useState(() => readProfile()?.name ?? '');
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [activities, setActivities] = useState(activityOverview);
  useFocusEffect(useCallback(() => {
    setProfile(readProfile());
    setActivities(activityOverview());
  }, []));
  function save() {
    const result = saveProfile(name);
    if (!result.valid) { setMessage('Enter a name or nickname, up to 40 characters.'); return; }
    setProfile(readProfile());
    setEditing(false);
    setMessage(result.persisted ? '' : 'Your device could not save the profile. It is available for this session only.');
  }
  return <SafeAreaView style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" accessibilityLabel="Home" onPress={() => router.replace('/')} style={styles.link}><Text style={styles.linkText}>←</Text></Pressable>
      <Text style={styles.title}>{profile ? `${profile.name}’s progress` : 'Parent'}</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Student features</Text>
        {['stars', 'conjectures'].map((feature) => <View key={feature} style={styles.settingRow}>
          <Text style={styles.body}>{feature === 'stars' ? 'Stars' : 'Conjectures'}</Text>
          <Switch accessibilityLabel={`Enable ${feature}`} value={settings[feature]} onValueChange={(enabled) => {
            const persisted = featureSettingsStore.set(feature, enabled);
            setSettingsMessage(persisted ? '' : 'This setting applies for this session only. Your device could not save it.');
          }} trackColor={{ true: Colors.teal }} />
        </View>)}
        {!!settingsMessage && <Text accessibilityRole="alert" style={styles.body}>{settingsMessage}</Text>}
      </View>
      <Text style={styles.heading}>Practice</Text>
      <PracticeSummary onSelect={(type, days) => router.push({ pathname: "/practice-details", params: { type, days: days ?? "all" } })} />
      {!profile || editing ? <View style={styles.card}>
        <Text style={styles.heading}>{profile ? 'Edit name' : 'Child’s name'}</Text>
        <TextInput accessibilityLabel="Child’s name" placeholder="Name or nickname" placeholderTextColor={Colors.textSecondary} value={name} onChangeText={setName} maxLength={40}
          autoCapitalize="words" returnKeyType="done" onSubmitEditing={save} style={styles.input} />
        <Pressable accessibilityRole="button" onPress={save} style={styles.button}><Text style={styles.buttonText}>{profile ? 'Save name' : 'Create profile'}</Text></Pressable>
        {profile && <Pressable accessibilityRole="button" onPress={() => { setEditing(false); setName(profile.name); setMessage(''); }} style={styles.link}><Text style={styles.linkText}>Cancel</Text></Pressable>}
        {!profile && <Text style={styles.body}>One child · This device</Text>}
      </View> : <>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/topics')} style={styles.button}><Text style={styles.buttonText}>Child →</Text></Pressable>
        <Text style={styles.heading}>Activities</Text>
        {activities.map((activity) => <View key={activity.id} style={styles.card}>
          <Text style={styles.heading}>{activity.title}</Text>
          <Text style={styles.body}>{activity.detail}</Text>
        </View>)}
        <Pressable accessibilityRole="button" onPress={() => { setName(profile.name); setEditing(true); }} style={styles.link}><Text style={styles.linkText}>Edit name</Text></Pressable>
      </>}
      {!!message && <Text accessibilityRole="alert" style={styles.body}>{message}</Text>}
      <View style={styles.card}>
        {confirmReset ? <>
          <Text style={styles.heading}>Reset practice data?</Text>
          <Text style={styles.body}>This clears all stars and solved and unfinished problem history on this device. Your child’s name and current activities stay saved. This cannot be undone.</Text>
          <Pressable accessibilityRole="button" onPress={() => {
            const persisted = practiceStore.reset();
            setConfirmReset(false);
            setResetMessage(persisted ? 'Practice data reset.' : 'Practice data reset for this session. Your device could not save the reset; old data may return after reopening.');
          }} style={styles.button}><Text style={styles.buttonText}>Reset stars and problem history</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={styles.link}><Text style={styles.linkText}>Cancel</Text></Pressable>
        </> : <Pressable accessibilityRole="button" onPress={() => { setConfirmReset(true); setResetMessage(''); }} style={styles.link}><Text style={styles.linkText}>Reset practice data</Text></Pressable>}
        {!!resetMessage && <Text accessibilityRole="alert" style={styles.body}>{resetMessage}</Text>}
      </View>
      <Text style={styles.note}>Saved on this device only.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, gap: 18, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { color: Colors.textPrimary, fontSize: 30, fontWeight: '800' },
  heading: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 16 },
  body: { color: Colors.textSecondary, fontSize: 16, lineHeight: 24 },
  note: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, gap: 14, borderColor: Colors.border, borderWidth: 1 },
  input: { color: Colors.textPrimary, fontSize: 20, padding: 14, borderWidth: 1, borderColor: Colors.teal, borderRadius: 10 },
  button: { backgroundColor: Colors.orange, padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: Colors.background, fontSize: 17, fontWeight: '800' },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: Colors.teal, fontSize: 16, fontWeight: '600' },
});
