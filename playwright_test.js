const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let networkLogs = [];
  let consoleLogs = [];
  
  // Intercept network requests
  page.on('request', request => {
    if (request.url().includes('/api/v1/')) {
        networkLogs.push(request.method() + ' ' + request.url());
    }
  });

  // Listen to console errors
  page.on('console', msg => {
    consoleLogs.push('[' + msg.type() + '] ' + msg.text());
  });

  // Navigate to frontend dashboard
  // We assume frontend is running on localhost:5173 or we can serve it. Wait, is frontend running?
  // Let me just write the script now, I will need to ensure frontend is running first.
  await page.goto('http://localhost:5173/');
  
  // Wait for 3 seconds for polling to kick in
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'dashboard_screenshot.png' });
  
  const domSnapshot = await page.content();
  fs.writeFileSync('dom_snapshot.html', domSnapshot);
  fs.writeFileSync('network_logs.json', JSON.stringify(networkLogs, null, 2));
  fs.writeFileSync('console_logs.json', JSON.stringify(consoleLogs, null, 2));

  await browser.close();
})();
