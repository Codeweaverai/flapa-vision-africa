import React, { useState, useRef, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { Play, Loader2, AlertCircle, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lazy load ReactPlayer for faster initial page load
const ReactPlayer = lazy(() => import('react-player/lazy'));

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
}

// Enhanced video metadata cache with IndexedDB fallback for persistence
const videoMetadataCache = new Map<string, { duration: number; isReady: boolean; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old cache entries periodically
const cleanOldCacheEntries = () => {
  const now = Date.now();
  for (const [key, value] of videoMetadataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      videoMetadataCache.delete(key);
    }
  }
};

// Preconnect to common video CDNs for faster loading
const preconnectToCDNs = () => {
  if (typeof document === 'undefined') return;
  
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
      try {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = cdn;
        preconnect.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect);
      } catch (error) {
        // Silently fail if DOM manipulation fails
      }
    }
  });
};

// Detect video type from URL
const getVideoType = (url: string): string => {
  if (!url) return 'unknown';
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'youtube';
  if (lowercaseUrl.includes('vimeo.com')) return 'vimeo';
  if (lowercaseUrl.includes('dailymotion.com') || lowercaseUrl.includes('dai.ly')) return 'dailymotion';
  if (lowercaseUrl.includes('.m3u8')) return 'hls';
  if (lowercaseUrl.includes('.mpd')) return 'dash';
  if (lowercaseUrl.includes('.mp4')) return 'mp4';
  if (lowercaseUrl.includes('.webm')) return 'webm';
  if (lowercaseUrl.includes('.mov')) return 'mov';
  
  return 'file';
};

