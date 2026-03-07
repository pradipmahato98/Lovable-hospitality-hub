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
        # The button is now a proper button with name/chevron
        profile_button = page.locator("header .rounded-full").filter(has_text="User").first
        if not profile_button.is_visible():
            # Fallback for mobile or if name is different
            profile_button = page.locator("header button.rounded-full").first

        profile_button.click()
        time.sleep(1)

        # Take screenshot of the dropdown
        page.screenshot(path="verification/header_dropdown_v2.png")

        # Find the "Preferences" link
        pref_link = page.get_by_text("Preferences").first
        if pref_link.is_visible():
            print("Preferences link is visible")
            pref_link.click()
            time.sleep(2)

            # Verify redirection
            print(f"Current URL after click: {page.url}")
            page.screenshot(path="verification/redirected_preferences_v2.png")
        else:
            print("Preferences link NOT found")

        browser.close()

if __name__ == "__main__":
    verify_header_link()
