import { useCallback, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { attemptRecorder } from '../utils/problemAttempts.js';
import { createProblemTimer } from '../utils/problemTimer.js';

export function useProblemTimer(key, enabled, description) {
  const serialized = JSON.stringify(description);
  const timer = useMemo(() => createProblemTimer(key, undefined, undefined,
    serialized ? attemptRecorder(key, JSON.parse(serialized)) : undefined), [key, serialized]);
  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    const update = () => {
      const visible = Platform.OS === 'web' ? globalThis.document?.visibilityState !== 'hidden' : AppState.currentState === 'active';
      if (visible) timer.start(); else timer.pause();
    };
    update();
    const subscription = AppState.addEventListener('change', update);
    const doc = Platform.OS === 'web' ? globalThis.document : null;
    doc?.addEventListener('visibilitychange', update);
    globalThis.addEventListener?.('pagehide', timer.pause);
    const interval = setInterval(timer.checkpoint, 1000);
    return () => {
      clearInterval(interval);
      subscription.remove();
      doc?.removeEventListener('visibilitychange', update);
      globalThis.removeEventListener?.('pagehide', timer.pause);
      timer.pause();
    };
  }, [timer, enabled]));
  return timer;
}
