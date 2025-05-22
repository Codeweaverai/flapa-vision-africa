
import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onTimeUpdate,
  onEnded,
  autoplay = false,
  controls = true,
  className = 'w-full aspect-video'
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement('video-js');
      videoElement.classList.add('vjs-big-play-centered');

      if (videoRef.current) {
        videoRef.current.appendChild(videoElement);
      }

      playerRef.current = videojs(videoElement, {
        autoplay,
        controls,
        responsive: true,
        fluid: true,
        sources: [{ src, type: 'video/mp4' }],
        poster
      });

      // Add event listeners
      if (onTimeUpdate) {
        playerRef.current.on('timeupdate', () => {
          onTimeUpdate(
            playerRef.current.currentTime(),
            playerRef.current.duration()
          );
        });
      }

      if (onEnded) {
        playerRef.current.on('ended', onEnded);
      }
    } else {
      // Update the player source if it changes
      playerRef.current.src([{ src, type: 'video/mp4' }]);
      if (poster) {
        playerRef.current.poster(poster);
      }
    }
  }, [src, poster, onTimeUpdate, onEnded, autoplay, controls]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className={className}>
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
};

export default VideoPlayer;
