from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Go to the app
        print("Navigating to http://localhost:8081")
        page.goto('http://localhost:8081')
        time.sleep(10)  # Increase wait time

        # Take initial screenshot of dashboard
        page.screenshot(path='verification/initial_load.png')
        print(f"Page title: {page.title()}")

        # Check if we are on a login page
        if "Auth" in page.title() or page.get_by_role("button", name="Sign In").is_visible():
             print("Login page detected, attempting bypass or just taking screenshot")
             # In many of these setups, developer mode in ProtectedRoute bypasses auth
             # but if there is a literal login button we might need to click it
             if page.get_by_role("button", name="Sign In").is_visible():
                 page.get_by_role("button", name="Sign In").click()
                 time.sleep(5)
                 page.screenshot(path='verification/after_login_click.png')

        # Try navigating to Staff Management directly
        print("Navigating to staff management")
        page.goto('http://localhost:8081/staff?tab=about&sub=preferences')
        time.sleep(5)
        page.screenshot(path='verification/staff_preferences_page.png')

        # Look for sidebar items
        # Let's list all buttons and links to see what we have
        buttons = page.get_by_role("button").all()
        print(f"Found {len(buttons)} buttons")
        for i, b in enumerate(buttons[:10]):
            try:
                print(f"Button {i}: {b.inner_text()}")
            except:
                pass

        links = page.get_by_role("link").all()
        print(f"Found {len(links)} links")
        for i, l in enumerate(links[:10]):
            try:
                print(f"Link {i}: {l.inner_text()}")
            except:
                pass

        # Check for the toggle
        toggle = page.get_by_text("Sidebar Dropdowns")
        if toggle.is_visible():
            print("Toggle 'Sidebar Dropdowns' found")
        else:
            print("Toggle 'Sidebar Dropdowns' NOT found")

        browser.close()

if __name__ == "__main__":
    run()
