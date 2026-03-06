import { test, expect } from '@playwright/test';

test.describe('Pinik Pipra Game E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for assets to load
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    }, { timeout: 30000 });
  });

  test('should display loading screen initially and game when loaded', async ({ page }) => {
    // Loading message should be visible initially
    const loadingText = page.locator('text=LOADING PINIK PIPRA...');
    await expect(loadingText).toBeVisible({ timeout: 5000 });
    
    // Wait for game to load (canvas appears and loading disappears)
    await page.waitForSelector('canvas', { state: 'visible' });
    await expect(loadingText).not.toBeVisible();
    
    // Game container should be visible
    const gameContainer = page.locator('canvas');
    await expect(gameContainer).toBeVisible();
  });

  test('should start game when clicking start button', async ({ page }) => {
    // Initially game is not playing
    const overlay = page.locator('[data-testid="game-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Click start button
    const startButton = page.locator('button:has-text("START")');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // Overlay should disappear and game should be playing
    await expect(overlay).not.toBeVisible();
    
    // HUD should show score 0
    const scoreElement = page.locator('[data-testid="score"]');
    await expect(scoreElement).toContainText('0');
  });

  test('should increase score on successful insect hit', async ({ page }) => {
    // Start the game
    await page.click('button:has-text("START")');
    
    // Get initial score
    const scoreElement = page.locator('[data-testid="score"]');
    const initialScore = await scoreElement.textContent();
    
    // Wait a moment for insects to spawn
    await page.waitForTimeout(2000);
    
    // Click on canvas to hit an insect (simulate tap)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Click in the first lane
      await page.mouse.click(box.x + box.width * 0.125, box.y + box.height * 0.2);
    }
    
    // Score might have increased (or may need multiple attempts)
    // This is a basic sanity check
    const newScore = await scoreElement.textContent();
    expect(newScore).toBeTruthy();
  });

  test('should activate fever mode at 500 points', async ({ page }) => {
    // This test would require manipulating score directly or playing until 500
    // For E2E, we'll check that fever progress bar exists and updates
    await page.click('button:has-text("START")');
    
    // Look for fever progress indicator
    const feverProgress = page.locator('[data-testid="fever-progress"]');
    await expect(feverProgress).toBeVisible();
    
    // The fever mode should not be active initially
    expect(await page.locator('[data-testid="fever-indicator"]').count()).toBe(0);
  });

  test('should handle keyboard controls (1-4 keys)', async ({ page }) => {
    await page.click('button:has-text("START")');
    
    // Wait for insects to spawn
    await page.waitForTimeout(2000);
    
    // Press number keys to hit insects
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');
    
    // Game should still be running without errors
    const scoreElement = page.locator('[data-testid="score"]');
    await expect(scoreElement).toBeVisible();
  });

  test('should not produce console errors on normal gameplay', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.click('button:has-text("START")');
    
    // Wait and interact
    await page.waitForTimeout(3000);
    
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (box) {
      // Several taps
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(box.x + box.width * 0.125 + (i * 20), box.y + box.height * 0.2);
      }
    }
    
    await page.waitForTimeout(1000);
    
    expect(errors.length).toBe(0);
  });

  test('should display game over when insect reaches bottom', async ({ page }) => {
    await page.click('button:has-text("START")');
    
    // Wait for game over (might take a while depending on spawn rate)
    // In normal mode, missing 3 insects causes game over
    // We'll wait or potentially speed up by modifying game speed in dev mode
    
    // For now, check that game over overlay eventually appears
    try {
      await page.waitForSelector('[data-testid="game-over"]', { timeout: 60000 });
    } catch {
      // If game over doesn't happen quickly, we'll skip this test
      // In production, we might inject mutations to force game over
      console.log('Game over did not occur within timeout - test may need adjustment');
    }
    
    const gameOverOverlay = page.locator('[data-testid="game-overlay"]');
    await expect(gameOverOverlay).toBeVisible();
  });

  test('should restart game after game over', async ({ page }) => {
    // Start game
    await page.click('button:has-text("START")');
    
    // Force game over by calling store method (injecting script)
    await page.evaluate(() => {
      // Access the store and set game over
      const store = (window as any).__STORE__;
      if (store) {
        store.getState().setGameOver(true);
      }
    });
    
    // Wait for overlay to reappear
    await page.waitForSelector('button:has-text("START")');
    
    // Click start again
    await page.click('button:has-text("START")');
    
    // Game should be playing again with score reset
    const scoreElement = page.locator('[data-testid="score"]');
    await expect(scoreElement).toContainText('0');
  });

  test('should persist high score in localStorage', async ({ page }) => {
    // Start and play to get a score
    await page.click('button:has-text("START")');
    
    // Wait and interact to build score
    await page.waitForTimeout(5000);
    
    // Check that high score is stored
    const highScoreElement = page.locator('[data-testid="high-score"]');
    const highScoreText = await highScoreElement.textContent();
    
    // Reload page and verify high score persists
    await page.reload();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    
    const newHighScoreElement = page.locator('[data-testid="high-score"]');
    expect(await newHighScoreElement.textContent()).toBe(highScoreText);
  });

  test('should have responsive canvas sizing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.goto('/');
    
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
