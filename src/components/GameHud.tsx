import type { PerfSnapshot } from '../utils/perfSampler';

interface GameHudProps {
  score: number;
  highScore: number;
  isFeverMode: boolean;
  feverProgress: number;
  comboMultiplier: number;
  shieldCharges: number;
  slowMoActive: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  perfSnapshot: PerfSnapshot | null;
  showPerfHud: boolean;
}

export default function GameHud({
  score,
  highScore,
  isFeverMode,
  feverProgress,
  comboMultiplier,
  shieldCharges,
  slowMoActive,
  soundEnabled,
  onToggleSound,
  perfSnapshot,
  showPerfHud,
}: GameHudProps) {
  return (
    <div data-testid="game-hud" className="absolute top-4 left-0 right-0 z-10 flex flex-col px-6">
      <div className="flex justify-between items-start gap-3">
        <div className="text-white font-mono text-2xl drop-shadow-md flex flex-col">
          <span data-testid="score">Score: {score}</span>
          {comboMultiplier > 1 && <span className="text-yellow-300 text-sm">Combo x{comboMultiplier}</span>}
          {isFeverMode && (
            <span data-testid="fever-indicator" className="text-fuchsia-400 animate-pulse text-xl font-bold drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]">
              FEVER MODE!
            </span>
          )}
          {slowMoActive && <span className="text-cyan-300 text-sm">SLOW-MO ACTIVE</span>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div data-testid="high-score" className="text-white/70 font-mono text-lg drop-shadow-md">Best: {highScore}</div>
          <div className="text-white/70 font-mono text-sm">Shield: {'🛡️'.repeat(shieldCharges) || '—'}</div>
          <button
            type="button"
            onClick={onToggleSound}
            className="pointer-events-auto rounded-full bg-white/10 px-3 py-1 text-xs font-mono text-white hover:bg-white/20"
          >
            {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </button>
          {showPerfHud && perfSnapshot && (
            <div className="rounded-md border border-cyan-300/40 bg-black/40 px-2 py-1 text-[11px] font-mono text-cyan-100">
              <div>FPS: {perfSnapshot.fps.toFixed(1)}</div>
              <div>Frame: {perfSnapshot.avgFrameMs.toFixed(2)}ms</div>
              <div>Drops: {perfSnapshot.droppedFrames}</div>
            </div>
          )}
        </div>
      </div>
      {!isFeverMode && (
        <div data-testid="fever-progress" className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden backdrop-blur-sm border border-white/5">
          <div className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500" style={{ width: `${feverProgress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
