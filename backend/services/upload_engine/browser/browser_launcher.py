from playwright.sync_api import sync_playwright

class BrowserLauncher:
    def __init__(self, headless: bool = True):
        self.headless = headless

    def launch(self, playwright_instance, profile_path: str):
        context = playwright_instance.chromium.launch_persistent_context(
            user_data_dir=profile_path,
            channel="chrome",
            headless=self.headless,
            ignore_default_args=["--enable-automation"],
            args=[
                "--disable-blink-features=AutomationControlled",
                "--start-maximized",
                "--disable-dev-shm-usage"
            ]
        )
        return context
