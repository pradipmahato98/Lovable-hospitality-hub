from playwright.sync_api import sync_playwright
import time

def verify_header_link():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_context(viewport={'width': 1280, 'height': 800}).new_page()

        # Navigate to home
        page.goto("http://localhost:8080")
        time.sleep(2)

        # Open profile dropdown
        # The button has a rounded-full class and contains the initials
        profile_button = page.locator("header button.rounded-full")
        profile_button.click()
        time.sleep(1)

        # Take screenshot of the dropdown
        page.screenshot(path="verification/header_dropdown.png")

        # Find the "Sidebar Preferences" link
        pref_link = page.get_by_text("Sidebar Preferences")
        if pref_link.is_visible():
            print("Sidebar Preferences link is visible")
            pref_link.click()
            time.sleep(2)

            # Verify redirection
            print(f"Current URL after click: {page.url}")
            page.screenshot(path="verification/redirected_preferences.png")
        else:
            print("Sidebar Preferences link NOT found")

        browser.close()

if __name__ == "__main__":
    verify_header_link()
