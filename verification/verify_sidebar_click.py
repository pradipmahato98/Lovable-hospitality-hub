from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        page.goto('http://localhost:8081/staff?tab=about&sub=preferences')
        time.sleep(10)

        # Click Dashboard to open it
        dashboard = page.get_by_role("button", name="Dashboard")
        if dashboard.is_visible():
            dashboard.click()
            time.sleep(2)
            page.screenshot(path='verification/sidebar_dashboard_open.png')

            # Check for Overview subitem
            overview = page.get_by_role("link", name="Overview")
            if overview.is_visible():
                print("Overview subitem is visible")
            else:
                print("Overview subitem NOT visible")
        else:
            print("Dashboard button NOT visible")

        browser.close()

if __name__ == "__main__":
    run()
