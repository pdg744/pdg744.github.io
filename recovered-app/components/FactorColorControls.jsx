import { Switch, StyleSheet, Text, View } from 'react-native';
import { FACTOR_VIEWS } from '../game/factorViews.js';

export default function FactorColorControls({ value, onChange, disabled }) {
  return <View>
    {FACTOR_VIEWS.map((view) => <View key={view.id} style={styles.row}>
      <Text style={{ color: view.color, fontSize: 16 }}>{view.label}</Text>
      <Switch accessibilityLabel={view.label} disabled={disabled} value={!!value[view.id]}
        onValueChange={(enabled) => onChange({ ...value, [view.id]: enabled })}
        trackColor={{ false: '#39393D', true: view.color }} thumbColor="#FFFFFF" ios_backgroundColor="#39393D" />
    </View>)}
  </View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 16 } });
