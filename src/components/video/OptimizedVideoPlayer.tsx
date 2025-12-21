// src/components/video/OptimizedVideoPlayer.tsx
import React, { useState, useRef, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { Play, Loader2, AlertCircle, Volume2, VolumeX, RefreshCw, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load ReactPlayer for faster initial page load
const ReactPlayer = lazy(() => import('react-player'));

interface OptimizedVideoPlayerProps {
  url: string;
  poster?: string;
  controls?: boolean;
  className?: string;
  onReady?: () => void;
  onError?: (error: any) => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onEnded?: () => void;
  light?: boolean | string;
  playing?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsinline?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  priority?: 'high' | 'low'; // New: Video loading priority
  cacheStrategy?: 'aggressive' | 'conservative' | 'none'; // New: Cache strategy
}

// Enhanced video cache with IndexedDB for persistent caching
interface VideoCacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
  contentType: string;
  duration?: number;
}

class VideoCacheManager {
  private static instance: VideoCacheManager;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'VideoCacheDB';
  private readonly STORE_NAME = 'videos';
  private readonly MAX_CACHE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB like mobile
  private currentCacheSize = 0;

  private constructor() {}

  static getInstance(): VideoCacheManager {
    if (!VideoCacheManager.instance) {
      VideoCacheManager.instance = new VideoCacheManager();
    }
    return VideoCacheManager.instance;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.calculateCacheSize().then(resolve).catch(reject);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  private async calculateCacheSize(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        this.currentCacheSize = request.result.reduce(
          (sum, entry) => sum + (entry.size || 0),
          0
        );
        resolve();
      };
    });
  }

  async getVideo(url: string): Promise<Blob | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          // Update timestamp for LRU
          this.updateTimestamp(url);
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
    });
  }

  async saveVideo(url: string, blob: Blob, duration?: number): Promise<void> {
    if (!this.db) return;

    // Clean up cache before adding new video
    await this.cleanupCache(blob.size);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const entry: VideoCacheEntry = {
        url,
        blob,
        timestamp: Date.now(),
        size: blob.size,
        contentType: blob.type,
        duration,
      };

      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.currentCacheSize += blob.size;
        resolve();
      };
    });
  }

  async isCached(url: string): Promise<boolean> {
    if (!this.db) return false;
    return !!(await this.getVideo(url));
  }

  private async updateTimestamp(url: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.get(url);

    request.onsuccess = () => {
      if (request.result) {
        request.result.timestamp = Date.now();
        store.put(request.result);
      }
    };
  }

  private async cleanupCache(neededSize: number): Promise<void> {
    if (!this.db || this.currentCacheSize + neededSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    const timestampIndex = store.index('timestamp');

    const request = timestampIndex.getAll();

    request.onsuccess = () => {
      const entries = request.result;
      let freedSize = 0;
      const toDelete: string[] = [];

      // Delete oldest entries until we have enough space
      for (const entry of entries) {
        if (this.currentCacheSize - freedSize + neededSize <= this.MAX_CACHE_SIZE) {
          break;
        }
        toDelete.push(entry.url);
        freedSize += entry.size || 0;
      }

      toDelete.forEach(url => store.delete(url));
      this.currentCacheSize -= freedSize;
    };
  }

  async clearCache(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    store.clear();
    this.currentCacheSize = 0;
  }

  async getCacheInfo(): Promise<{ size: number; count: number }> {
    if (!this.db) return { size: 0, count: 0 };

    const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    const countRequest = store.count();
    const size = this.currentCacheSize;

    return new Promise((resolve) => {
      countRequest.onsuccess = () => {
        resolve({ size, count: countRequest.result });
      };
    });
  }
}

