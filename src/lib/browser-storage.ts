/** The part of the Web Storage API these helpers use. */
export interface KeyValueStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export interface JsonStorage<T> {
  get: () => T | null
  set: (value: T) => void
  clear: () => void
}

/**
 * Stores one JSON value under a key. A value that is missing, is not JSON or
 * fails `isValid` reads as null. Accessing localStorage throws when the
 * browser blocks site data; then reads return null and writes do nothing,
 * so the value lasts only while the page is open.
 */
export function createJsonStorage<T>(
  storage: KeyValueStorage,
  key: string,
  isValid: (value: unknown) => value is T,
): JsonStorage<T> {
  let memory: T | null = null

  return {
    get() {
      try {
        const raw = storage.getItem(key)
        if (raw === null) {
          return null
        }
        const parsed: unknown = JSON.parse(raw)
        return isValid(parsed) ? parsed : null
      } catch {
        return memory
      }
    },
    set(value) {
      memory = value
      try {
        storage.setItem(key, JSON.stringify(value))
      } catch {
        // Kept in memory only. See the comment above.
      }
    },
    clear() {
      memory = null
      try {
        storage.removeItem(key)
      } catch {
        // Nothing stored. See the comment above.
      }
    },
  }
}

/** Returns the identifier stored under `key`, creating it on first use. */
export function getOrCreateId(
  storage: KeyValueStorage,
  key: string,
  createId: () => string,
): string {
  try {
    const stored = storage.getItem(key)
    if (stored) {
      return stored
    }
    const id = createId()
    storage.setItem(key, id)
    return id
  } catch {
    return createId()
  }
}
