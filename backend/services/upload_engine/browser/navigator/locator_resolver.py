class LocatorResolver:
    """
    Attempts to locate an element using a prioritized list of strategies.
    Automatically falls back to the next strategy if one fails.
    """
    
    @staticmethod
    def resolve(page, strategies, timeout: int = 5000):
        """
        strategies is a list of dicts. Example:
        [
            {"type": "role", "role": "button", "name": "Next"},
            {"type": "css", "selector": "#next-button"},
            {"type": "text", "text": "Next"}
        ]
        """
        for strategy in strategies:
            try:
                locator = None
                if strategy["type"] == "role":
                    locator = page.get_by_role(strategy["role"], name=strategy.get("name", None))
                elif strategy["type"] == "css":
                    locator = page.locator(strategy["selector"])
                elif strategy["type"] == "text":
                    locator = page.get_by_text(strategy["text"], exact=strategy.get("exact", False))
                elif strategy["type"] == "test-id":
                    locator = page.get_by_test_id(strategy["test_id"])
                elif strategy["type"] == "aria":
                    locator = page.locator(f'[aria-label="{strategy["label"]}"]')
                
                if locator:
                    # Quick check if it exists (wait state="attached")
                    locator.first.wait_for(state="attached", timeout=timeout)
                    return locator.first
            except Exception:
                continue # Fallback
                
        raise ValueError("LocatorResolver failed all fallback strategies")
