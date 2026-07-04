const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

(async () => {
  console.log("Starting Full Upload Workflow Runtime Verification...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let networkLogs = [];
  
  page.on('response', async response => {
    if (response.url().includes('/api/v1/')) {
        try {
            const body = await response.json();
            networkLogs.push({
                url: response.url(),
                status: response.status(),
                body: body
            });
        } catch (e) {
            // ignore non-json
        }
    }
  });

  console.log("Navigating to Dashboard...");
  await page.goto('http://localhost:5173/');
  await delay(2000);
  
  // Here we would normally click Import, select file etc.
  // But since the frontend uses a watch folder or API for import,
  // it might be easier to trigger the import via the API directly using fetch,
  // and then use the UI to Review, Approve, and check History.
  
  console.log("Extracting DOM State...");
  const dom = await page.content();
  fs.writeFileSync('dom_state_initial.html', dom);

  await browser.close();
  fs.writeFileSync('network_trace.json', JSON.stringify(networkLogs, null, 2));
  console.log("Frontend trace complete.");
})();
