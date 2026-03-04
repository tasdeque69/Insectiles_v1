export const loadImages = (paths: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(
    paths.map((path) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn('Failed to load image: ' + path);
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
        video.src = path;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.oncanplaythrough = () => resolve(video);
        video.onerror = () => {
          console.warn('Failed to load video: ' + path);
          resolve(document.createElement('video'));
        };
        video.load();
        setTimeout(() => resolve(video), 2000);
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
