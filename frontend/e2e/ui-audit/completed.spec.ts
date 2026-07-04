import { test, expect } from '@playwright/test';

test.describe('Completed UI Audit', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') throw new Error('Console error: ' + msg.text());
    });
    page.on('pageerror', e => {
      throw new Error('Uncaught exception: ' + e.message);
    });
  });

  test('should render Completed correctly', async ({ page }) => {
    await page.goto('/completed');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('completed-baseline.png', { fullPage: true });
  });
});