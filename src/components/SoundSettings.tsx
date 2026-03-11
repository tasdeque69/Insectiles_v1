import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { audio } from '../utils/audio';
import { analytics } from '../utils/analytics';

export default function SoundSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize from localStorage or audio engine default
    const storedVolume = localStorage.getItem('insectiles_volume');
    if (storedVolume) {
      const vol = parseInt(storedVolume, 10);
      setVolume(vol);
      audio.setVolume(vol / 100);
    } else {
      // Use audio engine's default (0-1 scale)
      const audioDefault = Math.round(audio.getVolume() * 100);
      setVolume(audioDefault || 60);
    }

    const storedMuted = localStorage.getItem('insectiles_muted');
    if (storedMuted === 'true') {
      setIsMuted(true);
      audio.mute();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    audio.setVolume(newVolume / 100);
    localStorage.setItem('insectiles_volume', newVolume.toString());
    localStorage.setItem('insectiles_muted', (newVolume === 0).toString());
    analytics.trackSettingsChange('volume', newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      audio.unmute();
      setIsMuted(false);
      if (volume === 0) {
        setVolume(60);
        audio.setVolume(0.6);
      }
      localStorage.setItem('insectiles_muted', 'false');
      analytics.trackSettingsChange('muted', false);
    } else {
      audio.mute();
      setIsMuted(true);
      localStorage.setItem('insectiles_muted', 'true');
      analytics.trackSettingsChange('muted', true);
    }
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div ref={containerRef} className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        aria-label="Sound settings"
      >
        <VolumeIcon className="w-5 h-5 text-white" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-zinc-900/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-sm font-medium">Sound</span>
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-white/70" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/70" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
              style={{
                background: `linear-gradient(to right, #d946ef 0%, #d946ef ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-white/50">
              <span>0%</span>
              <span>{volume}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
