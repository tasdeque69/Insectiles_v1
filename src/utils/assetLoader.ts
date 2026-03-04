const ASSETS = {
  backgrounds: [
    '/Pinik_pipra_mascot_and_backgrounds_47e7914f7b.jpeg',
    '/Pinik_pipra_mascot_and_backgrounds_cd6b5fdca4.jpeg',
    '/Pinik_pipra_mascot_and_backgrounds_d6feaccb97.jpeg',
    '/Pinik_pipra_mascot_and_backgrounds_d9c316ecec.jpeg',
  ],
  insects: [
    '/Cute_insect_game_sprites_falling_0b050bf343.jpeg',
    '/Cute_insect_game_sprites_falling_4da88f57ef.jpeg',
    '/Cute_insect_game_sprites_falling_cda762daa8.jpeg',
    '/Cute_insect_game_sprites_falling_e710e71082.jpeg',
  ],
  mascots: [
    '/Pink_ant_mascot_game_sprite_16bc3366ef.jpeg',
    '/Pink_ant_mascot_game_sprite_3379ebd6e6.jpeg',
    '/Pink_ant_mascot_game_sprite_49f52b4e1d.jpeg',
    '/Pink_ant_mascot_game_sprite_c415249f25.jpeg',
  ],
};

class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded = false;
  private loading = false;

  async load(): Promise<void> {
    if (this.loaded || this.loading) return;
    this.loading = true;

    const loadPromises: Promise<void>[] = [];

    for (const [category, paths] of Object.entries(ASSETS)) {
      for (const path of paths) {
        const promise = new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.images.set(path, img);
            resolve();
          };
          img.onerror = () => {
            // Fail silently - will fall back to gradient
            resolve();
          };
          img.src = path;
        });
        loadPromises.push(promise);
      }
    }

    await Promise.all(loadPromises);
    this.loaded = true;
    this.loading = false;
  }

  get(path: string): HTMLImageElement | undefined {
    return this.images.get(path);
  }

  getRandomFromCategory(category: keyof typeof ASSETS): string | undefined {
    const paths = ASSETS[category];
    return paths[Math.floor(Math.random() * paths.length)];
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const assetLoader = new AssetLoader();
export { ASSETS };
