import { test, expect } from '@playwright/test';

test.describe('Dashboard UI Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Console error detected: ${msg.text()}`);
      }
    });

    // Listen for uncaught exceptions in the page
    page.on('pageerror', exception => {
      throw new Error(`Uncaught exception: ${exception.message}`);
    });
  });

  test('should render Dashboard statistics and layout', async ({ page }) => {
    await page.goto('/');
    
    // Validate core layout elements
    await expect(page.getByRole('heading', { name: /Your Attention/i })).toBeVisible();
    
    // Add wait for data to load instead of networkidle due to dashboard polling
    await expect(page.getByText(/running smoothly/i)).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Visual regression snapshot
    await expect(page).toHaveScreenshot('dashboard-baseline.png', { fullPage: true });
  });
});
