
// Type definitions for YouTube IFrame Player API
interface YT {
  Player: new (
    container: HTMLElement | string,
    options: YT.PlayerOptions
  ) => YT.Player;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

namespace YT {
  interface PlayerOptions {
    width?: string | number;
    height?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    cc_load_policy?: 1;
    color?: 'red' | 'white';
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    end?: number;
    fs?: 0 | 1;
    hl?: string;
    iv_load_policy?: 1 | 3;
    list?: string;
    listType?: 'playlist' | 'search' | 'user_uploads';
    loop?: 0 | 1;
    modestbranding?: 1;
    origin?: string;
    playlist?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    start?: number;
    mute?: 0 | 1;
    showinfo?: 0 | 1;
  }

  interface Events {
    onReady?: (event: YT.PlayerEvent) => void;
    onStateChange?: (event: YT.PlayerEvent) => void;
    onPlaybackQualityChange?: (event: YT.PlayerEvent) => void;
    onPlaybackRateChange?: (event: YT.PlayerEvent) => void;
    onError?: (event: YT.PlayerEvent) => void;
    onApiChange?: (event: YT.PlayerEvent) => void;
  }

  interface PlayerEvent {
    target: YT.Player;
    data: any;
  }

  interface Player {
    // Video control methods
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    nextVideo(): void;
    previousVideo(): void;
    playVideoAt(index: number): void;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    
    // Playback status methods
    getVideoLoadedFraction(): number;
    getPlayerState(): number;
    getCurrentTime(): number;
    getPlaybackRate(): number;
    setPlaybackRate(suggestedRate: number): void;
    getAvailablePlaybackRates(): number[];
    
    // Playlist methods
    getPlaylist(): string[];
    getPlaylistIndex(): number;
    
    // Video information methods
    getDuration(): number;
    getVideoUrl(): string;
    getVideoEmbedCode(): string;
    
    // DOM container methods
    getIframe(): HTMLIFrameElement;
    destroy(): void;
  }
}

interface Window {
  YT: YT;
  onYouTubeIframeAPIReady: () => void;
}
