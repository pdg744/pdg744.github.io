import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import logoAsset from '../assets/logo-mark.png';
import { Colors } from '../constants/theme.js';

export default function ActivityHeader({ title, onBack, backLabel = 'Back', disabled = false, children, onLayout }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <View style={styles.header} onLayout={onLayout}>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} disabled={disabled} onPress={() => { close(); onBack(); }} style={styles.trigger}>
        <Text style={styles.arrow}>←</Text>
      </Pressable>
      <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit style={styles.title}>{title}</Text>
      {children ? <Pressable accessibilityRole="button" accessibilityLabel={`${title} options`} accessibilityState={{ expanded: open }} disabled={disabled} onPress={() => setOpen(!open)} style={[styles.trigger, styles.menuTrigger]}>
        <Image source={logoAsset} style={styles.logo} accessible={false} />
        <Text style={styles.arrow}>{open ? '⌃' : '⌄'}</Text>
      </Pressable> : <View style={[styles.trigger, styles.menuTrigger]}><Image source={logoAsset} style={styles.logo} accessibilityLabel="Math Explorers" /></View>}
    </View>
    {open && children && <View style={styles.panel}>{children(close)}</View>}
  </View>;
}
const styles = StyleSheet.create({
  header: { width: '100%', maxWidth: 600, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 58, gap: 8 },
  trigger: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  menuTrigger: { flexDirection: 'row', gap: 4, minWidth: 60 },
  logo: { width: 32, height: 32 },
  arrow: { color: Colors.teal, fontSize: 24 },
  title: { flex: 1, color: Colors.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  panel: { alignSelf: 'flex-end', width: '100%', maxWidth: 320, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, gap: 8, marginBottom: 12 },
});
