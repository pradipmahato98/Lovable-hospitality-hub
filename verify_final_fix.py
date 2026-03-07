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

        # 1. Check highlighting and expansion for Settings
        print("Testing Settings navigation...")
        page.click("nav >> a:has-text('Settings')")
        page.wait_for_timeout(1000)

        # Verify Settings link is active (has bg-sidebar-accent or similar)
        # Using class check for primary text or accent background
        is_settings_active = page.eval_on_selector("nav >> a:has-text('Settings')", "el => el.parentElement.classList.contains('bg-sidebar-accent')")
        print(f"Settings module row active: {is_settings_active}")

        is_property_visible = page.is_visible("nav >> text=Property")
        print(f"Settings sub-item 'Property' visible (expanded): {is_property_visible}")

        # 2. Check highlighting and expansion for Staff Management
        print("\nTesting Staff Management navigation...")
        page.click("nav >> a:has-text('Staff Management')")
        page.wait_for_timeout(1000)

        is_details_visible = page.is_visible("nav >> text=Details")
        print(f"Staff sub-item 'Details' visible (expanded): {is_details_visible}")

        # 3. Check Account Info values
        # In a test environment, these might still be mock values, let's see what they are.
        user_id = page.locator("div:has-text('User ID') >> p").first.inner_text()
        created_at = page.locator("div:has-text('Account Created') >> p").first.inner_text()
        print(f"\nAccount Info - User ID: {user_id}")
        print(f"Account Info - Created At: {created_at}")

        page.screenshot(path='verification/final_sidebar_check.png')
        browser.close()

if __name__ == "__main__":
    run()
