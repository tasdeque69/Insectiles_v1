export interface LaneTarget {
  id: number;
  lane: number;
  y: number;
}

export const FEVER_HIT_SCORE = 20;
export const NORMAL_HIT_SCORE = 10;

export const calculateHitScore = (isFeverMode: boolean) =>
  isFeverMode ? FEVER_HIT_SCORE : NORMAL_HIT_SCORE;

export const findTopTargetInLane = <T extends LaneTarget>(items: T[], lane: number): T | undefined => {
  let top: T | undefined;
  for (const item of items) {
    if (item.lane !== lane) continue;
    if (!top || item.y > top.y) top = item;
  }
  return top;
};
