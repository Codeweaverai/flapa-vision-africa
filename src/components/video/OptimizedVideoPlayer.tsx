import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactPlayer from 'react-player';
import { Play, Loader2, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Video URL cache for preloaded metadata
const videoMetadataCache = new Map<string, { duration: number; isReady: boolean }>();

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
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(externalMuted);
  const [showLightPreview, setShowLightPreview] = useState(!!light);
  const [isVisible, setIsVisible] = useState(false);

  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Check cache for video metadata
  useEffect(() => {
    if (url && videoMetadataCache.has(url)) {
      const cached = videoMetadataCache.get(url);
      if (cached?.isReady) {
        setIsLoading(false);
      }
    }
  }, [url]);

  // Intersection Observer for lazy loading
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
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Preload video metadata when visible
  useEffect(() => {
    if (isVisible && url && !videoMetadataCache.has(url)) {
      // Create a hidden video element to preload metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => {
        videoMetadataCache.set(url, {
          duration: video.duration,
          isReady: true
        });
        video.remove();
      };
      video.onerror = () => {
        video.remove();
      };
    }
  }, [isVisible, url]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    setIsLoading(false);
    setHasError(false);
    
    // Cache metadata
    if (url && playerRef.current) {
      const duration = playerRef.current.getDuration();
      videoMetadataCache.set(url, { duration, isReady: true });
    }
    
    onReady?.();
  }, [url, onReady]);

  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error);
    setHasError(true);
    setIsLoading(false);
    
    // Provide user-friendly error messages
    if (error?.target?.error?.code === 4) {
      setErrorMessage('Video format not supported. Please try another browser.');
    } else if (error?.target?.error?.code === 2) {
      setErrorMessage('Network error. Please check your connection.');
    } else {
      setErrorMessage('Unable to load video. Please try again.');
    }
    
    onError?.(error);
  }, [onError]);

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

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Retry loading on error
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setErrorMessage('');
    // Force re-render by updating key
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  }, []);

  // Optimized config for better mobile performance and caching
  const playerConfig = {
    file: {
      attributes: {
        controlsList: 'nodownload noremoteplayback',
        disablePictureInPicture: true,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
        preload: preload,
        playsInline: playsinline,
        // Enable hardware acceleration
        style: { transform: 'translateZ(0)' },
        // Cross-origin for caching
        crossOrigin: 'anonymous'
      },
      forceVideo: true,
      // Force HLS.js on mobile for better streaming
      forceHLS: isMobile && url?.includes('.m3u8'),
      // Enable native HLS on Safari
      forceSafariHLS: true,
      hlsOptions: {
        // Optimize HLS for faster start
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        lowLatencyMode: false,
        // Start with lower quality for faster load
        startLevel: isMobile ? 0 : -1,
        // Enable ABR
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7
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
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-gray-900 ml-1" fill="currentColor" />
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
        <div className="text-center text-white p-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-sm mb-3">{errorMessage}</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
          >
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
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Only render player when visible (lazy loading) */}
      {isVisible && (
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
          style={{ borderRadius: '12px' }}
          progressInterval={1000}
        />
      )}

      {/* Placeholder when not visible */}
      {!isVisible && poster && (
        <img 
          src={poster} 
          alt="Video poster" 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Mobile mute toggle overlay (appears briefly) */}
      {isMobile && isPlaying && !controls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white z-20"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
});

OptimizedVideoPlayer.displayName = 'OptimizedVideoPlayer';

export default OptimizedVideoPlayer;
