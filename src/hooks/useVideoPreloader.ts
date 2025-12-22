import { useCallback, useRef, useEffect } from 'react';

interface VideoPreloadState {
  preloadedUrls: Set<string>;
  isLoading: boolean;
  progress: number;
}

export const useVideoPreloader = () => {
  const preloadStateRef = useRef<VideoPreloadState>({
    preloadedUrls: new Set(),
    isLoading: false,
    progress: 0
  });

  // Preload a single video
  const preloadVideo = useCallback(async (url: string): Promise<void> => {
    if (!url || preloadStateRef.current.preloadedUrls.has(url)) return;

    preloadStateRef.current.isLoading = true;
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.style.display = 'none';
      
      video.addEventListener('loadedmetadata', () => {
        preloadStateRef.current.preloadedUrls.add(url);
        preloadStateRef.current.isLoading = false;
        resolve();
      });

      video.addEventListener('error', () => {
        console.warn(`Failed to preload video: ${url}`);
        preloadStateRef.current.isLoading = false;
        resolve();
      });

      video.src = url;
      document.body.appendChild(video);
      
      // Remove after preloading
      setTimeout(() => {
        if (document.body.contains(video)) {
          document.body.removeChild(video);
        }
      }, 1000);
    });
  }, []);

  // Preload multiple videos with concurrency control
  const preloadVideos = useCallback(async (
    urls: string[], 
    maxConcurrent = 2
  ): Promise<void> => {
    const validUrls = urls.filter(url => 
      url && !preloadStateRef.current.preloadedUrls.has(url)
    );

    if (validUrls.length === 0) return;

    preloadStateRef.current.isLoading = true;
    
    // Process URLs in batches
    const batches = [];
    for (let i = 0; i < validUrls.length; i += maxConcurrent) {
      batches.push(validUrls.slice(i, i + maxConcurrent));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchPromises = batch.map((url, index) => 
        preloadVideo(url).then(() => {
          preloadStateRef.current.progress = 
            Math.round(((i * maxConcurrent + index + 1) / validUrls.length) * 100);
        })
      );
      
      await Promise.all(batchPromises);
    }

    preloadStateRef.current.isLoading = false;
    preloadStateRef.current.progress = 100;
  }, [preloadVideo]);

  // Preload next N videos based on current index
  const preloadNextVideos = useCallback((
    currentIndex: number,
    allVideos: string[],
    count = 3
  ): void => {
    const nextUrls = [];
    
    for (let i = 1; i <= count; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < allVideos.length) {
        const url = allVideos[nextIndex];
        if (url && !preloadStateRef.current.preloadedUrls.has(url)) {
          nextUrls.push(url);
        }
      }
    }
    
    if (nextUrls.length > 0) {
      // Don't wait for completion, preload in background
      preloadVideos(nextUrls).catch(error => {
        console.error('Background preloading failed:', error);
      });
    }
  }, [preloadVideos]);

  // Clear preloaded videos
  const clearPreloaded = useCallback(() => {
    preloadStateRef.current.preloadedUrls.clear();
    preloadStateRef.current.progress = 0;
  }, []);

  return {
    preloadVideo,
    preloadVideos,
    preloadNextVideos,
    clearPreloaded,
    isLoading: preloadStateRef.current.isLoading,
    progress: preloadStateRef.current.progress,
    preloadedCount: preloadStateRef.current.preloadedUrls.size
  };
};
