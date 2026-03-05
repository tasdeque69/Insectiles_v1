import { logger } from './logger';

export const loadImages = (paths: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(
    paths.map((path) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => {
          logger.warn('Failed to load image', { path });
          resolve(new Image());
        };
      });
    })
  );
};

export const loadVideos = (paths: string[]): Promise<HTMLVideoElement[]> => {
  return Promise.all(
    paths.map((path) => {
      return new Promise<HTMLVideoElement>((resolve) => {
        const video = document.createElement('video');
        let settled = false;

        const resolveOnce = (value: HTMLVideoElement) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          video.oncanplaythrough = null;
          video.onerror = null;
          resolve(value);
        };

        video.src = path;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        video.oncanplaythrough = () => resolveOnce(video);
        video.onerror = () => {
          logger.warn('Failed to load video', { path });
          resolveOnce(document.createElement('video'));
        };

        const timeoutId = window.setTimeout(() => resolveOnce(video), 2000);
        video.load();
      });
    })
  );
};

export const preloadAssets = async (imagePaths: string[], videoPaths: string[]) => {
  const [images, videos] = await Promise.all([
    loadImages(imagePaths),
    loadVideos(videoPaths),
  ]);
  return { images, videos };
};
