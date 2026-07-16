import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on('console', lambda msg: print(f'CONSOLE: {msg.type}: {msg.text}'))
        page.on('pageerror', lambda err: print(f'ERROR: {err}'))
        await page.goto('http://localhost:5188/')
        await asyncio.sleep(5)
        # Take a screenshot
        await page.screenshot(path='screenshot.png')
        print("Screenshot saved to screenshot.png")
        await browser.close()

asyncio.run(main())
