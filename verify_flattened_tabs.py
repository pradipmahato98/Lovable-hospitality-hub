import time
import re
from playwright.sync_api import sync_playwright, expect

def test_flattened_tabs(page):
    page.goto("http://localhost:8080/staff")
    time.sleep(3)

    # Check tabs list
    tabs = ["Staff Directory", "User Details", "Preferences", "Alerts", "Security", "Logs Report"]
    for tab in tabs:
        expect(page.get_by_role("tab", name=tab)).to_be_visible()
        print(f"Tab '{tab}' is visible")

    # Verify switching
    page.get_by_role("tab", name="User Details").click()
    time.sleep(1)
    expect(page).to_have_url(re.compile(r"tab=details"))
    print("User Details tab active")

    page.get_by_role("tab", name="Preferences").click()
    time.sleep(1)
    expect(page).to_have_url(re.compile(r"tab=preferences"))
    print("Preferences tab active")

    # Take screenshot
    page.screenshot(path="staff_flattened_tabs.png")
    print("Screenshot saved")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_flattened_tabs(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
