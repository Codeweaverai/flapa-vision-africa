
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  fluid?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  responsive?: boolean;
  width?: number;
  height?: number;
  onReady?: (player: any) => void;
  onTimeUpdate?: (currentTime: number, duration: number, percent: number) => void;
  onEnded?: () => void;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  controls = true,
  fluid = true,
  preload = 'auto',
  responsive = true,
  width,
  height,
  onReady,
  onTimeUpdate,
  onEnded,
  className = ''
}) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      // Initialize Video.js player
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        src,
        poster,
        controls,
        autoplay,
        fluid,
        preload,
        responsive,
        width,
        height,
        html5: {
          vhs: {
            overrideNative: true
          }
        }
      }, () => {
        // Player is ready
        if (onReady) {
          onReady(player);
        }
      });

      // Add event listeners
      player.on('timeupdate', () => {
        if (onTimeUpdate) {
          const currentTime = player.currentTime();
          const duration = player.duration();
          const percent = duration > 0 ? (currentTime / duration) : 0;
          onTimeUpdate(currentTime, duration, percent);
        }
      });

      player.on('ended', () => {
        if (onEnded) {
          onEnded();
        }
      });
    } else if (playerRef.current) {
      // Update player if src changes
      const player = playerRef.current;
      player.src({ src });
      player.poster(poster || '');
    }

    return () => {
      // Dispose the Video.js player when component unmounts
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, autoplay, controls, fluid, preload, responsive, width, height, onReady, onTimeUpdate, onEnded]);

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
