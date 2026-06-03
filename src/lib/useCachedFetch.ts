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
  }
): { data: T | null; isLoading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const cacheDuration = options?.cacheDuration ?? CACHE_DURATION;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = Date.now();
      const cached = fetchCache.get(url) as CacheEntry<T> | undefined;

      // Use cache if it exists and is fresh
      if (cached && now - cached.timestamp < cacheDuration) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
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
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (!options?.skip) {
      fetchData();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [url, cacheDuration, options?.skip]);

  return { data, isLoading, error, refetch: fetchData };
}
