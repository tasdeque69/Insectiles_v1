import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have initial values', () => {
      const state = useGameStore.getState();
      expect(state.score).toBe(0);
      expect(state.highScore).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.gameOver).toBe(false);
      expect(state.feverMode).toBe(false);
    });
  });

  describe('startGame', () => {
    it('should set isPlaying to true', () => {
      useGameStore.getState().startGame();
      expect(useGameStore.getState().isPlaying).toBe(true);
    });

    it('should reset score', () => {
      useGameStore.getState().incrementScore(100);
      useGameStore.getState().startGame();
      expect(useGameStore.getState().score).toBe(0);
    });

    it('should reset fever mode', () => {
      useGameStore.getState().setFeverMode(true);
      useGameStore.getState().startGame();
      expect(useGameStore.getState().feverMode).toBe(false);
    });
  });

  describe('endGame', () => {
    it('should set isPlaying to false', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().endGame();
      expect(useGameStore.getState().isPlaying).toBe(false);
    });

    it('should set gameOver to true', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().endGame();
      expect(useGameStore.getState().gameOver).toBe(true);
    });

    it('should update high score', () => {
      useGameStore.getState().incrementScore(100);
      useGameStore.getState().endGame();
      expect(useGameStore.getState().highScore).toBe(100);
    });

    it('should keep highest high score', () => {
      useGameStore.getState().incrementScore(100);
      useGameStore.getState().endGame();
      useGameStore.getState().startGame();
      useGameStore.getState().incrementScore(50);
      useGameStore.getState().endGame();
      expect(useGameStore.getState().highScore).toBe(100);
    });
  });

  describe('incrementScore', () => {
    it('should increment score', () => {
      useGameStore.getState().incrementScore(10);
      expect(useGameStore.getState().score).toBe(10);
    });

    it('should accumulate score', () => {
      useGameStore.getState().incrementScore(10);
      useGameStore.getState().incrementScore(20);
      expect(useGameStore.getState().score).toBe(30);
    });
  });

  describe('setFeverMode', () => {
    it('should set fever mode to true', () => {
      useGameStore.getState().setFeverMode(true);
      expect(useGameStore.getState().feverMode).toBe(true);
    });

    it('should set fever mode to false', () => {
      useGameStore.getState().setFeverMode(true);
      useGameStore.getState().setFeverMode(false);
      expect(useGameStore.getState().feverMode).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      useGameStore.getState().startGame();
      useGameStore.getState().incrementScore(100);
      useGameStore.getState().setFeverMode(true);
      useGameStore.getState().reset();
      
      const state = useGameStore.getState();
      expect(state.score).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.gameOver).toBe(false);
      expect(state.feverMode).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update sound setting', () => {
      useGameStore.getState().updateSettings({ soundEnabled: false });
      expect(useGameStore.getState().settings.soundEnabled).toBe(false);
    });

    it('should update volume settings', () => {
      useGameStore.getState().updateSettings({ musicVolume: 0.5 });
      expect(useGameStore.getState().settings.musicVolume).toBe(0.5);
    });

    it('should merge settings', () => {
      useGameStore.getState().updateSettings({ soundEnabled: false });
      useGameStore.getState().updateSettings({ vibrationEnabled: false });
      expect(useGameStore.getState().settings.soundEnabled).toBe(false);
      expect(useGameStore.getState().settings.vibrationEnabled).toBe(false);
    });
  });
});
