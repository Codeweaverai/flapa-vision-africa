import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const SimpleVideoPlayer = lazy(() => import('./SimpleVideoPlayer'));

interface LazyVideoPlayerProps {
  videoUrl: string;
  thumbnail?: string;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({
  videoUrl,
  thumbnail,
  onProgress,
  onEnd,
  onError
}) => {
  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center bg-black">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-white" />
            <p className="text-sm text-white mt-2">Loading player...</p>
          </div>
        </div>
      }>
        <SimpleVideoPlayer
          videoUrl={videoUrl}
          thumbnail={thumbnail}
          onProgress={onProgress}
          onEnd={onEnd}
          onError={onError}
        />
      </Suspense>
    </div>
  );
};

export default LazyVideoPlayer;