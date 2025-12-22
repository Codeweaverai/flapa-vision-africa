import { useState, useEffect, useCallback, useRef } from 'react';

// Video cache configuration
const VIDEO_CACHE_NAME = 'video-cache-v1';
const DB_NAME = 'VideoCacheDB';
const DB_STORE_NAME = 'videos';
const MAX_CACHE_SIZE_MB = 500;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
  quality: string;
}

interface NetworkInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface VideoQuality {
  quality: 'auto' | 'low' | 'medium' | 'high' | 'hd';
  maxBitrate: number;
  startLevel: number;
}

// IndexedDB helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME, { keyPath: 'url' });
      }
    };
  });
};

export const useVideoCache = (videoUrl: string) => {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isCaching, setIsCaching] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<VideoQuality>({
    quality: 'auto',
    maxBitrate: 5000000,
    startLevel: -1
  });
  const [isPreloaded, setIsPreloaded] = useState(false);
  const preloadRef = useRef<HTMLVideoElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get network quality based on connection
  const getNetworkQuality = useCallback((): VideoQuality => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (!connection) {
      return { quality: 'auto', maxBitrate: 5000000, startLevel: -1 };
    }

    const info: NetworkInfo = {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 50,
      saveData: connection.saveData || false
    };

    // Adjust quality based on network conditions
    if (info.saveData) {
      return { quality: 'low', maxBitrate: 500000, startLevel: 0 };
    }

    switch (info.effectiveType) {
      case 'slow-2g':
        return { quality: 'low', maxBitrate: 250000, startLevel: 0 };
      case '2g':
        return { quality: 'low', maxBitrate: 500000, startLevel: 0 };
      case '3g':
        return { quality: 'medium', maxBitrate: 1500000, startLevel: 1 };
      case '4g':
      default:
        if (info.downlink >= 10) {
          return { quality: 'hd', maxBitrate: 8000000, startLevel: -1 };
        } else if (info.downlink >= 5) {
          return { quality: 'high', maxBitrate: 5000000, startLevel: -1 };
        } else {
          return { quality: 'medium', maxBitrate: 2500000, startLevel: 2 };
        }
    }
  }, []);

  // Monitor network changes
  useEffect(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    const updateQuality = () => {
      setNetworkQuality(getNetworkQuality());
    };

    updateQuality();

    if (connection) {
      connection.addEventListener('change', updateQuality);
      return () => connection.removeEventListener('change', updateQuality);
    }
  }, [getNetworkQuality]);

  // Check if URL is cacheable (direct video file)
  const isCacheable = useCallback((url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    
    // Only cache direct video files, not streaming or third-party
    const cacheableExtensions = ['.mp4', '.webm', '.ogg', '.ogv'];
    const isDirectFile = cacheableExtensions.some(ext => lowerUrl.includes(ext));
    const isThirdParty = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 
                          'twitch.tv', 'facebook.com', 'fb.watch', 'wistia.com', 
                          'soundcloud.com', '.m3u8', '.mpd'].some(domain => lowerUrl.includes(domain));
    
    return isDirectFile && !isThirdParty;
  }, []);

  // Get cached video from IndexedDB
  const getCachedVideo = useCallback(async (url: string): Promise<string | null> => {
    if (!isCacheable(url)) return null;

    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(DB_STORE_NAME, 'readonly');
        const store = transaction.objectStore(DB_STORE_NAME);
        const request = store.get(url);

        request.onsuccess = () => {
          const entry: CacheEntry | undefined = request.result;
          if (entry && Date.now() - entry.timestamp < MAX_CACHE_AGE_MS) {
            const blobUrl = URL.createObjectURL(entry.blob);
            resolve(blobUrl);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }, [isCacheable]);

  // Save video to IndexedDB
  const cacheVideo = useCallback(async (url: string, blob: Blob) => {
    try {
      const db = await openDB();
      const entry: CacheEntry = {
        url,
        blob,
        timestamp: Date.now(),
        size: blob.size,
        quality: networkQuality.quality
      };

      const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(DB_STORE_NAME);
      store.put(entry);
    } catch (error) {
      console.error('Failed to cache video:', error);
    }
  }, [networkQuality.quality]);

  // Clean up old cache entries
  const cleanupCache = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(DB_STORE_NAME);
      const request = store.openCursor();

      let totalSize = 0;
      const entriesToDelete: string[] = [];
      const now = Date.now();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry: CacheEntry = cursor.value;
          
          // Mark old entries for deletion
          if (now - entry.timestamp > MAX_CACHE_AGE_MS) {
            entriesToDelete.push(entry.url);
          } else {
            totalSize += entry.size;
          }
          cursor.continue();
        } else {
          // Delete old entries
          entriesToDelete.forEach(url => store.delete(url));
          
          // If still over limit, delete oldest entries
          if (totalSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
            console.log('Cache size exceeded, cleanup needed');
          }
        }
      };
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }, []);

  // Preload video
  const preloadVideo = useCallback(async (url: string) => {
    if (!url || !isCacheable(url)) {
      setIsPreloaded(true);
      return;
    }

    // Check if already cached
    const cached = await getCachedVideo(url);
    if (cached) {
      setCachedUrl(cached);
      setIsPreloaded(true);
      return;
    }

    setIsCaching(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        cache: 'force-cache'
      });

      if (response.ok) {
        const blob = await response.blob();
        await cacheVideo(url, blob);
        const blobUrl = URL.createObjectURL(blob);
        setCachedUrl(blobUrl);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Preload failed:', error);
      }
    } finally {
      setIsCaching(false);
      setIsPreloaded(true);
    }
  }, [isCacheable, getCachedVideo, cacheVideo]);

  // Initialize on URL change
  useEffect(() => {
    setCachedUrl(null);
    setIsPreloaded(false);

    if (videoUrl) {
      // Check cache first
      getCachedVideo(videoUrl).then(cached => {
        if (cached) {
          setCachedUrl(cached);
          setIsPreloaded(true);
        } else if (isCacheable(videoUrl)) {
          // Preload in background
          preloadVideo(videoUrl);
        } else {
          setIsPreloaded(true);
        }
      });
    }

    // Cleanup old cache periodically
    cleanupCache();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Revoke blob URL on cleanup
      if (cachedUrl && cachedUrl.startsWith('blob:')) {
        URL.revokeObjectURL(cachedUrl);
      }
    };
  }, [videoUrl]);

  // Get optimized HLS options based on network
  const getHlsOptions = useCallback(() => ({
    enableWorker: true,
    lowLatencyMode: networkQuality.quality === 'low',
    backBufferLength: networkQuality.quality === 'low' ? 30 : 90,
    maxBufferLength: networkQuality.quality === 'low' ? 15 : 30,
    maxMaxBufferLength: networkQuality.quality === 'low' ? 60 : 600,
    startLevel: networkQuality.startLevel,
    capLevelToPlayerSize: true,
    maxLoadingDelay: networkQuality.quality === 'low' ? 2 : 4,
    manifestLoadingTimeOut: 10000,
    manifestLoadingMaxRetry: 4,
    levelLoadingTimeOut: 10000,
    fragLoadingTimeOut: 20000,
  }), [networkQuality]);

  // Get file config with preload
  const getFileConfig = useCallback(() => ({
    attributes: {
      controlsList: 'nodownload noremoteplayback',
      preload: networkQuality.quality === 'low' ? 'metadata' : 'auto',
      crossOrigin: 'anonymous',
      playsInline: true,
    },
    forceVideo: true,
    forceAudio: false,
  }), [networkQuality.quality]);

  return {
    effectiveUrl: cachedUrl || videoUrl,
    isCaching,
    isPreloaded,
    networkQuality,
    getHlsOptions,
    getFileConfig,
    preloadVideo,
    isCacheable: isCacheable(videoUrl)
  };
};

// Hook for preloading next video
export const useVideoPreloader = () => {
  const preloadQueue = useRef<string[]>([]);
  const preloadedUrls = useRef<Set<string>>(new Set());

  const addToPreloadQueue = useCallback((urls: string[]) => {
    const newUrls = urls.filter(url => 
      url && 
      !preloadedUrls.current.has(url) && 
      !preloadQueue.current.includes(url)
    );
    preloadQueue.current.push(...newUrls);
    processQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (preloadQueue.current.length === 0) return;

    const url = preloadQueue.current.shift();
    if (!url || preloadedUrls.current.has(url)) {
      processQueue();
      return;
    }

    try {
      // Use link preload for browser-level caching
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = url;
      document.head.appendChild(link);

      preloadedUrls.current.add(url);

      // Remove link after short delay
      setTimeout(() => {
        link.remove();
      }, 5000);
    } catch (error) {
      console.error('Preload queue error:', error);
    }

    // Process next after delay
    setTimeout(processQueue, 1000);
  }, []);

  return { addToPreloadQueue };
};
