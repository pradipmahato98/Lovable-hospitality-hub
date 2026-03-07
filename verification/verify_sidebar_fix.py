from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # 1. Verify auto-open on direct link
        print("Navigating directly to Staff Preferences")
        page.goto('http://localhost:8081/staff?tab=about&sub=preferences')
        time.sleep(15)

        page.screenshot(path='verification/sidebar_fix_debug_1.png')

        # Check if "Preferences" link is visible
        prefs_link = page.locator('a:has-text("Preferences")').filter(has_not=page.locator('button'))
        # Try to find link inside sidebar
        sidebar_prefs = page.locator('nav a').filter(has_text="Preferences")

        if sidebar_prefs.first.is_visible():
            print("Dropdown auto-opened successfully")
        else:
            print("Dropdown did NOT auto-open")
            # List all links for debugging
            links = page.locator('nav a').all()
            print(f"Found {len(links)} links in nav:")
            for l in links:
                print(f" - {l.inner_text()} ({l.get_attribute('href')})")

        browser.close()

if __name__ == "__main__":
    run()
