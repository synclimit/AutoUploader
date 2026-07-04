import time
import os
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROFILE_PATH = os.path.join(BASE_DIR, "browser_profiles", "youtube_automation")

def test_upload():
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_PATH,
            channel="chrome",
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )
        page = context.pages[0] if context.pages else context.new_page()
        
        print("Navigating...")
        page.goto("https://studio.youtube.com", wait_until="networkidle")
        
        print("Clicking Create...")
        try:
            page.locator('#create-icon').click(timeout=10000)
            time.sleep(1)
            print("Clicking Upload videos...")
            page.locator('#text-item-0').click(timeout=10000)
        except Exception as e:
            print(f"Failed to click create menu: {e}")
            print("Trying direct url with ?d=ud...")
            page.goto("https://studio.youtube.com/channel/UC/videos?d=ud")
            
        time.sleep(2)
        print("Waiting for file input...")
        try:
            page.wait_for_selector('input[type="file"]', state="attached", timeout=10000)
            print("Found file input!")
        except Exception as e:
            print("File input not found!")
        
        print("Done. Closing.")
        context.close()

if __name__ == "__main__":
    test_upload()