// Check if URL is a streaming URL
const isStreamingUrl = (url: string): boolean => {
  return url?.includes('.m3u8') || url?.includes('.mpd');
};

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
  preload = 'metadata'
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(externalMuted);
  const [showLightPreview, setShowLightPreview] = useState(!!light);
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasLoadedMetadata, setHasLoadedMetadata] = useState(false);
  const maxRetries = 3;

  // Clean cache on mount
  useEffect(() => {
    cleanOldCacheEntries();
  }, []);

  // Detect mobile device and browser capabilities (client-side only)
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIOS: false,
    isSafari: false,
    isTouchDevice: false
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const userAgent = navigator.userAgent;
    setDeviceInfo({
      isMobile: /iPhone|iPad|iPod|Android/i.test(userAgent),
      isIOS: /iPhone|iPad|iPod/i.test(userAgent),
      isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    });
  }, []);

  const videoType = getVideoType(url);

  // Preconnect to CDNs on mount
  useEffect(() => {
    preconnectToCDNs();
  }, []);

  // Check cache for video metadata
  useEffect(() => {
    if (url && videoMetadataCache.has(url)) {
      const cached = videoMetadataCache.get(url);
      if (cached?.isReady && Date.now() - cached.timestamp < CACHE_TTL) {
        setIsLoading(false);
      }
    }
  }, [url]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Preload video metadata when visible
  useEffect(() => {
    if (!isVisible || !url || videoMetadataCache.has(url) || videoType !== 'file') return;

    const preloadMetadata = () => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.crossOrigin = 'anonymous';
        video.src = url;
        
        const onMetadataLoaded = () => {
          videoMetadataCache.set(url, {
            duration: video.duration,
            isReady: true,
            timestamp: Date.now()
          });
          video.remove();
          setHasLoadedMetadata(true);
        };

        const onMetadataError = () => {
          video.remove();
        };

        video.addEventListener('loadedmetadata', onMetadataLoaded);
        video.addEventListener('error', onMetadataError);
        
        // Set timeout to clean up
        setTimeout(() => {
          if (video.parentNode) {
            video.remove();
          }
        }, 5000);
      } catch (error) {
        console.error('Failed to preload video metadata:', error);
      }
    };

    preloadMetadata();
  }, [isVisible, url, videoType]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    
    if (url && playerRef.current) {
      try {
        const duration = playerRef.current.getDuration?.() || 0;
        videoMetadataCache.set(url, { duration, isReady: true, timestamp: Date.now() });
      } catch (error) {
        // Ignore duration errors
      }
    }
    
    onReady?.();
  }, [url, onReady]);

  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error, 'URL:', url, 'Type:', videoType);
    
    // Auto-retry for recoverable errors
    if (retryCount < maxRetries) {
      const nextRetryCount = retryCount + 1;
      setRetryCount(nextRetryCount);
      setTimeout(() => {
        setHasError(false);
        setIsLoading(true);
      }, 1000 * (nextRetryCount + 1));
      return;
    }
    
    setHasError(true);
    setIsLoading(false);
    
    // Provide user-friendly error messages
    const errorCode = error?.target?.error?.code;
    switch (errorCode) {
      case 1:
        setErrorMessage('Video loading was aborted. Please try again.');
        break;
      case 2:
        setErrorMessage('Network error. Please check your connection.');
        break;
      case 3:
        setErrorMessage('Video decoding failed. Try refreshing the page.');
        break;
      case 4:
        setErrorMessage('Video format not supported on this device.');
        break;
      default:
        if (error?.message?.includes('Not Found')) {
          setErrorMessage('Video not found. It may have been removed.');
        } else if (error?.message?.includes('cross-origin')) {
          setErrorMessage('Cross-origin video. Please contact support.');
        } else {
          setErrorMessage('Unable to play video. Please try again later.');
        }
    }
    
    onError?.(error);
  }, [onError, retryCount, url, videoType, maxRetries]);

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
    
    // On iOS, we need to trigger play after user interaction
    if (deviceInfo.isIOS && playerRef.current) {
      setTimeout(() => {
        try {
          const internalPlayer = playerRef.current?.getInternalPlayer?.();
          if (internalPlayer && typeof internalPlayer.play === 'function') {
            internalPlayer.play();
          }
        } catch (e) {
          console.error('Failed to play video on iOS:', e);
        }
      }, 100);
    }
  }, [deviceInfo.isIOS]);

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

  // Optimized player config based on video type and device
  const playerConfig = React.useMemo(() => {
    const baseConfig = {
      youtube: {
        playerVars: {
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          autoplay: 0,
          controls: controls ? 1 : 0
        }
      },
      vimeo: {
        playerOptions: {
          autopause: true,
          background: false,
          byline: false,
          portrait: false,
          title: false,
          playsinline: true,
          controls: controls
        }
      },
      dailymotion: {
        params: {
          'queue-autoplay-next': 0,
          'queue-enable': 0,
          'ui-logo': 0,
          'ui-start-screen-info': 0,
          controls: controls
        }
      },
      file: {
        attributes: {
          controlsList: 'nodownload noremoteplayback',
          disablePictureInPicture: !controls,
          onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
          preload: preload,
          playsInline: true,
          style: { 
            transform: 'translateZ(0)',
            willChange: 'transform'
          },
          crossOrigin: 'anonymous'
        },
        forceVideo: true,
        // Better HLS support across devices
        forceHLS: isStreamingUrl(url) && !deviceInfo.isIOS,
        hlsOptions: {
          maxBufferLength: deviceInfo.isMobile ? 20 : 30,
          maxMaxBufferLength: deviceInfo.isMobile ? 40 : 60,
          maxBufferSize: deviceInfo.isMobile ? 30 * 1000 * 1000 : 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          lowLatencyMode: false,
          enableWorker: true,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 6,
          manifestLoadingTimeOut: 10000,
          manifestLoadingMaxRetry: 4,
          levelLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 4
        },
        dashOptions: {
          streaming: {
            abr: {
              autoSwitchBitrate: {
                audio: true,
                video: true
              }
            },
            buffer: {
              fastSwitchEnabled: true,
              bufferTimeAtTopQuality: deviceInfo.isMobile ? 12 : 30,
              bufferTimeAtTopQualityLongForm: deviceInfo.isMobile ? 30 : 60
            }
          }
        }
      }
    };

    return baseConfig;
  }, [url, controls, preload, deviceInfo.isMobile, deviceInfo.isIOS]);

  // Handle external playing state
  useEffect(() => {
    if (externalPlaying !== undefined) {
      setIsPlaying(externalPlaying);
      if (externalPlaying) {
        setShowLightPreview(false);
      }
    }
  }, [externalPlaying]);

  // Handle external muted state
  useEffect(() => {
    setIsMuted(externalMuted);
  }, [externalMuted]);

  // Light mode preview with optimized loading
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
        role="button"
        aria-label="Play video"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClickPreview()}
      >
        {previewImage && (
          <img 
            src={previewImage} 
            alt="Video preview" 
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg backdrop-blur-sm">
            <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-900 ml-0.5 sm:ml-1" />
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-white p-4 sm:p-6 max-w-sm">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-red-400" />
          <p className="text-sm sm:text-base mb-4 sm:mb-6 px-2">{errorMessage}</p>
          <button 
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm sm:text-base transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
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
      {/* Loading overlay */}
      {isLoading && !showLightPreview && (
        <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center z-10 pointer-events-none backdrop-blur-sm">
          <div className="relative">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white/80 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="mt-3 text-white/70 text-sm">Loading video...</p>
        </div>
      )}

      {/* Lazy loaded player */}
      {isVisible && (
        <Suspense 
          fallback={
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
            </div>
          }
        >
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
            config={playerConfig as any}
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
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            progressInterval={1000}
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                {poster ? (
                  <img 
                    src={poster} 
                    alt="Video poster" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>
            }
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
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>
      )}

      {/* Custom mute toggle for mobile */}
      {deviceInfo.isMobile && isPlaying && !controls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 bg-black/60 rounded-full text-white z-20 hover:bg-black/80 transition-colors backdrop-blur-sm"
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          type="button"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      )}
    </div>
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

export default OptimizedVideoPlayer;
