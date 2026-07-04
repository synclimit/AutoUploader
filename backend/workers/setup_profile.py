from playwright.sync_api import sync_playwright
import os
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILE_PATH = os.path.join(BASE_DIR, "browser_profiles", "youtube_automation")

def setup_profile():
    print("="*50)
    print("YouTube Studio Authentication Setup")
    print("="*50)
    print(f"Profile directory: {PROFILE_PATH}")
    print("\nInstructions:")
    print("1. A browser window will open.")
    print("2. Log into your YouTube testing account.")
    print("3. Ensure you can access YouTube Studio (studio.youtube.com).")
    print("4. Close the browser window when finished.\n")
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_PATH,
            channel="chrome",
            headless=False,
            ignore_default_args=["--enable-automation"],
            args=[
                "--disable-blink-features=AutomationControlled",
                "--start-maximized"
            ]
        )
        
        page = context.pages[0] if context.pages else context.new_page()
        page.goto("https://studio.youtube.com", wait_until="networkidle")
        
        print("Waiting for you to log in and close the browser...")
        
        # Wait until the user closes the context manually
        try:
            while context.pages:
                time.sleep(1)
        except Exception:
            pass
            
        print("\nBrowser closed. Authentication profile saved successfully!")

if __name__ == "__main__":
    setup_profile()
