
import { useState, useEffect, useRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerOptions {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  fluid?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  responsive?: boolean;
  width?: number;
  height?: number;
}

export const useVideoPlayer = (videoRef: React.RefObject<HTMLDivElement>, options: VideoPlayerOptions) => {
  const playerRef = useRef<Player | null>(null);
  const [playerState, setPlayerState] = useState({
    currentTime: 0,
    duration: 0,
    progress: 0,
    buffered: 0,
    isPlaying: false,
  });

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // Initialize Video.js player
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered', 'h-full', 'w-full');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        ...options,
        html5: {
          vhs: {
            overrideNative: true
          }
        }
      });

      // Add event listeners
      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        const duration = player.duration();
        const progress = (currentTime / duration) * 100;
        
        setPlayerState(prev => ({
          ...prev,
          currentTime,
          duration,
          progress: isNaN(progress) ? 0 : progress
        }));
      });

      player.on('playing', () => {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      });

      player.on('pause', () => {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      });

      player.on('loadedmetadata', () => {
        setPlayerState(prev => ({
          ...prev,
          duration: player.duration()
        }));
      });

      player.on('progress', () => {
        const buffered = player.buffered();
        if (buffered && buffered.length > 0) {
          const bufferedEnd = buffered.end(buffered.length - 1);
          const duration = player.duration();
          const bufferedPercent = (bufferedEnd / duration) * 100;
          
          setPlayerState(prev => ({
            ...prev,
            buffered: isNaN(bufferedPercent) ? 0 : bufferedPercent
          }));
        }
      });
    } else if (playerRef.current) {
      // Update player if src changes
      const player = playerRef.current;
      player.src({ src: options.src });
      player.poster(options.poster || '');
    }

    return () => {
      // Dispose the Video.js player when component unmounts
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options.src, options.poster]);

  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  };

  const playPause = () => {
    if (!playerRef.current) return;
    
    if (playerRef.current.paused()) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  };

  return {
    player: playerRef.current,
    playerState,
    seekTo,
    playPause
  };
};
