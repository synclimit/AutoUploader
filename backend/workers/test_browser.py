from playwright.sync_api import sync_playwright

import os
import time


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

PROFILE_PATH = os.path.join(
    BASE_DIR,
    "browser_profiles",
    "youtube_automation"
)


with sync_playwright() as p:

    context = p.chromium.launch_persistent_context(

        user_data_dir=PROFILE_PATH,

        channel="chrome",

        headless=False,

        ignore_default_args=[
            "--enable-automation"
        ],

        args=[
            "--disable-blink-features=AutomationControlled",
            "--start-maximized",
            "--disable-dev-shm-usage"
        ]

    )

    page = context.pages[0]

    page.goto(
        "https://www.youtube.com",
        wait_until="networkidle"
    )

    time.sleep(5)

    page.goto(
        "https://studio.youtube.com",
        wait_until="networkidle"
    )

    print("")
    print("YOUTUBE STUDIO SESSION READY")
    print("")

    input("PRESS ENTER TO CLOSE")

    context.close()