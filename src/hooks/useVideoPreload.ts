// hooks/useVideoPreload.ts
import { useEffect, useState } from 'react';

export const useVideoPreload = (videoUrls: string[], priorityUrl?: string) => {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadVideo = (url: string) => {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.crossOrigin = 'anonymous';
        
        // Set minimal metadata to start download
        video.src = url;
        video.load();
        
        // Mark as loaded when enough data is buffered
        video.addEventListener('loadedmetadata', () => {
          setLoadedUrls(prev => new Set(prev).add(url));
          resolve(url);
        });
        
        video.addEventListener('error', () => {
          console.warn(`Failed to preload video: ${url}`);
          resolve(url);
        });
      });
    };

    // Preload priority URL first
    if (priorityUrl) {
      preloadVideo(priorityUrl);
    }

    // Preload other videos in background
    const otherUrls = videoUrls.filter(url => url !== priorityUrl);
    otherUrls.forEach(url => {
      // Use requestIdleCallback for non-critical preloading
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => preloadVideo(url));
      } else {
        setTimeout(() => preloadVideo(url), 1000);
      }
    });
  }, [videoUrls, priorityUrl]);

  return { isLoaded: (url: string) => loadedUrls.has(url) };
};
