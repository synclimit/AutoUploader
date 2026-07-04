const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let networkLogs = [];
  let consoleLogs = [];
  
  // Intercept network requests
  page.on('request', request => {
    if (request.url().includes('/api/v1/media/video')) {
        networkLogs.push(request.method() + ' ' + request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/v1/media/video')) {
        const headers = await response.headers();
        networkLogs.push('RESPONSE ' + response.status() + ' ' + response.url() + ' headers: ' + JSON.stringify(headers));
    }
  });

  // Listen to console errors
  page.on('console', msg => {
    consoleLogs.push('[' + msg.type() + '] ' + msg.text());
  });

  // Navigate to frontend dashboard
  await page.goto('http://localhost:5173/');
  
  // Wait for 3 seconds to load
  await page.waitForTimeout(3000);
  
  // Click Review tab on the sidebar
  // We can evaluate or click by text
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page.waitForTimeout(2000);

  // Click on a video row to load it into the center panel
  // We will just click the first element that looks like a row
  const rows = await page.locator('.group.relative.flex.items-center');
  if (await rows.count() > 0) {
      await rows.first().click();
      await page.waitForTimeout(1000);

      // Take screenshot of Review tab
      await page.screenshot({ path: 'evidence/sprint_8.6/screenshot_review.png' });

      // Click Play on the video
      // Since video tag has controls, we might need to click the video element or execute js to play
      await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) video.play();
      });
      await page.waitForTimeout(2000);

      // Seek
      await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) video.currentTime = video.duration > 5 ? 5 : 1;
      });
      await page.waitForTimeout(1000);

      // Pause
      await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) video.pause();
      });
      await page.waitForTimeout(1000);

      // Volume
      await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) video.volume = 0.5;
      });
      await page.waitForTimeout(1000);
  }

  // Create evidence directory if not exists
  if (!fs.existsSync('evidence/sprint_8.6')) {
      fs.mkdirSync('evidence/sprint_8.6', { recursive: true });
  }
  
  fs.writeFileSync('evidence/sprint_8.6/network_logs.json', JSON.stringify(networkLogs, null, 2));
  fs.writeFileSync('evidence/sprint_8.6/console_logs.json', JSON.stringify(consoleLogs, null, 2));

  await browser.close();
})();
