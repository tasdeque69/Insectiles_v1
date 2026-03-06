interface SpawnIntervalParams {
  isFeverMode: boolean;
  score: number;
}

interface SpeedParams {
  score: number;
  initialSpeed: number;
  speedIncrement: number;
  maxSpeed: number;
}

export const shouldActivateFeverMode = (score: number, threshold: number, isFeverMode: boolean): boolean => {
  return score >= threshold && !isFeverMode;
};

export const calculateSpawnInterval = ({ isFeverMode, score }: SpawnIntervalParams): number => {
  const baseInterval = isFeverMode ? 30 : 100;
  return Math.max(20, baseInterval - Math.floor(score / 10));
};

export const calculateGameSpeed = ({ score, initialSpeed, speedIncrement, maxSpeed }: SpeedParams): number => {
  const nextSpeed = initialSpeed + score * speedIncrement;
  return Math.min(nextSpeed, maxSpeed);
};
