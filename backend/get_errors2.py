import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on('console', lambda msg: print(f'CONSOLE: {msg.type}: {msg.text}'))
        page.on('pageerror', lambda err: print(f'ERROR: {err}'))
        await page.goto('http://localhost:5188/')
        await asyncio.sleep(2)
        # Click the Channels tab
        # The Channels tab has an icon inside the sidebar. Let's find it.
        # It's an a or button with aria-label="Saluran" or something.
        try:
            await page.click('button[aria-label="Channels"]', timeout=3000)
        except Exception:
            try:
                await page.evaluate("window.useAppStore.getState().setActiveModule('Channels')")
            except Exception:
                pass
        await asyncio.sleep(2)
        
        # Take a screenshot
        await page.screenshot(path='screenshot2.png')
        print("Screenshot saved to screenshot2.png")
        await browser.close()

asyncio.run(main())
