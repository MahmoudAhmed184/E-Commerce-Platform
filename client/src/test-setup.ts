function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length(): number {
      return values.size;
    },
    clear(): void {
      values.clear();
    },
    getItem(key: string): string | null {
      return values.get(String(key)) ?? null;
    },
    key(index: number): string | null {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      values.delete(String(key));
    },
    setItem(key: string, value: string): void {
      values.set(String(key), String(value));
    },
  };
}

function ensureStorage(name: 'localStorage' | 'sessionStorage'): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  const storage = descriptor && 'value' in descriptor ? descriptor.value : undefined;

  if (
    storage &&
    typeof storage.clear === 'function' &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return;
  }

  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    value: createMemoryStorage(),
  });
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');
