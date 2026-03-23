from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_changes(page: Page):
    # Go to auth page first since it's most likely where we land
    page.goto("http://localhost:8080/auth")
    page.wait_for_timeout(1000)

    # Take a screenshot of the auth page to verify the app is running
    page.screenshot(path="verification/auth_page.png")

    # Try to navigate to some of the changed pages
    # Note: They might be protected, but we can see if they load/redirect correctly

    page.goto("http://localhost:8080/hrm")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/hrm_page.png")

    page.goto("http://localhost:8080/inventory")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/inventory_page.png")

    page.goto("http://localhost:8080/front-desk")
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/front_desk.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()
        try:
            verify_changes(page)
        finally:
            context.close()
            browser.close()
