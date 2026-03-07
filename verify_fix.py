import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Load the app
        page.goto('http://localhost:8080')
        page.wait_for_selector('nav')

        # 1. Verify Database is removed from sidebar
        print("Checking if 'Database' is in sidebar...")
        is_database_visible = page.is_visible("nav >> text=Database")
        print(f"Database visible in sidebar: {is_database_visible}")
        assert not is_database_visible

        # 2. Verify sidebar auto-expansion after navigation
        print("\nTesting sidebar auto-expansion...")
        # Navigate to Settings
        page.click("nav >> a:has-text('Settings')")
        page.wait_for_timeout(1000)
        print(f"URL after clicking Settings: {page.url}")

        # Check if Settings group is expanded (Property should be visible)
        is_property_visible = page.is_visible("nav >> text=Property")
        print(f"Settings sub-item 'Property' visible: {is_property_visible}")
        # Note: If it's the only sub-item, it should be visible if group is open

        # 3. Verify Account Information in Staff Management
        print("\nChecking Account Information in Staff Management...")
        page.goto('http://localhost:8080/staff?tab=about&sub=details')
        page.wait_for_selector('text=Account Information')

        # Capture screenshot
        page.screenshot(path='verification/staff_account_info.png')
        print("Captured screenshot: verification/staff_account_info.png")

        is_user_id_visible = page.is_visible("text=User ID")
        is_acc_created_visible = page.is_visible("text=Account Created")
        is_last_signin_visible = page.is_visible("text=Last Sign In")

        print(f"User ID visible: {is_user_id_visible}")
        print(f"Account Created visible: {is_acc_created_visible}")
        print(f"Last Sign In visible: {is_last_signin_visible}")

        browser.close()

if __name__ == "__main__":
    if not os.path.exists('verification'):
        os.makedirs('verification')
    run()
