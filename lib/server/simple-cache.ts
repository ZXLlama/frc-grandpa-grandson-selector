type CacheEntry<T> = {
  value: T;
  etag?: string;
  expiresAt: number;
};

declare global {
  var __frcSelectorCache:
    | Map<string, CacheEntry<unknown>>
    | undefined;
}

const MAX_ENTRIES = 250;

function getStore() {
  if (!globalThis.__frcSelectorCache) {
    globalThis.__frcSelectorCache = new Map<string, CacheEntry<unknown>>();
  }

  return globalThis.__frcSelectorCache;
}

export function getCacheEntry<T>(key: string): CacheEntry<T> | null {
  const store = getStore();
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  return entry as CacheEntry<T>;
}

export function setCacheEntry<T>(key: string, entry: CacheEntry<T>): void {
  const store = getStore();

  if (!store.has(key) && store.size >= MAX_ENTRIES) {
    const firstKey = store.keys().next().value;

    if (firstKey) {
      store.delete(firstKey);
    }
  }

  store.set(key, entry as CacheEntry<unknown>);
}
