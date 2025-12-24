import React, { useRef, useState, useCallback, useMemo, memo, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleVideoPlayerProps {
  videoUrl: string;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
  onReady?: () => void;
  thumbnail?: string;
  playing?: boolean;
  controls?: boolean;
}

// Detect video type - simplified
const getVideoType = (url: string): 'youtube' | 'vimeo' | 'file' | 'stream' => {
  if (!url) return 'file';
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('vimeo.com')) return 'vimeo';
  if (lowerUrl.includes('.m3u8') || lowerUrl.includes('.mpd')) return 'stream';

  return 'file';
};

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = memo(({
  videoUrl,
  onProgress,
  onError,
  onEnd,
  onReady,
  thumbnail,
  playing = false,
  controls = true
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isInView, setIsInView] = useState(false);

  // Use Intersection Observer to only load when in view
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Stop observing once it's in view
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Debounced progress handler to prevent excessive updates
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(0);

  const handleProgress = useCallback((state: { played: number; playedSeconds: number }) => {
    // Only call onProgress every 2 seconds to reduce re-renders
    const now = Date.now();
    if (now - lastProgressRef.current < 2000) return;
    lastProgressRef.current = now;

    if (progressTimeoutRef.current) {
      clearTimeout(progressTimeoutRef.current);
    }

    progressTimeoutRef.current = setTimeout(() => {
      onProgress?.(state);
    }, 100);
  }, [onProgress]);

  const handleReady = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    setRetryCount(0);
    onReady?.();
  }, [onReady]);

  const handleError = useCallback((error: any) => {
    console.error('Video playback error:', error);

    if (retryCount < 3) {
      // Auto-retry on first failures
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setHasError(false);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setHasError(true);
      setIsLoading(false);
      onError?.(error);
    }
  }, [retryCount, onError]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setRetryCount(0);
    setIsLoading(true);
  }, []);

  // Memoized config - minimal and stable
  const config = useMemo(() => {
    const videoType = getVideoType(videoUrl);

    const baseConfig = {
      file: {
        attributes: {
          controlsList: 'nodownload',
          preload: 'metadata', // Changed from 'auto' to prevent excessive loading
          crossOrigin: 'anonymous',
          playsInline: true,
        },
        forceVideo: true,
      },
      youtube: {
        playerVars: {
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
      },
      vimeo: {
        playerOptions: {
          autopause: false,
          responsive: true,
        },
      },
    };

    // For file URLs, add additional attributes to improve loading
    if (videoType === 'file') {
      baseConfig.file.attributes = {
        ...baseConfig.file.attributes,
        preload: 'metadata', // Only load metadata initially
        loading: 'lazy', // Modern browsers support this
      };
    }

    return baseConfig;
  }, [videoUrl]);

  // Stable player key - only changes when URL changes
  const playerKey = useMemo(() => `${videoUrl}-${retryCount}`, [videoUrl, retryCount]);

  if (hasError) {
    return (
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center">
        <div className="text-center text-white p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold mb-2">Unable to load video</h3>
          <p className="text-sm text-gray-400 mb-4">
            Please check your connection and try again.
          </p>
          <Button
            onClick={handleRetry}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-white text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading video...</p>
          </div>
        </div>
      )}

      {isInView ? (
        <ReactPlayer
          key={playerKey}
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={playing}
          controls={controls}
          playsinline
          pip
          stopOnUnmount={false} // Keep player mounted to maintain state
          light={thumbnail && isLoading ? thumbnail : false}
          onReady={handleReady}
          onProgress={handleProgress}
          onError={handleError}
          onEnded={onEnd}
          config={config}
          fallback={
            <div className="flex items-center justify-center h-full bg-gray-900">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          }
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
});

SimpleVideoPlayer.displayName = 'SimpleVideoPlayer';

export default SimpleVideoPlayer;
