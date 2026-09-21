import { useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { featureSettingsStore } from '../utils/featureSettings.js';

export function useFeatureSettings() {
  useFocusEffect(featureSettingsStore.refresh);
  return useSyncExternalStore(featureSettingsStore.subscribe, featureSettingsStore.getSnapshot, featureSettingsStore.getSnapshot);
}
