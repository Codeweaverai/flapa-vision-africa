import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimizedVideoPlayerProps {
  url: string;
  thumbnail?: string;
  className?: string;
  onError?: (error: any) => void;
}

export const OptimizedVideoPlayer: React.FC<OptimizedVideoPlayerProps> = ({
  url,
  thumbnail,
  className = '',
  onError
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [quality, setQuality] = useState<'auto' | '720p' | '480p' | '360p'>('auto');
  const [bufferProgress, setBufferProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Handle quality change
  const handleQualityChange = (newQuality: 'auto' | '720p' | '480p' | '360p') => {
    setQuality(newQuality);
    setIsLoading(true);
    setBufferProgress(0);
  };

  // Get optimized URL based on quality
  const getOptimizedUrl = () => {
    if (!url) return '';
    
    // For YouTube URLs - add quality parameter
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const params = new URLSearchParams();
      params.append('vq', quality === 'auto' ? 'hd720' : quality);
      params.append('modestbranding', '1');
      params.append('rel', '0');
      params.append('showinfo', '0');
      params.append('controls', '1');
      params.append('playsinline', '1');
      
      // Add mobile-specific optimizations
      if (isMobile) {
        params.append('mute', '1');
        params.append('autoplay', '0');
      }
      
      return `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    }
    
    // For direct video files - append quality in query string
    if (url.includes('.mp4') || url.includes('.webm')) {
      return `${url}${url.includes('?') ? '&' : '?'}optimize=true&mobile=${isMobile}`;
    }
    
    return url;
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReady = () => {
    setIsLoading(false);
    setBufferProgress(100);
  };

  const handleBuffer = (bufferState: { loaded: number; loadedSeconds: number; played: number; playedSeconds: number }) => {
    const progress = (bufferState.loaded / bufferState.loadedSeconds) * 100;
    setBufferProgress(Math.min(progress, 100));
  };

  const handleError = (error: any) => {
    console.error('Video player error:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  const retryPlayback = () => {
    setHasError(false);
    setIsLoading(true);
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };

  // Preload the video
  useEffect(() => {
    const preloadVideo = () => {
      if (url && isMobile) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = url;
        link.type = 'video/mp4';
        document.head.appendChild(link);
        
        return () => {
          document.head.removeChild(link);
        };
      }
    };
    
    preloadVideo();
  }, [url, isMobile]);

  return (
    <div className={`relative aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
          <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-300"
              style={{ width: `${bufferProgress}%` }}
            />
          </div>
          <p className="text-white text-sm mt-2">
            {bufferProgress < 100 ? `Buffering... ${Math.round(bufferProgress)}%` : 'Loading video...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
          <div className="text-center p-6">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-white text-lg font-semibold mb-2">Unable to load video</h3>
            <p className="text-gray-300 text-sm mb-4">
              Please check your internet connection and try again.
            </p>
            <Button
              onClick={retryPlayback}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              Retry Playback
            </Button>
          </div>
        </div>
      )}

      {/* Quality Selector */}
      {!isMobile && !isLoading && !hasError && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className="bg-black/70 backdrop-blur-sm text-white border-gray-600 hover:bg-black/90"
            >
              Quality: {quality}
            </Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-32 border border-gray-700">
              {['auto', '720p', '480p', '360p'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q as any)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    quality === q
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {q === 'auto' ? 'Auto (Best)' : q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={getOptimizedUrl()}
        width="100%"
        height="100%"
        playing={isPlaying}
        controls={true}
        playsinline={true}
        muted={isMobile}
        loop={false}
        light={!isPlaying && thumbnail && !isMobile}
        onPlay={handlePlay}
        onPause={handlePause}
        onReady={handleReady}
        onBuffer={handleBuffer}
        onError={handleError}
        onEnded={() => setIsPlaying(false)}
        progressInterval={1000}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              playsInline: true,
              preload: 'auto',
              disablePictureInPicture: false,
              crossOrigin: 'anonymous',
              'webkit-playsinline': 'true',
              muted: isMobile ? 'true' : 'false'
            },
            forceVideo: true,
            forceAudio: true,
            forceHLS: true,
            forceDASH: true,
            hlsOptions: {
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              maxBufferSize: 60 * 1000 * 1000,
              maxBufferHole: 0.5,
              maxFragLookUpTolerance: 0.25,
              liveSyncDurationCount: 3,
              liveMaxLatencyDurationCount: 10,
              abrEwmaDefaultEstimate: 500000,
              abrEwmaSlowLive: 3,
              abrEwmaFastLive: 1,
              abrEwmaDefaultLive: 5,
              abrEwmaSlowVoD: 3,
              abrEwmaFastVoD: 1,
              abrEwmaDefaultVoD: 5,
              stretchShortVideoTrack: true,
              maxLoadingDelay: 4,
              minAutoBitrate: 0,
              abrBandWidthFactor: 0.95,
              abrBandWidthUpFactor: 0.7
            },
            dashOptions: {
              streaming: {
                delay: {
                  liveDelay: 4
                }
              }
            }
          },
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              controls: 1,
              playsinline: 1,
              fs: 1,
              iv_load_policy: 3,
              cc_load_policy: 0,
              disablekb: 0,
              enablejsapi: 0,
              widget_referrer: window.location.origin,
              origin: window.location.origin,
              vq: quality === 'auto' ? 'hd720' : quality
            }
          }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        playIcon={
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110">
              <svg className="h-10 w-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        }
      />

      {/* Network Status Indicator */}
      {navigator.connection && (
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${
              navigator.connection.downlink > 5 
                ? 'bg-green-500' 
                : navigator.connection.downlink > 2 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`} />
            <span className="text-white text-xs">
              {navigator.connection.downlink.toFixed(1)} Mbps
            </span>
          </div>
        </div>
      )}

      {/* Performance Overlay (Dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-3 right-3 z-10 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white text-xs">
            {quality} | {isMobile ? 'Mobile' : 'Desktop'}
          </span>
        </div>
      )}
    </div>
  );
};
