from playwright.sync_api import sync_playwright


with sync_playwright() as p:

    browser = p.chromium.launch(
        headless=False
    )

    page = browser.new_page()

    page.goto(
        "https://studio.youtube.com"
    )

    print("BROWSER OPENED")

    input("PRESS ENTER TO CLOSE")

    browser.close()