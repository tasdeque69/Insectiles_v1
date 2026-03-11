import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../engine/GameEngine';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine();
    engine.setCanvasSize(400, 800);
  });

  describe('initialization', () => {
    it('should create engine with default state', () => {
      expect(engine.getState().isPlaying).toBe(false);
      expect(engine.getState().gameOver).toBe(false);
      expect(engine.getScore()).toBe(0);
    });

    it('should allow custom config', () => {
      const customEngine = new GameEngine({
        LANES: 6,
        INITIAL_SPEED: 5,
        FEVER_SCORE_THRESHOLD: 1000,
      });
      expect(customEngine.getState().speed).toBe(5);
    });
  });

  describe('start/stop', () => {
    it('should start game with initial state', () => {
      engine.start();
      expect(engine.isPlaying()).toBe(true);
      expect(engine.isGameOver()).toBe(false);
    });

    it('should stop game and set gameOver', () => {
      engine.start();
      engine.stop();
      expect(engine.isPlaying()).toBe(false);
      expect(engine.isGameOver()).toBe(true);
    });
  });

  describe('insect spawning', () => {
    it('should spawn insect after start', () => {
      engine.start();
      const insects = engine.getInsects();
      expect(insects.length).toBe(1);
    });

    it('should spawn insects in valid lanes', () => {
      engine.start();
      const insects = engine.getInsects();
      insects.forEach((insect) => {
        expect(insect.lane).toBeGreaterThanOrEqual(0);
        expect(insect.lane).toBeLessThan(4);
      });
    });
  });

  describe('score', () => {
    it('should start with zero score', () => {
      expect(engine.getScore()).toBe(0);
    });

    it('should track score after successful tap', () => {
      engine.start();
      const insects = engine.getInsects();
      const insect = insects[0];
      
      const success = engine.handleTap(
        insect.lane * 100 + 50,
        insect.y + 100
      );
      
      expect(success).toBe(true);
      expect(engine.getScore()).toBeGreaterThan(0);
    });
  });

  describe('fever mode', () => {
    it('should not be in fever mode initially', () => {
      expect(engine.isFeverMode()).toBe(false);
    });

    it.skip('should trigger fever mode at threshold', () => {
      const lowThresholdEngine = new GameEngine({ FEVER_SCORE_THRESHOLD: 3 });
      lowThresholdEngine.setCanvasSize(400, 800);
      lowThresholdEngine.start();
      
      const insects = lowThresholdEngine.getInsects();
      expect(insects.length).toBe(1);
      
      for (let i = 0; i < 3; i++) {
        const currentInsects = lowThresholdEngine.getInsects();
        if (currentInsects.length > 0 && !currentInsects[0].scored) {
          lowThresholdEngine.handleTap(
            currentInsects[0].lane * 100 + 50,
            currentInsects[0].y + 100
          );
        }
        if (i < 2) {
          lowThresholdEngine.update();
        }
      }
      
      expect(lowThresholdEngine.isFeverMode()).toBe(true);
    });
  });

  describe('update loop', () => {
    it('should update game state on update', () => {
      engine.start();
      const initialFrames = engine.getState().frames;
      engine.update();
      expect(engine.getState().frames).toBe(initialFrames + 1);
    });

    it('should not update when not playing', () => {
      const initialFrames = engine.getState().frames;
      engine.update();
      expect(engine.getState().frames).toBe(initialFrames);
    });
  });

  describe('event system', () => {
    it('should subscribe and emit events', () => {
      const callback = vi.fn();
      engine.subscribe(callback);
      engine.start();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe properly', () => {
      const callback = vi.fn();
      const unsubscribe = engine.subscribe(callback);
      unsubscribe();
      engine.start();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('game over', () => {
    it('should end game when insect reaches bottom', () => {
      engine.start();
      
      const insects = engine.getInsects();
      insects[0].y = 900;
      
      engine.update();
      
      expect(engine.isGameOver()).toBe(true);
    });
  });
});
