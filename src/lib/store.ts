import { useCallback, useSyncExternalStore } from "react";

/**
 * A minimal module-scoped store. State lives outside the React tree, so it
 * survives route components unmounting/remounting (e.g. navigating to a
 * product detail page and back) without needing prop-drilling or URL state.
 * It resets on a hard page reload, which is the expected/desired behavior.
 */
const state = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function getSnapshot<T>(key: string, initial: T): T {
  if (!state.has(key)) state.set(key, initial);
  return state.get(key) as T;
}

function setSnapshot<T>(key: string, value: T) {
  state.set(key, value);
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => listeners.get(key)?.delete(listener);
}

export function usePersistedState<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => getSnapshot(key, initial),
    () => initial
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getSnapshot(key, initial);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      setSnapshot(key, resolved);
    },
    [key, initial]
  );

  return [value, setValue];
}