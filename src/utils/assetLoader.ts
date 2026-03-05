export class AssetLoadError extends Error {
  constructor(public path: string, message: string) {
    super(message);
    this.name = 'AssetLoadError';
  }
}

export const loadImages = async (paths: string[]): Promise<HTMLImageElement[]> => {
  const results = await Promise.all(
    paths.map((path) => loadSingleImage(path))
  );
  const failedCount = results.filter((img) => img.width === 0).length;
  if (failedCount > 0) {
    console.warn(`Failed to load ${failedCount} image(s)`);
  }
  return results;
};

const loadSingleImage = (path: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`Failed to load image: ${path}`);
      resolve(new Image());
    };
  });
};

export const loadVideos = async (paths: string[]): Promise<HTMLVideoElement[]> => {
  const results = await Promise.all(
    paths.map((path) => loadSingleVideo(path))
  );
  const failedCount = results.filter((video) => video.readyState === 0).length;
  if (failedCount > 0) {
    console.warn(`Failed to load ${failedCount} video(s)`);
  }
  return results;
};

const loadSingleVideo = (path: string): Promise<HTMLVideoElement> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = path;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    
    let resolved = false;
    
    video.oncanplaythrough = () => {
      if (!resolved) {
        resolved = true;
        resolve(video);
      }
    };
    
    video.onerror = () => {
      console.error(`Failed to load video: ${path}`);
      if (!resolved) {
        resolved = true;
        resolve(document.createElement('video'));
      }
    };
    
    video.load();
    
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(video);
      }
    }, 5000);
  });
};

export interface PreloadResult {
  images: HTMLImageElement[];
  videos: HTMLVideoElement[];
  hasErrors: boolean;
}

export const preloadAssets = async (
  imagePaths: string[],
  videoPaths: string[]
): Promise<PreloadResult> => {
  const [images, videos] = await Promise.all([
    loadImages(imagePaths),
    loadVideos(videoPaths),
  ]);
  
  const hasErrors = 
    images.some((img) => img.width === 0) ||
    videos.some((video) => video.readyState === 0);
  
  return { images, videos, hasErrors };
};
