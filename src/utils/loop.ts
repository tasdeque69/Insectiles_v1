export interface FallingInsect {
  y: number;
  speed: number;
}

export interface PsyEffectLike {
  life: number;
  maxLife: number;
}

export const updateScreenShake = (currentShake: number, isFeverMode: boolean, frames: number): number => {
  let nextShake = currentShake;
  if (nextShake > 0) nextShake *= 0.9;
  if (nextShake < 0) nextShake = 0; // clamp to non-negative
  if (isFeverMode && frames % 10 === 0) nextShake = 10;
  return nextShake;
};

export const advancePsyEffects = <T extends PsyEffectLike>(effects: T[]): T[] => {
  const next: T[] = [];
  for (const effect of effects) {
    const updated = { ...effect, life: effect.life + 1 };
    if (updated.life < updated.maxLife) next.push(updated as T);
  }
  return next;
};

export const moveInsects = <T extends FallingInsect>(
  insects: T[],
  canvasHeight: number,
  isFeverMode: boolean,
  tileHeight: number,
  speedMultiplier = 1
): { insects: T[]; reachedBottom: boolean } => {
  let reachedBottom = false;
  const moved: T[] = [];

  for (const insect of insects) {
    const nextY = insect.y + insect.speed * speedMultiplier;

    if (nextY > canvasHeight) {
      if (!isFeverMode) {
        reachedBottom = true;
        moved.push({ ...insect, y: nextY } as T);
        continue;
      }
      moved.push({ ...insect, y: -tileHeight } as T);
      continue;
    }

    moved.push({ ...insect, y: nextY } as T);
  }

  return { insects: moved, reachedBottom };
};
