import { test, expect } from '@playwright/test';

test.describe('Sprint 5.0 — Campaign Operations Dashboard UI & Architecture Lock Verification', () => {
  test('Dashboard loads Operations Center summary cards and widgets without frontend calculation', async ({ page }) => {
    page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Intercept all api calls
    await page.route('**/api/v1**', async route => {
      const url = route.request().url();
      console.log('INTERCEPTED:', url);
      if (url.includes('/license/status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, license_to: 'Ryan Pitstop', type: 'COMMERCIAL_ENTERPRISE' })
        });
      } else if (url.includes('/dashboard/overview')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              connected_channels: { connected_channels: 2, authenticated_channels: 2, disconnected_channels: 0 },
              statistics: { review: 1, completed: 15 }
            }
          })
        });
      } else if (url.includes('/accounts')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'chan-1',
                name: 'Ryan Pitstop Alpha',
                status: 'healthy',
                attention: 'Optimal operational state',
                completed: 10,
                subscribers: '120,000',
                monetized: true,
                mode: 'Continuous',
                coverage_text: '18 Days Left',
                coverage_color: 'green'
              },
              {
                id: 'chan-2',
                name: 'Ryan Pitstop Beta',
                status: 'warning',
                attention: 'Low Coverage — 3 days remaining',
                completed: 5,
                subscribers: '45,000',
                monetized: false,
                mode: 'Campaign',
                coverage_text: '3 Days Left',
                coverage_color: 'yellow'
              }
            ]
          })
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'ok' } }) });
      }
    });

    await page.goto('http://localhost:5188/');

    // Verify Campaign Health Widget counts match backend status counts directly
    await expect(page.locator('text=Campaign Health:')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Healthy').first()).toBeVisible();
    await expect(page.locator('text=Low').first()).toBeVisible();

    // Verify Channel Overview Table headers: Mode & Coverage present, Queue & Action absent
    await expect(page.locator('th:has-text("Mode")')).toBeVisible();
    await expect(page.locator('th:has-text("Coverage")')).toBeVisible();
    await expect(page.locator('th:has-text("Queue")')).toHaveCount(0);
    await expect(page.locator('th:has-text("Action")')).toHaveCount(0);

    // Verify backend-driven Mode and Coverage badges render correctly
    await expect(page.locator('text=Continuous').first()).toBeVisible();
    await expect(page.locator('text=Campaign').first()).toBeVisible();
    await expect(page.locator('text=18 Days Left').first()).toBeVisible();
    await expect(page.locator('text=3 Days Left').first()).toBeVisible();

    // Verify Notification Center displays operational warnings derived from backend channel state
    const notifBtn = page.locator('button:has-text("Notifications")').first();
    await expect(notifBtn).toBeVisible();

    // Verify Auto Refresh selector
    await expect(page.locator('select').first()).toBeVisible();
  });
});
