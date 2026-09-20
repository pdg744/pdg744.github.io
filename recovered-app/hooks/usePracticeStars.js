import { useSyncExternalStore } from 'react';
import { practiceStore } from '../utils/practiceStorage.js';

export function usePracticeStars() {
  return useSyncExternalStore(practiceStore.subscribe, practiceStore.getSnapshot, practiceStore.getSnapshot);
}
