import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../constants/theme.js';
import logo from '../assets/logo-mark.png';

function Person({ child, color }) {
  return <Svg width={72} height={80} viewBox="0 0 72 80" accessible={false}>
    <Circle cx="36" cy={child ? 30 : 22} r={child ? 12 : 14} fill="none" stroke={color} strokeWidth="3" />
    <Path d={child ? 'M15 72v-8a21 21 0 0 1 42 0v8' : 'M9 72V61a27 27 0 0 1 54 0v11'} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </Svg>;
}

export default function RoleHome() {
  const router = useRouter();
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={logo} style={styles.logo} accessibilityLabel="Math Explorers" />
      <View style={styles.choices}>
        {[{ label: 'Parent', route: '/parent', color: Colors.teal }, { label: 'Child', route: '/topics', color: Colors.orange }].map(({ label, route, color }) =>
          <Pressable key={label} accessibilityRole="button" onPress={() => router.push(route)}
            style={({ pressed }) => [styles.choice, { borderColor: color, opacity: pressed ? 0.7 : 1 }]}>
            <Person child={label === 'Child'} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>)}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 40 },
  logo: { width: 88, height: 88 },
  choices: { flexDirection: 'row', gap: 16, width: '100%', maxWidth: 480 },
  choice: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 28, borderWidth: 1.5, borderRadius: 20, backgroundColor: Colors.surface },
  label: { fontSize: 24, fontWeight: '800' },
});
