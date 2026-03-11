import { test, expect } from '@playwright/test';

test.describe('Insectiles Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page without errors', async ({ page }) => {
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Insectiles|Vite/);
    
    // Check that the game canvas/container is visible
    const gameContainer = page.locator('.bg-zinc-950');
    await expect(gameContainer).toBeVisible();
  });

  test('should have no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors (e.g., WebGL warnings in headless)
    const criticalErrors = errors.filter(
      (e) => !e.includes('WebGL') && !e.includes('THREE')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should render the canvas element', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for canvas element (Three.js renders to canvas)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
