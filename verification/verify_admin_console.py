from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        page.goto('http://localhost:8081/admin-console')
        time.sleep(10)

        # Scroll to bottom of sidebar
        page.locator('nav').evaluate('el => el.scrollTop = el.scrollHeight')
        time.sleep(1)

        page.screenshot(path='verification/sidebar_admin_open.png')

        # Check if subitems are visible
        rbac_link = page.get_by_role("link", name="RBAC")
        if rbac_link.is_visible():
            print("RBAC subitem is visible in Admin Console dropdown")
        else:
            print("RBAC subitem NOT visible")

        browser.close()

if __name__ == "__main__":
    run()
