import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Load the app
        page.goto('http://localhost:8080/staff?tab=about&sub=details')
        page.wait_for_selector('text=Account Information')

        # Wait a bit for auth data to hydrate
        page.wait_for_timeout(2000)

        # Find the Account Information card content area
        # It's a div containing the labels and values
        card = page.locator("div:has-text('Account Information')").last

        # More specific selectors within the card
        user_id = card.locator("div:has-text('User ID') >> p").first.inner_text()
        created_at = card.locator("div:has-text('Account Created') >> p").first.inner_text()
        last_signin = card.locator("div:has-text('Last Sign In') >> p").first.inner_text()

        print(f"User ID: {user_id}")
        print(f"Account Created: {created_at}")
        print(f"Last Sign In: {last_signin}")

        page.screenshot(path='verification/staff_account_info_final.png')

        browser.close()

if __name__ == "__main__":
    run()
