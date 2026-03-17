from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_banquet_v2(page: Page):
    # Navigate to Banquet module
    page.goto("http://localhost:8080/banquet")
    page.wait_for_timeout(2000)

    # Check if Eye icon is in the first column of the main table
    # The first TableHead should be empty (width 12)
    # The first TableCell in the first row should contain a button with eye icon
    page.screenshot(path="verification/banquet_v2_main.png")

    # Click on the three dots (Actions) to see the dropdown and the 'X' button
    action_buttons = page.locator("button:has(svg.lucide-more-vertical)")
    if action_buttons.count() > 0:
        action_buttons.first.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/banquet_v2_dropdown.png")

        # Try to click the X button to close
        x_button = page.locator("button:has(svg.lucide-x-circle)")
        if x_button.count() > 0:
            x_button.click()
            page.wait_for_timeout(500)
            page.screenshot(path="verification/banquet_v2_closed.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()
        try:
            verify_banquet_v2(page)
        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            context.close()
            browser.close()