// In-memory metadata cache
const videoMetadataCache = new Map<string, { duration: number; isReady: boolean; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Preconnect helper
const preconnectToCDNs = () => {
  const cdns = [
    'https://www.youtube.com',
    'https://player.vimeo.com',
    'https://www.dailymotion.com',
    'https://fast.wistia.net',
    'https://content.jwplatform.com'
  ];
  
  cdns.forEach(cdn => {
    const link = document.querySelector(`link[href="${cdn}"]`);
    if (!link) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = cdn;
      preconnect.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect);
    }
  });
};

// Get video type
const getVideoType = (url: string): string => {
  if (!url) return 'unknown';
  
  if (url.includes('.m3u8')) return 'hls';
  if (url.includes('.mpd')) return 'dash';
  if (url.includes('.mp4')) return 'mp4';
  
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
  if (hostname.includes('vimeo.com')) return 'vimeo';
  if (hostname.includes('dailymotion.com') || hostname.includes('dai.ly')) return 'dailymotion';
  if (hostname.includes('wistia.com') || hostname.includes('wistia.net')) return 'wistia';
  
  return 'file';
};

// Check if URL is streaming
const isStreamingUrl = (url: string): boolean => {
  return url?.includes('.m3u8') || url?.includes('.mpd');
};

// Progressive preloader for MP4 files
class VideoPreloader {
  private static instance: VideoPreloader;
  private cache: Map<string, { promise: Promise<Blob>; timestamp: number }> = new Map();
  private maxConcurrentDownloads = 2;
  private currentDownloads = 0;
  private queue: Array<{ url: string; resolve: (blob: Blob) => void; reject: (error: any) => void }> = [];

  static getInstance(): VideoPreloader {
    if (!VideoPreloader.instance) {
      VideoPreloader.instance = new VideoPreloader();
    }
    return VideoPreloader.instance;
  }

  async preloadVideo(
    url: string, 
    cacheStrategy: 'aggressive' | 'conservative' | 'none' = 'conservative'
  ): Promise<Blob> {
    // Check cache first
    if (this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.promise;
      }
    }

    // Check IndexedDB cache
    const videoCache = VideoCacheManager.getInstance();
    const cachedBlob = await videoCache.getVideo(url);
    if (cachedBlob) {
      const promise = Promise.resolve(cachedBlob);
      this.cache.set(url, { promise, timestamp: Date.now() });
      return promise;
    }

    // Create new download promise
    const promise = new Promise<Blob>((resolve, reject) => {
      this.queueDownload(url, resolve, reject, cacheStrategy);
    });

