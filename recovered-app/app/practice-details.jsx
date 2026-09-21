import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProblemHistory from '../components/ProblemHistory.jsx';
import { PRACTICE_TYPES } from '../game/practiceStars.js';
import { Colors } from '../constants/theme.js';

export default function PracticeDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const type = PRACTICE_TYPES.find((item) => item.id === params.type) ?? PRACTICE_TYPES[0];
  const days = params.days === '7' ? 7 : null;
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to parent" onPress={() => router.canGoBack() ? router.back() : router.replace('/parent')} style={styles.back}><Text style={styles.arrow}>←</Text></Pressable>
      <Text style={styles.title}>{type.label}</Text>
      <Text style={styles.period}>{days ? 'Last 7 days' : 'All time'}</Text>
      <ProblemHistory key={`${type.id}:${days}`} type={type.id} days={days} />
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 24, gap: 18 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  arrow: { color: Colors.teal, fontSize: 22 },
  title: { color: Colors.textPrimary, fontSize: 30, fontWeight: '800' },
  period: { color: Colors.textSecondary, fontSize: 14 },
});
