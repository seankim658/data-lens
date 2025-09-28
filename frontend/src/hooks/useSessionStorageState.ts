import { useState, useEffect } from "react";

/**
 * Persist state to session storage.
 * @param key - The key to use for storign the value in sessionStorage.
 * @param initialValue - The initial value to use.
 * @returns A stateful value, and a function to update it.
 */
export function useSessionStorageState<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = sessionStorage.getItem(key);
      return storedValue ? (JSON.parse(storedValue) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