    this.cache.set(url, { promise, timestamp: Date.now() });
    return promise;
  }

  private async queueDownload(
    url: string,
    resolve: (blob: Blob) => void,
    reject: (error: any) => void,
    strategy: 'aggressive' | 'conservative' | 'none'
  ) {
    this.queue.push({ url, resolve, reject });
    this.processQueue(strategy);
  }

  private async processQueue(strategy: 'aggressive' | 'conservative' | 'none') {
    if (this.currentDownloads >= this.maxConcurrentDownloads || this.queue.length === 0) {
      return;
    }

    this.currentDownloads++;
    const { url, resolve, reject } = this.queue.shift()!;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept-Ranges': 'bytes',
        },
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : null;

      // For conservative strategy, only download first 1MB
      if (strategy === 'conservative' && totalSize && totalSize > 1024 * 1024) {
        const rangeResponse = await fetch(url, {
          headers: {
            'Range': 'bytes=0-1048575', // First 1MB
          }
        });
        const blob = await rangeResponse.blob();
        
        // Store in cache
        const videoCache = VideoCacheManager.getInstance();
        await videoCache.saveVideo(url, blob);
        
        resolve(blob);
      } else {
        // Full download for aggressive strategy
        const blob = await response.blob();
        
        // Store in cache
        const videoCache = VideoCacheManager.getInstance();
        await videoCache.saveVideo(url, blob);
        
        resolve(blob);
      }
    } catch (error) {
      reject(error);
    } finally {
      this.currentDownloads--;
      this.processQueue(strategy);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

const OptimizedVideoPlayer: React.FC<OptimizedVideoPlayerProps> = memo(({
  url,
  poster,
  controls = true,
  className = '',
  onReady,
  onError,
  onProgress,
  onEnded,
  light = false,
  playing: externalPlaying,
  muted: externalMuted = false,
  loop = false,
  playsinline = true,
  preload = 'metadata',
  priority = 'low',
  cacheStrategy = 'conservative'
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoCacheRef = useRef<VideoCacheManager>(VideoCacheManager.getInstance());
  const videoPreloaderRef = useRef<VideoPreloader>(VideoPreloader.getInstance());
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(externalMuted);
  const [showLightPreview, setShowLightPreview] = useState(!!light);
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isCached, setIsCached] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const maxRetries = 3;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const videoType = getVideoType(url);
  const isStreaming = isStreamingUrl(url);

  // Initialize cache
  useEffect(() => {
    videoCacheRef.current.init().catch(console.error);
  }, []);

  // Preconnect to CDNs
  useEffect(() => {
    preconnectToCDNs();
  }, []);

  // Check if video is already cached
  useEffect(() => {
    const checkCache = async () => {
      if (url && !isStreaming && videoType === 'mp4') {
        const cached = await videoCacheRef.current.isCached(url);
        setIsCached(cached);
        if (cached) {
          setIsLoading(false);
        }
      }
    };
    checkCache();
  }, [url, isStreaming, videoType]);

  // Intersection Observer with priority loading
  useEffect(() => {
    const rootMargin = priority === 'high' ? '500px' : '200px';
    const threshold = priority === 'high' ? 0.01 : 0.1;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Preload video if not streaming
            if (!isStreaming && videoType === 'mp4' && cacheStrategy !== 'none') {
              videoPreloaderRef.current.preloadVideo(url, cacheStrategy)
                .then(() => {
                  setIsCached(true);
                  console.log(`Video ${url} preloaded successfully`);
                })
                .catch(console.error);
            }
            
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [url, priority, isStreaming, videoType, cacheStrategy]);

  // Progressive download for MP4 files
  useEffect(() => {
    if (isVisible && !isStreaming && videoType === 'mp4' && cacheStrategy === 'aggressive') {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';
      video.src = url;
      
      video.onprogress = () => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const duration = video.duration || 1;
          const progress = (bufferedEnd / duration) * 100;
          setDownloadProgress(Math.min(progress, 100));
        }
      };
      
      video.onloadedmetadata = () => {
        videoMetadataCache.set(url, {
          duration: video.duration,
          isReady: true,
          timestamp: Date.now()
        });
      };
      
      // Clean up after 30 seconds
      setTimeout(() => video.remove(), 30000);
    }
  }, [isVisible, url, isStreaming, videoType, cacheStrategy]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    
    if (url && playerRef.current) {
      const duration = playerRef.current.getDuration?.() || 0;
      videoMetadataCache.set(url, { duration, isReady: true, timestamp: Date.now() });
      
      // Cache the video URL for future use
      if (!isStreaming && videoType === 'mp4') {
        // We can't directly cache from ReactPlayer, but we can store the URL
        // for future preloading
      }
    }
    
    onReady?.();
  }, [url, onReady, isStreaming, videoType]);

  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error);
    
    // Check if we have cached version
    const tryCachedVersion = async () => {
      if (!isStreaming && videoType === 'mp4') {
        const cachedBlob = await videoCacheRef.current.getVideo(url);
        if (cachedBlob && playerRef.current) {
          const cachedUrl = URL.createObjectURL(cachedBlob);
          try {
            playerRef.current.getInternalPlayer().src = cachedUrl;
            playerRef.current.getInternalPlayer().load();
            setIsLoading(false);
            setHasError(false);
            console.log('Switched to cached version');
            return;
          } catch (e) {
            console.error('Failed to switch to cached version:', e);
          }
        }
      }
      
      // Auto-retry for recoverable errors
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          setHasError(false);
          setIsLoading(true);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      setHasError(true);
      setIsLoading(false);
      setErrorMessage('Unable to play video. Please try again later.');
      onError?.(error);
    };
    
    tryCachedVersion();
  }, [onError, retryCount, url, isStreaming, videoType]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setShowLightPreview(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleBuffer = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleBufferEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleClickPreview = useCallback(() => {
    setShowLightPreview(false);
    setIsPlaying(true);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setErrorMessage('');
    setRetryCount(0);
  }, []);

  // Download video for offline viewing
  const handleDownload = useCallback(async () => {
    if (!url || isStreaming) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Save to cache
      await videoCacheRef.current.saveVideo(url, blob);
      setIsCached(true);
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = url.split('/').pop() || 'video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage('Download failed. Please try again.');
      setHasError(true);
    }
  }, [url, isStreaming]);

  // Optimized player config
  const playerConfig = {
    file: {
      attributes: {
        controlsList: 'nodownload noremoteplayback',
        disablePictureInPicture: true,
        preload: preload,
        playsInline: true,
        crossOrigin: 'anonymous',
        style: { 
          transform: 'translateZ(0)',
          willChange: 'transform'
        }
      },
      forceVideo: true,
      forceHLS: isStreaming && !isIOS,
      forceSafariHLS: isStreaming && isIOS,
      hlsOptions: {
        maxBufferLength: isMobile ? 15 : 30,
        maxMaxBufferLength: isMobile ? 30 : 60,
        maxBufferSize: 60 * 1000 * 1000,
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        startFragPrefetch: true,
        testBandwidth: true,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
        startLevel: -1
      }
    }
  };

  // Light mode preview
  if (showLightPreview && light) {
    const previewImage = typeof light === 'string' ? light : poster;
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer group",
          className
        )}
        onClick={handleClickPreview}
      >
        {previewImage && (
          <img 
            src={previewImage} 
            alt="Video preview" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-white p-4 max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-sm mb-4">{errorMessage}</p>
          <button 
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative aspect-video bg-gray-900 rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Loading overlay with download progress */}
      {isLoading && !showLightPreview && (
        <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-10">
          <Loader2 className="w-10 h-10 text-white animate-spin mb-2" />
          {downloadProgress > 0 && (
            <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
          {isCached && (
            <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
              <Check className="w-4 h-4" />
              <span>Playing from cache</span>
            </div>
          )}
        </div>
      )}

      {/* Download button for non-streaming videos */}
      {!isStreaming && videoType === 'mp4' && isReady && !isCached && (
        <button
          onClick={handleDownload}
          className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white z-20 hover:bg-black/70 transition-colors"
          aria-label="Download video for offline viewing"
        >
          <Download className="w-4 h-4" />
        </button>
      )}

      {/* Cached indicator */}
      {isCached && isReady && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/20 backdrop-blur-sm rounded text-xs text-green-400 z-20">
          <Check className="w-3 h-3 inline mr-1" />
          Cached
        </div>
      )}

      {/* Lazy loaded player */}
      {isVisible && (
        <Suspense fallback={
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        }>
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={externalPlaying !== undefined ? externalPlaying : isPlaying}
            controls={controls}
            muted={isMuted}
            loop={loop}
            playsinline={playsinline}
            width="100%"
            height="100%"
            config={playerConfig}
            onReady={handleReady}
            onError={handleError}
            onPlay={handlePlay}
            onPause={handlePause}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
            onProgress={onProgress}
            onEnded={onEnded}
            style={{ 
              borderRadius: '12px',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            progressInterval={1000}
          />
        </Suspense>
      )}

      {/* Placeholder when not visible */}
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          {poster ? (
            <img 
              src={poster} 
              alt="Video poster" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>
      )}

      {/* Mute toggle */}
      {isMobile && isPlaying && !controls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white z-20 hover:bg-black/70 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

// Export cache manager for global cache management
export { VideoCacheManager, VideoPreloader };
export default OptimizedVideoPlayer;
