import React, { useState } from 'react';
import { Play, Settings, HelpCircle, Trophy, Music, Volume2, Info, Star, Zap, Target, Award } from 'lucide-react';
import SoundSettings from './SoundSettings';
import { analytics } from '../utils/analytics';

type MenuScreen = 'main' | 'settings' | 'howtoplay' | 'credits';

interface MenuProps {
  onStartGame: () => void;
  highScore: number;
}

export default function Menu({ onStartGame, highScore }: MenuProps) {
  const [currentScreen, setCurrentScreen] = useState<MenuScreen>('main');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MenuButton = (props: { onClick: () => void; icon: any; children: React.ReactNode; className?: string }) => (
    <button
      onClick={props.onClick}
      className={`flex items-center gap-4 w-64 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 ${props.className || ''}`}
    >
      <props.icon className="w-6 h-6 text-fuchsia-400" />
      <span className="text-white font-bold text-lg">{props.children}</span>
    </button>
  );

  const MainMenu = () => (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-yellow-500 drop-shadow-lg transform -skew-x-6">
          INSECTILES
        </h1>
        <p className="text-white/60 mt-2 text-sm">Psychedelic Tile Matching</p>
      </div>

      <MenuButton onClick={() => { analytics.trackMenuAction('play'); onStartGame(); }} icon={Play}>
        PLAY
      </MenuButton>

      <MenuButton onClick={() => { analytics.trackMenuAction('how_to_play'); setCurrentScreen('howtoplay'); }} icon={HelpCircle}>
        How to Play
      </MenuButton>

      <MenuButton onClick={() => { analytics.trackMenuAction('settings'); setCurrentScreen('settings'); }} icon={Settings}>
        Settings
      </MenuButton>

      <MenuButton onClick={() => { analytics.trackMenuAction('credits'); setCurrentScreen('credits'); }} icon={Award}>
        Credits
      </MenuButton>

      {highScore > 0 && (
        <div className="flex items-center gap-2 mt-4 px-6 py-3 bg-fuchsia-500/20 rounded-full border border-fuchsia-500/30">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-bold">Best: {highScore}</span>
        </div>
      )}
    </div>
  );

  const HowToPlay = () => (
    <div className="flex flex-col items-center gap-6 max-w-md">
      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
        How to Play
      </h2>

      <div className="space-y-4 text-left w-full">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Tap Insects</h3>
            <p className="text-white/60 text-sm">Tap the lowest insect in each lane before it reaches the bottom!</p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Build Combos</h3>
            <p className="text-white/60 text-sm">Chain taps quickly for combos and extra points!</p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Fever Mode</h3>
            <p className="text-white/60 text-sm">Score 500+ points to trigger Fever Mode - double speed, double fun!</p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Game Over</h3>
            <p className="text-white/60 text-sm">Don't tap empty lanes or miss insects - or it's game over!</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentScreen('main')}
        className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20"
      >
        Back to Menu
      </button>
    </div>
  );

  const SettingsMenu = () => (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
        Settings
      </h2>

      <div className="w-full max-w-xs space-y-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-5 h-5 text-fuchsia-400" />
            <span className="text-white font-bold">Sound</span>
          </div>
          <SoundSettings />
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-bold">Music</span>
            <span className="ml-auto text-white/50 text-sm">On</span>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold">Vibration</span>
            <span className="ml-auto text-white/50 text-sm">On</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentScreen('main')}
        className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20"
      >
        Back to Menu
      </button>
    </div>
  );

  const Credits = () => (
    <div className="flex flex-col items-center gap-6 max-w-md">
      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-yellow-500">
        Credits
      </h2>

      <div className="text-center space-y-4 w-full">
        <div>
          <h3 className="text-white font-bold text-xl">Insectiles</h3>
          <p className="text-white/60">Version 1.0.0</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-white/70 text-sm">
            A psychedelic tile-matching game with synthesized psytrance audio.
          </p>
        </div>

        <div className="text-white/40 text-xs">
          <p>Built with React, TypeScript, Three.js</p>
          <p>and lots of 💜</p>
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-white/50 text-sm">
            © 2026 Insectiles Game
          </p>
        </div>
      </div>

      <button
        onClick={() => setCurrentScreen('main')}
        className="mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20"
      >
        Back to Menu
      </button>
    </div>
  );

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-purple-900/20 to-zinc-900 p-8">
      {currentScreen === 'main' && <MainMenu />}
      {currentScreen === 'howtoplay' && <HowToPlay />}
      {currentScreen === 'settings' && <SettingsMenu />}
      {currentScreen === 'credits' && <Credits />}
    </div>
  );
}
