const { chromium } = require('playwright');
const fs = require('fs');

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

(async () => {
  console.log("Starting Beta Bug Bash E2E Test...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let bugs = [];
  let networkLogs = [];
  let consoleErrors = [];
  
  page.on('response', async response => {
    if (response.url().includes('/api/v1/')) {
        try {
            const body = await response.json();
            networkLogs.push({ url: response.url(), status: response.status(), body });
        } catch(e) {}
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log("Navigating to Home page...");
    await page.goto('http://localhost:5173/');
    await delay(3000);
    
    // Accounts (Channels)
    console.log("Navigating to Channels page...");
    await page.click('button[aria-label="Channels"]');
    await delay(2000);
    fs.writeFileSync('dom_accounts.html', await page.content());
    
    // Profiles (Preferences)
    console.log("Navigating to Preferences page...");
    await page.click('button[aria-label="Preferences"]');
    await delay(2000);
    fs.writeFileSync('dom_profiles.html', await page.content());
    
    // Review
    console.log("Navigating to Review page...");
    await page.click('button[aria-label="Review"]');
    await delay(2000);
    
    // Completed
    console.log("Navigating to Completed page...");
    await page.click('button[aria-label="Completed"]');
    await delay(2000);
    
    // History
    console.log("Navigating to History page...");
    await page.click('button[aria-label="History"]', { timeout: 2000 }).catch(() => console.log('History button not found'));
    // wait, in Sidebar it doesn't have "History" or "Queue"! It has Home, Import, Review, Completed, Channels, Preferences.
    // The instructions say Account -> Profile -> Import Package -> Review -> Approve -> Queue -> Upload -> Completed -> History.
    // But the sidebar has: Home, Import, Review, Completed, Channels, Preferences.
    // So History is not in the sidebar! 
    await delay(2000);
    fs.writeFileSync('dom_history.html', await page.content());

  } catch (e) {
    console.error("Test Error:", e);
  } finally {
    await browser.close();
    fs.writeFileSync('beta_network_trace.json', JSON.stringify(networkLogs, null, 2));
    fs.writeFileSync('beta_console_errors.json', JSON.stringify(consoleErrors, null, 2));
    console.log("Beta test complete.");
  }
})();
