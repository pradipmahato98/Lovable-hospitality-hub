from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        page.goto('http://localhost:8081/')
        time.sleep(10)

        # Verify multiple dropdowns exist
        dropdowns = ["Guests", "Reservations", "Front Desk", "Inventory", "Finance/Account", "Staff Management"]
        for d in dropdowns:
            btn = page.get_by_role("button", name=d)
            if btn.is_visible():
                print(f"Dropdown button for {d} is visible")
                btn.click()
                time.sleep(1)
            else:
                print(f"Dropdown button for {d} NOT visible")

        page.screenshot(path='verification/multiple_dropdowns_open.png')

        # Verify navigation from dropdown works
        # Let's try Staff Management -> Preferences
        page.get_by_role("button", name="Staff Management").click()
        time.sleep(1)
        page.get_by_role("link", name="Preferences").click()
        time.sleep(5)

        print(f"URL after clicking Preferences: {page.url}")
        page.screenshot(path='verification/navigated_to_preferences.png')

        # Check if Preferences tab is active
        # The text "System Preferences" should be on the page
        if page.get_by_text("System Preferences").is_visible():
            print("Successfully navigated to Preferences tab")
        else:
            print("Failed to navigate to Preferences tab or content not found")

        browser.close()

if __name__ == "__main__":
    run()
