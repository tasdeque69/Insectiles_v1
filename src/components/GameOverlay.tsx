interface GameOverlayProps {
  isPlaying: boolean;
  gameOver: boolean;
  score: number;
  startGame: () => void;
}

export default function GameOverlay({ isPlaying, gameOver, score, startGame }: GameOverlayProps) {
  if (isPlaying && !gameOver) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-yellow-500 mb-2 text-center drop-shadow-[0_0_20px_rgba(0,0,0,1)] transform -skew-x-6">
        PINIK
        <br />
        PIPRA
      </h1>
      {gameOver && (
        <div className="mb-8 text-center">
          <p className="text-red-500 font-mono text-xl mb-2 tracking-tighter">TRIP ENDED (GAME OVER)</p>
          <p className="text-white font-mono text-4xl font-bold underline decoration-fuchsia-500">Score: {score}</p>
        </div>
      )}
      <button
        type="button"
        onClick={startGame}
        aria-label={gameOver ? 'Restart game' : 'Start game'}
        className="px-12 py-5 bg-white text-black font-black text-2xl rounded-full transition-shadow shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400"
      >
        {gameOver ? 'RE-UP' : 'BEGIN TRIP'}
      </button>
      <p className="mt-8 text-white/30 text-xs font-mono uppercase tracking-[0.2em]">"Get high with the ants"</p>
    </div>
  );
}
