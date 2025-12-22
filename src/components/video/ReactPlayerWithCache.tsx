import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Maximize2, Volume2, Play, Pause, RotateCcw, 
  Download, Wifi, WifiOff, Zap, HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReactPlayerWithCacheProps {
  url: string;
  thumbnail?: string;
  title?: string;
  onProgress?: (progress: { played: number, playedSeconds: number }) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onReady?: () => void;
  playing?: boolean;
  controls?: boolean;
  className?: string;
  config?: any;
}

export const ReactPlayerWithCache: React.FC<ReactPlayerWithCacheProps> = ({
  url,
  thumbnail,
  title,
  onProgress,
  onEnd,
  onError,
  onReady,
  playing = false,
  controls = true,
  className,
  config
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(playing);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'none' | 'cached' | 'caching'>('none');
  const [cacheProgress, setCacheProgress] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'average' | 'poor'>('good');
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);

  // Check network quality
  useEffect(() => {
    const checkNetworkQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const { effectiveType, downlink, rtt } = connection;
          
          if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
            setNetworkQuality('good');
          } else if (effectiveType === '4g' && downlink > 2 && rtt < 200) {
            setNetworkQuality('average');
          } else {
            setNetworkQuality('poor');
          }
        }
      }
    };

    checkNetworkQuality();
    
    // Listen for network changes
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', checkNetworkQuality);
    }

    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', checkNetworkQuality);
      }
    };
  }, []);

  // Check cache and initialize
  useEffect(() => {
    const initializeCache = async () => {
      if (!url) return;
      
      const isCacheable = checkIfCacheable(url);
      if (!isCacheable) return;

      try {
        // Check if video is in IndexedDB
        const cached = await getCachedVideo(url);
        if (cached) {
          setCachedUrl(cached);
          setCacheStatus('cached');
          console.log('Using cached video');
        } else {
          // Start caching in background
          cacheVideoInBackground(url);
        }
      } catch (error) {
        console.error('Cache initialization failed:', error);
      }
    };

    initializeCache();
  }, [url]);

  // Check if URL is cacheable
  const checkIfCacheable = (videoUrl: string): boolean => {
    if (!videoUrl) return false;
    const lowerUrl = videoUrl.toLowerCase();
    
    // Only cache direct video files
    const cacheableExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const isDirectFile = cacheableExtensions.some(ext => lowerUrl.includes(ext));
    
    // Don't cache streaming platforms or external URLs
    const streamingPlatforms = [
      'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com',
      'twitch.tv', 'facebook.com', 'wistia.com'
    ];
    const isStreaming = streamingPlatforms.some(platform => lowerUrl.includes(platform));
    
    return isDirectFile && !isStreaming;
  };

  // Get cached video from IndexedDB
  const getCachedVideo = async (videoUrl: string): Promise<string | null> => {
    if (!('indexedDB' in window)) return null;

    return new Promise((resolve) => {
      const request = indexedDB.open('video-cache', 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'url' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const getRequest = store.get(videoUrl);

        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const blob = getRequest.result.blob;
            const blobUrl = URL.createObjectURL(blob);
            resolve(blobUrl);
          } else {
            resolve(null);
          }
        };

        getRequest.onerror = () => {
          console.error('Error reading from cache');
          resolve(null);
        };
      };

      request.onerror = () => {
        console.error('Error opening IndexedDB');
        resolve(null);
      };
    });
  };

  // Cache video in background
  const cacheVideoInBackground = async (videoUrl: string) => {
    if (!checkIfCacheable(videoUrl)) return;
    
    setCacheStatus('caching');
    
    try {
      const response = await fetch(videoUrl);
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength || '0', 10);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream not supported');

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update progress
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          setCacheProgress(progress);
        }

        // Store in chunks to avoid memory issues
        if (chunks.length > 100) {
          await storePartialCache(videoUrl, chunks, false);
          chunks.length = 0;
        }
      }

      // Store final cache
      await storePartialCache(videoUrl, chunks, true);
      
      // Get the cached URL
      const cachedUrl = await getCachedVideo(videoUrl);
      if (cachedUrl) {
        setCachedUrl(cachedUrl);
        setCacheStatus('cached');
      }

    } catch (error) {
      console.error('Background caching failed:', error);
      setCacheStatus('none');
    }
  };

  // Store partial cache in IndexedDB
  const storePartialCache = async (url: string, chunks: Uint8Array[], isFinal: boolean) => {
    if (!('indexedDB' in window)) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('video-cache', 1);

      request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');

        // Get existing data
        const getRequest = store.get(url);

        getRequest.onsuccess = () => {
          let existingData = getRequest.result?.blob || new Uint8Array();
          
          if (chunks.length > 0) {
            // Combine existing data with new chunks
            const totalLength = existingData.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            const combined = new Uint8Array(totalLength);
            
            let offset = 0;
            if (existingData.length > 0) {
              combined.set(existingData, offset);
              offset += existingData.length;
            }
            
            chunks.forEach(chunk => {
              combined.set(chunk, offset);
              offset += chunk.length;
            });

            const videoData = {
              url,
              blob: combined,
              cachedAt: new Date().toISOString(),
              isComplete: isFinal
            };

            const putRequest = store.put(videoData);
            putRequest.onsuccess = () => resolve(true);
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve(true);
          }
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  };

  // Clear cache
  const clearCache = async () => {
    if (!url) return;

    try {
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        setCachedUrl(null);
      }

      if ('indexedDB' in window) {
        const request = indexedDB.open('video-cache', 1);
        
        request.onsuccess = (event) => {
          const db = (event.target as any).result;
          const transaction = db.transaction(['videos'], 'readwrite');
          const store = transaction.objectStore('videos');
          store.delete(url);
        };
      }

      setCacheStatus('none');
      setCacheProgress(0);
      toast.success('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  // Event handlers
  const handleProgress = (state: { played: number, playedSeconds: number, loaded: number, loadedSeconds: number }) => {
    setCurrentTime(state.playedSeconds);
    if (onProgress) onProgress(state);
  };

  const handleBuffer = () => setIsBuffering(true);
  const handleBufferEnd = () => setIsBuffering(false);
  
  const handleReady = (player: any) => {
    setDuration(player.getDuration());
    setIsReady(true);
    if (onReady) onReady();
  };

  const handleError = (err: any) => {
    console.error('ReactPlayer error:', err);
    setError('Failed to load video');
    if (onError) onError(err);
    
    // Fallback to original URL if cached version fails
    if (cachedUrl && url !== cachedUrl) {
      setCachedUrl(null);
      setCacheStatus('none');
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnd) onEnd();
  };

  // Control functions
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.getInternalPlayer().volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (playerRef.current) {
      playerRef.current.getInternalPlayer().playbackRate = rate;
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup cached URLs on unmount
  useEffect(() => {
    return () => {
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
      }
    };
  }, [cachedUrl]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ReactPlayer config with optimizations
  const playerConfig = {
    ...config,
    file: {
      ...config?.file,
      attributes: {
        ...config?.file?.attributes,
        preload: 'metadata', // Only load metadata initially
        controlsList: 'nodownload', // Hide download button
        disablePictureInPicture: false,
      },
      forceVideo: true,
      forceAudio: false,
      hlsOptions: {
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        startLevel: -1,
      },
      dashOptions: {
        streaming: {
          delay: {
            liveDelay: 2.5,
          },
        },
      },
    },
    youtube: {
      ...config?.youtube,
      playerVars: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        playsinline: 1,
        origin: window.location.origin,
        ...config?.youtube?.playerVars,
      },
    },
  };

  // Determine which URL to use
  const videoUrl = cachedUrl || url;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl group",
        className
      )}
    >
      {/* Cache Status Overlay */}
      {cacheStatus === 'caching' && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Caching... {cacheProgress}%</span>
          </div>
        </div>
      )}

      {cacheStatus === 'cached' && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-green-600/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            <span>Playing from cache</span>
          </div>
        </div>
      )}

      {/* Network Quality Indicator */}
      {networkQuality !== 'good' && (
        <div className="absolute top-4 right-4 z-20">
          <div className={cn(
            "text-xs px-2 py-1 rounded-full flex items-center gap-1",
            networkQuality === 'poor' 
              ? "bg-red-600/90 text-white" 
              : "bg-yellow-600/90 text-white"
          )}>
            {networkQuality === 'poor' ? (
              <WifiOff className="h-3 w-3" />
            ) : (
              <Wifi className="h-3 w-3" />
            )}
            <span>Network: {networkQuality}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center text-white p-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
            <p className="text-sm text-gray-400 mb-4 max-w-md">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setError(null);
                  if (playerRef.current) {
                    playerRef.current.seekTo(0);
                  }
                }}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              {cachedUrl && (
                <Button
                  onClick={clearCache}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-red-500/20"
                >
                  Clear Cache
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading/Buffering Overlay */}
      {(isBuffering || !isReady) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-white text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">
              {!isReady ? 'Loading video...' : 'Buffering...'}
            </p>
            {networkQuality === 'poor' && (
              <p className="text-xs text-gray-400 mt-1">
                Poor network detected. Consider downloading for offline viewing.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ReactPlayer */}
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={isPlaying}
        controls={false} // We'll use custom controls
        playsinline
        pip
        light={thumbnail && !isReady}
        playbackRate={playbackRate}
        volume={volume}
        muted={isMuted}
        onReady={handleReady}
        onBuffer={handleBuffer}
        onBufferEnd={handleBufferEnd}
        onProgress={handleProgress}
        onError={handleError}
        onEnded={handleEnded}
        config={playerConfig}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Custom Controls */}
      {controls && isReady && !error && (
        <>
          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                onClick={togglePlay}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-105"
              >
                <Play className="h-10 w-10 text-white" />
              </button>
            </div>
          )}

          {/* Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="relative">
                <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setCurrentTime(time);
                    if (playerRef.current) {
                      playerRef.current.seekTo(time, 'seconds');
                    }
                  }}
                  className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-xs text-white/80 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </button>

                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={() => handleVolumeChange(volume === 0 ? 0.8 : 0)}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {volume === 0 ? (
                      <Volume2 className="h-5 w-5 text-red-400" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-blue-500 cursor-pointer opacity-0 group-hover/volume:opacity-100 transition-opacity"
                  />
                </div>

                {/* Playback Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                  className="text-white text-sm bg-white/10 hover:bg-white/20 rounded px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                {/* Cache Controls */}
                {checkIfCacheable(url) && (
                  <div className="flex items-center gap-2">
                    {cacheStatus === 'cached' ? (
                      <button
                        onClick={clearCache}
                        className="text-xs text-white/60 hover:text-red-400 px-2 py-1 rounded hover:bg-white/10 transition-all flex items-center gap-1"
                        title="Clear cache"
                      >
                        <HardDrive className="h-3 w-3" />
                        Clear Cache
                      </button>
                    ) : (
                      <button
                        onClick={() => cacheVideoInBackground(url)}
                        className="text-xs text-white/60 hover:text-green-400 px-2 py-1 rounded hover:bg-white/10 transition-all flex items-center gap-1"
                        title="Download for offline"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Quality Indicator */}
                {networkQuality !== 'good' && (
                  <div className="text-xs text-white/60 px-2 py-1 rounded bg-white/10">
                    {networkQuality === 'poor' ? 'Low Quality' : 'Medium Quality'}
                  </div>
                )}

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400 hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
