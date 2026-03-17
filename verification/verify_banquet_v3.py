from playwright.sync_api import Page, expect, sync_playwright
import os

def verify_banquet_v3(page: Page):
    # Navigate to Banquet module
    page.goto("http://localhost:8080/banquet")
    page.wait_for_timeout(3000)

    # 1. Check Events Tab Eye Icon
    print("Verifying Events tab eye icon...")
    page.locator("button:has(svg.lucide-eye)").first.click()
    page.wait_for_timeout(1000)
    expect(page.locator("text=Event Schedule & Venue")).to_be_visible()
    page.screenshot(path="verification/banquet_v3_event_details.png")
    page.keyboard.press("Escape") # Should shake, but let's click 'Close' button
    page.locator("button:has-text('Close')").last.click()
    page.wait_for_timeout(500)

    # 2. Check Action Menu and X Button
    print("Verifying Action menu and X button...")
    page.locator("button:has(svg.lucide-more-vertical)").first.click()
    page.wait_for_timeout(500)
    x_button = page.locator("button:has(svg.lucide-x-circle)")
    expect(x_button).to_be_visible()
    page.screenshot(path="verification/banquet_v3_dropdown.png")
    x_button.click()
    page.wait_for_timeout(500)

    # 3. Check Catering Tab Eye Icon
    print("Verifying Catering tab eye icon...")
    page.locator("button[role='tab']:has-text('Catering')").click()
    page.wait_for_timeout(1000)
    page.locator("button:has(svg.lucide-eye)").first.click()
    page.wait_for_timeout(1000)
    expect(page.locator("text=Event Schedule & Venue")).to_be_visible()
    page.screenshot(path="verification/banquet_v3_catering_eye.png")
    page.locator("button:has-text('Close')").last.click()

    # 4. Check Venue Setup Tab Eye Icon
    print("Verifying Venue Setup tab eye icon...")
    page.locator("button[role='tab']:has-text('Venue Setup')").click()
    page.wait_for_timeout(1000)
    page.locator("button:has(svg.lucide-eye)").first.click()
    page.wait_for_timeout(1000)
    expect(page.locator("text=Event Schedule & Venue")).to_be_visible()
    page.screenshot(path="verification/banquet_v3_venue_eye.png")
    page.locator("button:has-text('Close')").last.click()

    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        try:
            verify_banquet_v3(page)
        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error_screenshot.png")
        finally:
            context.close()
            browser.close()
