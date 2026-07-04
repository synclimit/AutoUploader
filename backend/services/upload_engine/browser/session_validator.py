class SessionValidator:
    def validate(self, page) -> bool:
        """Confirm authenticated YouTube Studio session."""
        try:
            page.goto("https://studio.youtube.com", wait_until="domcontentloaded")
            # Wait a bit for redirects if any
            page.wait_for_timeout(3000)
            
            # Check if we are on the studio dashboard or channel URL
            url = page.url
            if "studio.youtube.com/channel" in url or "studio.youtube.com" in url:
                # Need to verify we aren't asked to sign in
                if page.locator("text='Sign in'").count() > 0 or "accounts.google.com" in url:
                    return False
                return True
            return False
        except Exception:
            return False
