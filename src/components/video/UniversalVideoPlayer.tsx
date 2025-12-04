import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video as ExpoVideo, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { Platform, View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface UniversalVideoPlayerProps {
  videoUrl: string;
  onProgress?: (progress: { played: number, playedSeconds: number }) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  thumbnail?: string;
  playing?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
  width?: number | string;
  height?: number | string;
  style?: any;
  className?: string;
  lessonId?: string;
}

const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  videoUrl,
  onProgress,
  onError,
  onEnd,
  onReady,
  onPlay,
  onPause,
  thumbnail,
  playing = false,
  controls = true,
  loop = false,
  muted = false,
  volume = 1.0,
  playbackRate = 1.0,
  width = '100%',
  height = 'auto',
  style,
  className,
  lessonId
}) => {
  // Refs
  const videoRef = useRef<ExpoVideo>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isPlaying, setIsPlaying] = useState(playing);
  const [showControls, setShowControls] = useState(controls);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(playbackRate);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [subtitles, setSubtitles] = useState<Array<{id: string, startTime: number, endTime: number, text: string}>>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [lastPosition, setLastPosition] = useState(0);

  // Initialize video
  useEffect(() => {
    const initializeVideo = async () => {
      if (!videoUrl) {
        setHasError(true);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        // Check if video is accessible
        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Video not accessible: ${response.status}`);
        }

        // Load subtitles if available
        await loadSubtitles();

        // Reset video state
        if (videoRef.current) {
          await videoRef.current.unloadAsync();
          await videoRef.current.loadAsync(
            { uri: videoUrl },
            { 
              shouldPlay: isPlaying,
              volume: isMuted ? 0 : currentVolume,
              rate: currentPlaybackRate,
              isLooping: loop,
              isMuted: isMuted
            },
            false // Don't play immediately
          );
          
          // Restore last position if available
          if (lastPosition > 0) {
            await videoRef.current.setPositionAsync(lastPosition * 1000);
          }
          
          setIsLoading(false);
          onReady?.();
        }
      } catch (error) {
        console.error('Failed to initialize video:', error);
        setHasError(true);
        onError?.(error);
        setIsLoading(false);
      }
    };

    initializeVideo();

    return () => {
      // Cleanup
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [videoUrl]);

  // Load subtitles from database
  const loadSubtitles = useCallback(async () => {
    if (!lessonId) return;
    
    try {
      // Here you would fetch subtitles from your database
      // For now, we'll check for a .vtt file
      if (Platform.OS === 'web') {
        // For web, check if VTT file exists
        const vttUrl = `${videoUrl}.vtt`;
        try {
          const response = await fetch(vttUrl, { method: 'HEAD' });
          if (response.ok) {
            // Parse VTT file
            const vttResponse = await fetch(vttUrl);
            const vttText = await vttResponse.text();
            const parsedSubtitles = parseVTT(vttText);
            setSubtitles(parsedSubtitles);
          }
        } catch (error) {
          // VTT file doesn't exist, ignore
        }
      }
    } catch (error) {
      console.error('Error loading subtitles:', error);
    }
  }, [lessonId, videoUrl]);

  // Parse VTT file content
  const parseVTT = (vttText: string) => {
    const subtitles: Array<{id: string, startTime: number, endTime: number, text: string}> = [];
    const lines = vttText.split('\n');
    let currentId = '';
    let currentStart = 0;
    let currentEnd = 0;
    let currentText = '';
    let isInCue = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '' && isInCue) {
        if (currentText) {
          subtitles.push({
            id: currentId || `subtitle-${subtitles.length + 1}`,
            startTime: currentStart,
            endTime: currentEnd,
            text: currentText
          });
        }
        isInCue = false;
        currentText = '';
      } else if (!isInCue && line.includes('-->')) {
        // Parse time line
        const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        if (timeMatch) {
          currentStart = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
          currentEnd = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
          isInCue = true;
          
          // Check if previous line was an ID
          if (i > 0 && lines[i-1].trim() && !lines[i-1].includes('-->')) {
            currentId = lines[i-1].trim();
          }
        }
      } else if (isInCue && line && !line.includes('WEBVTT') && !line.includes('-->')) {
        currentText += (currentText ? '\n' : '') + line;
      }
    }

    // Add last cue if any
    if (isInCue && currentText) {
      subtitles.push({
        id: currentId || `subtitle-${subtitles.length + 1}`,
        startTime: currentStart,
        endTime: currentEnd,
        text: currentText
      });
    }

    return subtitles;
  };

  // Handle playback status updates
  const handlePlaybackStatusUpdate = useCallback((playbackStatus: AVPlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      if (playbackStatus.error) {
        console.error('Video error:', playbackStatus.error);
        setHasError(true);
        onError?.(playbackStatus.error);
      }
      return;
    }

    // Update state based on playback status
    setIsBuffering(playbackStatus.isBuffering);
    setIsPlaying(playbackStatus.isPlaying);
    setLastPosition(playbackStatus.positionMillis / 1000);

    // Calculate progress
    if (onProgress && playbackStatus.positionMillis !== undefined) {
      const duration = playbackStatus.durationMillis || 1;
      const played = playbackStatus.positionMillis / duration;
      const playedSeconds = playbackStatus.positionMillis / 1000;
      
      onProgress({
        played,
        playedSeconds
      });

      // Update current subtitle
      if (subtitles.length > 0) {
        const currentSub = subtitles.find(sub => 
          playedSeconds >= sub.startTime && playedSeconds <= sub.endTime
        );
        setCurrentSubtitle(currentSub?.text || '');
      }
    }

    // Handle video end
    if (playbackStatus.didJustFinish && onEnd) {
      onEnd();
    }

    setStatus(playbackStatus);
  }, [onProgress, onEnd, onError, subtitles]);

  // Control handlers
  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        onPause?.();
      } else {
        await videoRef.current.playAsync();
        onPlay?.();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const seekTo = async (position: number) => {
    if (!videoRef.current || !status?.isLoaded) return;

    try {
      await videoRef.current.setPositionAsync(position * 1000);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;

    try {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      await videoRef.current.setIsMutedAsync(newMutedState);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const changeVolume = async (value: number) => {
    if (!videoRef.current) return;

    try {
      setCurrentVolume(value);
      await videoRef.current.setVolumeAsync(value);
      if (value === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  };

  const changePlaybackRate = async (rate: number) => {
    if (!videoRef.current) return;

    try {
      setCurrentPlaybackRate(rate);
      await videoRef.current.setRateAsync(rate, false);
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  };

  const toggleFullscreen = async () => {
    if (Platform.OS === 'web') {
      const element = document.fullscreenElement;
      if (!element) {
        const videoContainer = document.getElementById('video-container');
        if (videoContainer?.requestFullscreen) {
          await videoContainer.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
    // On mobile, Expo Video handles fullscreen automatically
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Handle controls timeout for auto-hide
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (controls) {
      setShowControls(true);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add fullscreen event listeners for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, []);

  // Reset controls timeout when interacting
  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, controls]);

  // Handle external playing prop changes
  useEffect(() => {
    const handlePlaybackChange = async () => {
      if (!videoRef.current || !status?.isLoaded) return;

      try {
        if (playing && !isPlaying) {
          await videoRef.current.playAsync();
          onPlay?.();
        } else if (!playing && isPlaying) {
          await videoRef.current.pauseAsync();
          onPause?.();
        }
      } catch (error) {
        console.error('Error handling playback change:', error);
      }
    };

    handlePlaybackChange();
  }, [playing, isPlaying]);

  // Handle external volume changes
  useEffect(() => {
    if (videoRef.current && status?.isLoaded) {
      videoRef.current.setVolumeAsync(currentVolume);
    }
  }, [volume]);

  // Handle external muted changes
  useEffect(() => {
    if (videoRef.current && status?.isLoaded) {
      videoRef.current.setIsMutedAsync(isMuted);
    }
  }, [muted]);

  // Render loading state
  if (isLoading) {
    return (
      <View 
        style={[
          styles.container, 
          { width, height: typeof height === 'number' ? height : 300 },
          style
        ]}
        className={className}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <p className="mt-4 text-gray-600">Loading video...</p>
        </View>
      </View>
    );
  }

  // Render error state
  if (hasError) {
    return (
      <View 
        style={[
          styles.container, 
          { width, height: typeof height === 'number' ? height : 300 },
          style
        ]}
        className={className}
      >
        <View style={styles.errorContainer}>
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load video</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </View>
      </View>
    );
  }

  return (
    <View 
      id="video-container"
      style={[
        styles.container, 
        { width, height: typeof height === 'number' ? height : 'auto' },
        isFullscreen && styles.fullscreen,
        style
      ]}
      className={cn("relative bg-black rounded-lg overflow-hidden", className)}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Video Player */}
      <ExpoVideo
        ref={videoRef}
        style={styles.video}
        useNativeControls={false} // We're using custom controls
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={onError}
      />

      {/* Custom Controls Overlay */}
      {controls && showControls && (
        <View style={styles.controlsOverlay}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <View className="flex-1">
              {/* Playback rate selector */}
              <select
                value={currentPlaybackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="bg-black/70 text-white text-sm rounded px-2 py-1"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </View>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </View>

          {/* Center Play Button */}
          <View style={styles.centerControls}>
            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.playButton}
            >
              <View className="bg-black/50 rounded-full p-4">
                {isPlaying ? (
                  <Pause className="h-10 w-10 text-white" />
                ) : (
                  <Play className="h-10 w-10 text-white" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Progress Bar */}
            <View className="w-full mb-2 px-4">
              <Slider
                value={[lastPosition]}
                min={0}
                max={status?.isLoaded ? status.durationMillis / 1000 : 100}
                step={1}
                onValueChange={([value]) => {
                  // Update position during drag
                  setLastPosition(value);
                }}
                onValueCommit={([value]) => {
                  // Seek when user releases
                  seekTo(value);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>{formatTime(lastPosition)}</span>
                <span>{formatTime(status?.isLoaded ? status.durationMillis / 1000 : 0)}</span>
              </div>
            </View>

            {/* Control Buttons */}
            <div className="flex items-center justify-between px-4 pb-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted || currentVolume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentVolume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-20 accent-white"
                  />
                </div>

                <div className="text-white text-sm">
                  {formatTime(lastPosition)} / {formatTime(status?.isLoaded ? status.durationMillis / 1000 : 0)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </View>
        </View>
      )}

      {/* Subtitles Display */}
      {currentSubtitle && (
        <View style={styles.subtitleContainer}>
          <div className="bg-black/70 text-white text-center px-4 py-2 rounded-lg">
            {currentSubtitle}
          </div>
        </View>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color="#f97316" />
          <p className="text-white text-sm mt-2">Buffering...</p>
        </View>
      )}

      {/* Minimal Play Button Overlay when controls are hidden */}
      {!showControls && !isPlaying && (
        <TouchableOpacity
          style={styles.minimalPlayButton}
          onPress={togglePlayPause}
        >
          <View className="bg-black/50 rounded-full p-4">
            <Play className="h-12 w-12 text-white" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'black',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderRadius: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  minimalPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});

export default UniversalVideoPlayer;
