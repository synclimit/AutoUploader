import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'd:\\AutoUploader\\backend\\docs\\runtime_acceptance';

test.use({ viewport: { width: 1920, height: 1080 } });

test('Capture Commercial Acceptance Screenshots', async ({ page }) => {
  test.setTimeout(90000);

  // Ensure artifact directory exists
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  // Intercept the journal API to return 1000 mock rows for testing virtualization
  await page.route('**/api/v1/campaign-execution/journal*', async route => {
    const url = new URL(route.request().url());
    
    if (url.pathname.endsWith('/export')) {
        return route.fulfill({
            status: 200,
            contentType: 'text/csv',
            headers: { 'Content-Disposition': 'attachment; filename=export.csv' },
            body: 'mock,csv,data\n1,2,3'
        });
    }

    const mockRows = Array.from({ length: 1000 }, (_, i) => ({
      id: `journal-${i}`,
      correlation_id: `CORR-${i}`,
      execution_no: i,
      status: i % 2 === 0 ? 'UPLOADED' : 'FAILED',
      result: i % 2 === 0 ? 'UPLOADED' : 'FAILED',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      duration_seconds: 45,
      video_title: `Mock Video Title ${i}`,
      failure_reason: i % 2 === 0 ? null : 'Mock Failure'
    }));

    const pageNum = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '50');
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: mockRows.slice((pageNum - 1) * pageSize, pageNum * pageSize),
        total: 1000,
        page: pageNum,
        page_size: pageSize
      })
    });
  });

  await page.goto('http://localhost:8000/');
  await expect(page.locator('text=Campaign Health:').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000); 

  // Capture existing UI
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_dashboard.png'), fullPage: true });

  // Navigate to Channel Details to find Upload Journal Button
  await page.click('text=Musik Terpopuler 2025');
  await page.waitForTimeout(2000);
  
  await page.click('text=Open Upload Journal');
  await page.waitForTimeout(2000);
  
  // Now inside Journal Workspace
  await expect(page.locator('text=Campaign Upload Journal')).toBeVisible();
  
  // 1. Initial Empty/Loading -> 50 Rows
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_journal_page1.png'), fullPage: true });

  // 2. Pagination & Virtualization Test
  await page.selectOption('select', { value: '250' }); // Trigger virtualization
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_journal_virtualized.png'), fullPage: true });
  
  // 3. Search & Filter
  await page.fill('input[placeholder="Search correlation, execution, task..."]', 'Test Search');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_journal_search.png'), fullPage: true });

  // 4. Detail Drawer
  await page.click('text=CORR-1');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_journal_drawer.png'), fullPage: true });
  
  // Close Drawer
  await page.click('button:has(svg.lucide-x)');

  // 5. CSV Export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Export CSV')
  ]);
  await download.path(); // Wait for download to finish
});
