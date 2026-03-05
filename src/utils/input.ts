export const getLaneFromClientX = (
  clientX: number,
  canvasLeft: number,
  canvasWidth: number,
  laneCount: number
): number => {
  if (laneCount <= 0 || canvasWidth <= 0) return -1;

  const relativeX = clientX - canvasLeft;
  if (relativeX < 0 || relativeX >= canvasWidth) return -1;

  const laneWidth = canvasWidth / laneCount;
  const laneIndex = Math.floor(relativeX / laneWidth);
  if (laneIndex < 0 || laneIndex >= laneCount) return -1;
  return laneIndex;
};
