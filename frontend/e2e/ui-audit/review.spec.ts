import { test, expect } from '@playwright/test';

test.describe('Review UI Audit', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') throw new Error('Console error: ' + msg.text());
    });
    page.on('pageerror', e => {
      throw new Error('Uncaught exception: ' + e.message);
    });
  });

  test('should render Review correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav').getByRole('button', { name: 'Review', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('review-baseline.png', { fullPage: true });
  });
});