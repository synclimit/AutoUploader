import { test, expect } from '@playwright/test';

test.describe('Channels UI Audit', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') throw new Error('Console error: ' + msg.text());
    });
    page.on('pageerror', e => {
      throw new Error('Uncaught exception: ' + e.message);
    });
  });

  test('should render Channels correctly', async ({ page }) => {
    await page.goto('/channels');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('channels-baseline.png', { fullPage: true });
  });
});