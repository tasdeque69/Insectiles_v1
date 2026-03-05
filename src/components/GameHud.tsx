interface GameHudProps {
  score: number;
  highScore: number;
  isFeverMode: boolean;
  feverProgress: number;
}

export default function GameHud({ score, highScore, isFeverMode, feverProgress }: GameHudProps) {
  return (
    <div className="absolute top-4 left-0 right-0 z-10 flex flex-col px-6 pointer-events-none">
      <div className="flex justify-between items-start">
        <div className="text-white font-mono text-2xl drop-shadow-md flex flex-col">
          <span>Score: {score}</span>
          {isFeverMode && (
            <span className="text-fuchsia-400 animate-pulse text-xl font-bold drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]">
              FEVER MODE!
            </span>
          )}
        </div>
        <div className="text-white/50 font-mono text-xl drop-shadow-md">Best: {highScore}</div>
      </div>
      {!isFeverMode && (
        <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden backdrop-blur-sm border border-white/5">
          <div className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" style={{ width: `${feverProgress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
