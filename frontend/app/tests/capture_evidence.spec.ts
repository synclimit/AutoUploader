import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Server Abal\\.gemini\\antigravity-ide\\brain\\afffd804-8e91-4e98-8cac-7b08234d4a91';

test('Capture Evidence Screenshots', async ({ page }) => {
  test.setTimeout(60000);

  // Ensure artifact directory exists
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  // Intercept settings check
  await page.route('**/api/v1/settings*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { general_theme: 'midnight', app_color: 'cyan', app_density: 'comfortable', app_anim: false }
      })
    });
  });

  // Intercept license check
  await page.route('**/api/v1/license/status', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: true, license_to: 'Ryan Pitstop', type: 'COMMERCIAL_ENTERPRISE' })
    });
  });

  // Dashboard Mocks
  await page.route('**/api/v1/dashboard*', async route => {
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
  });

  await page.route('**/api/v1/accounts', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'chan-1',
            name: 'Ryan Pitstop Alpha',
            channel_name: 'Ryan Pitstop Alpha',
            status: 'healthy',
            authentication_status: 'healthy',
            attention: 'Optimal operational state',
            completed: 10,
            subscribers: '120,000',
            monetized: true,
            mode: 'Continuous',
            source_type: 'Manual',
            coverage_text: '18 Days Left',
            coverage_color: 'green',
            pipeline_config: {
              strategy: 'continuous',
              schedule_mode: 'youtube',
              upload_mode: 'Auto Upload'
            }
          },
          {
            id: 'chan-2',
            name: 'Ryan Pitstop Beta',
            channel_name: 'Ryan Pitstop Beta',
            status: 'warning',
            authentication_status: 'warning',
            attention: 'Low Coverage — 3 days remaining',
            completed: 5,
            subscribers: '45,000',
            monetized: false,
            mode: 'Campaign',
            source_type: 'Manual',
            coverage_text: '3 Days Left',
            coverage_color: 'yellow',
            pipeline_config: {
              strategy: 'campaign',
              schedule_mode: 'application',
              upload_mode: 'Waiting For Approval'
            }
          }
        ]
      })
    });
  });

  await page.route('**/api/v1/accounts/chan-1', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'chan-1',
          name: 'Ryan Pitstop Alpha',
          channel_name: 'Ryan Pitstop Alpha',
          status: 'healthy',
          authentication_status: 'healthy',
          attention: 'Optimal operational state',
          completed: 10,
          subscribers: '120,000',
          monetized: true,
          mode: 'Continuous',
          source_type: 'Manual',
          coverage_text: '18 Days Left',
          coverage_color: 'green',
          pipeline_config: {
            strategy: 'continuous',
            schedule_mode: 'youtube',
            upload_mode: 'Auto Upload'
          }
        }
      })
    });
  });

  await page.route('**/api/v1/accounts/chan-2', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'chan-2',
          name: 'Ryan Pitstop Beta',
          channel_name: 'Ryan Pitstop Beta',
          status: 'warning',
          authentication_status: 'warning',
          attention: 'Low Coverage — 3 days remaining',
          completed: 5,
          subscribers: '45,000',
          monetized: false,
          mode: 'Campaign',
          source_type: 'Manual',
          coverage_text: '3 Days Left',
          coverage_color: 'yellow',
          pipeline_config: {
            strategy: 'campaign',
            schedule_mode: 'application',
            upload_mode: 'Waiting For Approval'
          }
        }
      })
    });
  });

  await page.route('**/api/v1/watch-folder/health', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { accounts: [] }
      })
    });
  });

  await page.route('**/api/v1/analytics/dashboard*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { views: 5000, watch_time: 120, subs: 10, earnings: 5.5 }
      })
    });
  });

  // Mock everything else to ok
  await page.route('**/api/v1/', async route => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'ok' } }) });
  });

  // 1. Screenshot 1: Dashboard
  await page.goto('http://localhost:8000/');
  await expect(page.locator('text=Campaign Health:').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_1_dashboard.png'), fullPage: true });

  // 2. Open Continuous Channel (chan-1)
  await page.click('text=Ryan Pitstop Alpha');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_2_continuous.png'), fullPage: true });

  // 3. Open Campaign Channel (chan-2)
  await page.goto('http://localhost:8000/');
  await expect(page.locator('text=Ryan Pitstop Beta').first()).toBeVisible({ timeout: 15000 });
  await page.click('text=Ryan Pitstop Beta');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_3_campaign.png'), fullPage: true });
});
