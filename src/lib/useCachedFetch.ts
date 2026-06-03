import { useEffect, useState, useRef } from "react";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache to persist across page navigations
const fetchCache = new Map<string, CacheEntry<unknown>>();

export function useCachedFetch<T>(
  url: string,
  options?: {
    cacheDuration?: number;
    skip?: boolean;
    defaultValue?: T;
  }
): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => Promise<void> } {
  // Check if we have cached data immediately
  const now = Date.now();
  const cached = fetchCache.get(url) as CacheEntry<T> | undefined;
  const hasCachedData =
    cached && now - cached.timestamp < (options?.cacheDuration ?? CACHE_DURATION);

  const defaultValue = options?.defaultValue ?? null;

  const [data, setData] = useState<T | null>(hasCachedData ? cached!.data : defaultValue);
  const [isLoading, setIsLoading] = useState(!hasCachedData && !defaultValue);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const cacheDuration = options?.cacheDuration ?? CACHE_DURATION;

  const fetchData = async () => {
    try {
      setError(null);

      const now = Date.now();
      const cached = fetchCache.get(url) as CacheEntry<T> | undefined;

      // Use cache if it exists and is fresh
      if (cached && now - cached.timestamp < cacheDuration) {
        if (isMountedRef.current) {
          setData(cached.data);
          setIsLoading(false);
        }
        return;
      }

      // Fetch fresh data
      if (isMountedRef.current) {
        setIsLoading(true);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const newData = (await response.json()) as T;

      // Update cache
      fetchCache.set(url, { data: newData, timestamp: now });

      if (isMountedRef.current) {
        setData(newData);
        setError(null);
        setIsLoading(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (!options?.skip) {
      // Check cache synchronously first
      const now = Date.now();
      const cached = fetchCache.get(url) as CacheEntry<T> | undefined;

      if (cached && now - cached.timestamp < cacheDuration) {
        // Use cached data immediately without loading state
        setData(cached.data);
        setIsLoading(false);
        setError(null);
      } else {
        // No cache or stale, fetch fresh
        fetchData();
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [url, cacheDuration, options?.skip]);

  return { data, isLoading, error, refetch: fetchData };
}
