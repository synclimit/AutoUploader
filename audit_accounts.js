const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    let defects = [];
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            defects.push({ type: 'Console Error', message: msg.text() });
        }
    });

    page.on('requestfailed', request => {
        defects.push({ type: 'Network Error', url: request.url(), error: request.failure().errorText });
    });

    page.on('response', resp => {
        if (!resp.ok() && resp.url().includes('/api/v1/')) {
            defects.push({ type: 'API Error', status: resp.status(), url: resp.url() });
        }
    });

    try {
        await page.goto('http://localhost:5173');
        await page.waitForTimeout(2000);
        
        // Navigate to Accounts
        await page.click('text="Accounts"');
        await page.waitForTimeout(2000);
        
        // 1. Check if 'Add Channel' button exists
        const addBtn = await page.locator('text="Add Channel"').count();
        if (addBtn === 0) defects.push({ type: 'UI Missing', message: 'Add Channel button not found' });
        
        if (addBtn > 0) {
            await page.click('text="Add Channel"');
            await page.waitForTimeout(1000);
            
            // Try to fill the form (assuming standard inputs)
            // Just checking if form appears
            const channelNameInput = await page.locator('input[name="channel_name"], input[placeholder*="Channel"]').count();
            if (channelNameInput === 0) defects.push({ type: 'UI Missing', message: 'Add Channel form inputs not found' });
        }
        
    } catch (e) {
        defects.push({ type: 'Fatal Exception', message: e.toString() });
    }
    
    fs.writeFileSync('audit_results.json', JSON.stringify(defects, null, 2));
    await browser.close();
    console.log("Audit completed");
})();
