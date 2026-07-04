from playwright.sync_api import sync_playwright

import time


VIDEO_PATH = r"D:\AutoUploader\exports\video.mp4"

VIDEO_TITLE = "AUTO TEST VIDEO"


with sync_playwright() as p:

    browser = p.chromium.connect_over_cdp(
        "http://localhost:9222"
    )

    context = browser.contexts[0]

    page = context.new_page()

    print("")
    print("OPEN YOUTUBE")
    print("")

    page.goto(
        "https://www.youtube.com/upload",
        wait_until="domcontentloaded"
    )

    time.sleep(10)

    print("")
    print("UPLOAD VIDEO")
    print("")

    page.wait_for_selector(
        'input[type="file"]',
        timeout=30000
    )

    upload_input = page.locator(
        'input[type="file"]'
    ).first

    upload_input.set_input_files(
        VIDEO_PATH
    )

    print("")
    print("VIDEO INSERTED")
    print("")

    input("PRESS ENTER TO CLOSE")