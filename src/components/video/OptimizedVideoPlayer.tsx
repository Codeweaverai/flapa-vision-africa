import React, { useState, useRef, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { Play, Loader2, AlertCircle, Volume2, VolumeX, RefreshCw } from 'lucide-react';
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
}

// Enhanced video metadata cache with IndexedDB fallback for persistence
const videoMetadataCache = new Map<string, { duration: number; isReady: boolean; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Preconnect to common video CDNs for faster loading
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

// Detect video type from URL
const getVideoType = (url: string): string => {
  if (!url) return 'unknown';
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'youtube';
  if (lowercaseUrl.includes('vimeo.com')) return 'vimeo';
  if (lowercaseUrl.includes('dailymotion.com') || lowercaseUrl.includes('dai.ly')) return 'dailymotion';
  if (lowercaseUrl.includes('twitch.tv')) return 'twitch';
  if (lowercaseUrl.includes('soundcloud.com')) return 'soundcloud';
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.watch')) return 'facebook';
  if (lowercaseUrl.includes('wistia.com') || lowercaseUrl.includes('wistia.net')) return 'wistia';
  if (lowercaseUrl.includes('.m3u8')) return 'hls';
  if (lowercaseUrl.includes('.mpd')) return 'dash';
  if (lowercaseUrl.includes('.mp4')) return 'mp4';
  if (lowercaseUrl.includes('.webm')) return 'webm';
  if (lowercaseUrl.includes('.ogg') || lowercaseUrl.includes('.ogv')) return 'ogg';
  if (lowercaseUrl.includes('.mov')) return 'mov';
  if (lowercaseUrl.includes('.avi')) return 'avi';
  if (lowercaseUrl.includes('.mkv')) return 'mkv';
  if (lowercaseUrl.includes('.flv')) return 'flv';
  if (lowercaseUrl.includes('.wmv')) return 'wmv';
  
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
  const maxRetries = 3;

  // Detect mobile device and browser capabilities
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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

  // Intersection Observer for lazy loading with priority loading
  useEffect(() => {
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

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Preload video metadata when visible (for direct file URLs)
  useEffect(() => {
    if (isVisible && url && !videoMetadataCache.has(url) && videoType === 'file') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      video.src = url;
      video.onloadedmetadata = () => {
        videoMetadataCache.set(url, {
          duration: video.duration,
          isReady: true,
          timestamp: Date.now()
        });
        video.remove();
      };
      video.onerror = () => video.remove();
    }
  }, [isVisible, url, videoType]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    
    if (url && playerRef.current) {
      const duration = playerRef.current.getDuration?.() || 0;
      videoMetadataCache.set(url, { duration, isReady: true, timestamp: Date.now() });
    }
    
    onReady?.();
  }, [url, onReady]);

  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error, 'URL:', url, 'Type:', videoType);
    
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
        setErrorMessage('Unable to play video. Please try again later.');
    }
    
    onError?.(error);
  }, [onError, retryCount, url, videoType]);

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
    if (isIOS && playerRef.current) {
      setTimeout(() => {
        try {
          playerRef.current?.getInternalPlayer?.()?.play?.();
        } catch (e) {
          // Ignore play errors
        }
      }, 100);
    }
  }, [isIOS]);

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
  const playerConfig = {
    youtube: {
      playerVars: {
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      }
    },
    vimeo: {
      playerOptions: {
        autopause: true,
        background: false,
        byline: false,
        portrait: false,
        title: false,
        playsinline: true
      }
    },
    dailymotion: {
      params: {
        'queue-autoplay-next': 0,
        'queue-enable': 0,
        'ui-logo': 0,
        'ui-start-screen-info': 0
      }
    },
    facebook: {
      appId: '',
      version: 'v3.3'
    },
    file: {
      attributes: {
        controlsList: 'nodownload noremoteplayback',
        disablePictureInPicture: true,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        preload: preload,
        playsInline: true,
        'x-webkit-airplay': 'allow',
        style: { 
          transform: 'translateZ(0)',
          willChange: 'transform'
        },
        crossOrigin: 'anonymous'
      },
      forceVideo: true,
      // Better HLS support across devices
      forceHLS: isStreamingUrl(url) && !isIOS,
      forceSafariHLS: isStreamingUrl(url) && (isIOS || isSafari),
      forceDisableHls: !isStreamingUrl(url) && isIOS,
      hlsOptions: {
        maxBufferLength: isMobile ? 20 : 30,
        maxMaxBufferLength: isMobile ? 40 : 60,
        maxBufferSize: isMobile ? 30 * 1000 * 1000 : 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        lowLatencyMode: false,
        startLevel: isMobile ? 0 : -1,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
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
            bufferTimeAtTopQuality: isMobile ? 12 : 30,
            bufferTimeAtTopQualityLongForm: isMobile ? 30 : 60
          }
        }
      }
    }
  };

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
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg backdrop-blur-sm">
            <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-900 ml-0.5 sm:ml-1" fill="currentColor" />
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
          "relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center",
          className
        )}
      >
        <div className="text-center text-white p-4 max-w-sm">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-red-400" />
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
      {/* Loading overlay */}
      {isLoading && !showLightPreview && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10 pointer-events-none">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
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
            fallback={<div className="w-full h-full bg-gray-900" />}
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

      {/* Mobile mute toggle */}
      {isMobile && isPlaying && !controls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 p-2 bg-black/50 rounded-full text-white z-20 hover:bg-black/70 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      )}
    </div>
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

export default OptimizedVideoPlayer;