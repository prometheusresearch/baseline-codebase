// @flow

import { useEffect, useState } from "react";

/**
 * Works like useState but persists data in a storage (either localStorage or
 * sessionStorage).
 */
export function useStorage<T>(
  storage: Storage,
  key: string,
  initValue: () => T,
): [T, (value: T) => void] {
  let [state, setState] = useState<T>(() => {
    let initialValue = initValue();
    try {
      let serializedState = storage.getItem(key);
      if (serializedState == null) {
        serializedState = JSON.stringify(initialValue);
        storage.setItem(key, serializedState ?? "null");
        return initialValue;
      } else {
        return JSON.parse(serializedState) ?? initialValue;
      }
    } catch {
      // If user is in private mode or has storage restriction
      // storage can throw. JSON.parse and JSON.stringify
      // cat throw, too.
      return initialValue;
    }
  });

  // We use useEffect to persist the value b/c we want only to persist values
  // "commited" to UI.
  useEffect(() => {
    try {
      let serializedState = JSON.stringify(state);
      storage.setItem(key, serializedState ?? "null");
    } catch {
      // If user is in private mode or has storage restriction
      // localStorage/sessionStorage can throw. Also JSON.stringify can throw.
    }
  }, [storage, key, state]);

  return [state, setState];
}
