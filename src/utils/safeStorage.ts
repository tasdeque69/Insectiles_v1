type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const fallbackStorage = new Map<string, string>();

const getLocalStorage = (): StorageLike | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
};

export const safeStorage = {
  getItem(key: string): string | null {
    const fallbackValue = fallbackStorage.has(key) ? fallbackStorage.get(key)! : null;
    const storage = getLocalStorage();
    if (storage) {
      try {
        const value = storage.getItem(key);
        return value ?? fallbackValue;
      } catch {
        return fallbackValue;
      }
    }
    return fallbackValue;
  },

  setItem(key: string, value: string): void {
    fallbackStorage.set(key, value);
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      storage.setItem(key, value);
    } catch {
      // fallback memory already updated; continue safely.
    }
  },

  removeItem(key: string): void {
    fallbackStorage.delete(key);
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      storage.removeItem(key);
    } catch {
      // noop
    }
  },
};
