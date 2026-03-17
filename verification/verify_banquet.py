from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_banquet_module(page: Page):
    # Navigate to Banquet module
    page.goto("http://localhost:8080/banquet")
    page.wait_for_timeout(2000)

    # Take screenshot of the main events table with filtering and sorting
    page.screenshot(path="verification/banquet_main.png")

    # Click Eye icon on the first row if exists
    eye_buttons = page.locator("button:has(svg.lucide-eye)")
    if eye_buttons.count() > 0:
        eye_buttons.first.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/banquet_details.png")
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

    # Go to Catering tab
    page.get_by_role("tab", name="Catering").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/banquet_catering.png")

    # Go to Venue Setup tab
    page.get_by_role("tab", name="Venue Setup").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="verification/banquet_venue.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()
        try:
            verify_banquet_module(page)
        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            context.close()
            browser.close()
