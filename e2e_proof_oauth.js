const { chromium } = require('playwright');
const fs = require('fs');
const axios = require('axios');

(async () => {
    console.log("Stage 1: Seed Account");
    let accountId = '';
    try {
        const res = await axios.post('http://localhost:8000/api/v1/accounts', {
            channel_name: 'OAuth Proof Channel',
            source_type: 'MANUAL_UPLOAD'
        });
        accountId = res.data.id || res.data.data.id;
        console.log("Account created:", accountId);
    } catch (e) {
        console.log("Error creating account:", e.message);
        process.exit(1);
    }

    console.log("Stage 2: Playwright UI Proof");
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Simulate redirection from backend oauth callback
    const testUrl = `http://localhost:5173/accounts/confirm?accountId=${accountId}&channelId=UC123&channelName=My+Test+Channel`;
    await page.goto(testUrl);
    await page.waitForTimeout(1000);
    
    // Read DOM
    const textContent = await page.locator('.max-w-md').innerText().catch(()=>'');
    console.log("DOM Output:\n", textContent);
    
    if (textContent.includes("OAuth Authorization")) {
        console.log("PASS: The application successfully routed to the AccountsConfirm component instead of 404.");
    } else {
        console.log("FAIL: Component not found in DOM.");
    }

    await browser.close();
})();
