type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'>;

const fallbackStorage = new Map<string, string>();

const getLocalStorage = (): StorageLike | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
};

const estimateStorageUsage = (): { used: number; quota: number; percent: number } => {
  let used = 0;
  try {
    const storage = getLocalStorage();
    if (storage) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          const value = storage.getItem(key);
          if (value) used += key.length + value.length;
        }
      }
    }
  } catch {
    // estimation failed
  }
  const quota = 5 * 1024 * 1024;
  return { used, quota, percent: (used / quota) * 100 };
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
      const { percent } = estimateStorageUsage();
      if (percent > 80) {
        console.warn(`[safeStorage] Storage usage high: ${percent.toFixed(1)}%`);
      }
    } catch (e) {
      console.error('[safeStorage] Storage quota exceeded', e);
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

  getUsage(): { used: number; quota: number; percent: number } {
    return estimateStorageUsage();
  },
};
