import time
import re
from playwright.sync_api import sync_playwright, expect

def test_tabs_debug(page):
    page.goto("http://localhost:8080/staff")
    time.sleep(3)

    print(f"Current URL: {page.url}")

    # List all tabs
    all_tabs = page.get_by_role("tab").all()
    print(f"Found {len(all_tabs)} tabs:")
    for tab in all_tabs:
        print(f" - {tab.inner_text()}")

    # Take screenshot to see what's going on
    page.screenshot(path="staff_debug_tabs.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_tabs_debug(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
