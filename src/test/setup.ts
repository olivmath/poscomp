import '@testing-library/jest-dom'

if (!globalThis.localStorage) {
  const storage = new Map<string, string>()

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
      get length() {
        return storage.size
      },
    },
    configurable: true,
  })
}
