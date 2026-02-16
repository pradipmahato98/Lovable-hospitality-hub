from playwright.sync_api import sync_playwright, expect
import time

def verify_design_system(page):
    # Navigate to Admin Console
    page.goto("http://localhost:8080/admin-console")

    # Wait for the page to load
    page.wait_for_selector("text=Admin Console", timeout=30000)

    # Click on the Design System tab
    design_system_tab = page.get_by_role("tab", name="Design System")
    design_system_tab.click()

    # Check if the engine header is visible
    expect(page.get_by_text("iOS Design System Engine")).to_be_visible()

    # Take screenshot of the main design system page
    page.screenshot(path="verification/admin_design_system.png")

    # Click on the Preview sub-tab
    preview_tab = page.get_by_role("tab", name="Preview")
    preview_tab.click()

    # Wait for preview area
    page.wait_for_selector("text=Revenue Analytics")

    # Take a screenshot of the preview area
    page.screenshot(path="verification/design_system_preview.png")

    # Check Materials tab
    page.get_by_role("tab", name="iOS Materials").click()
    page.screenshot(path="verification/materials_controls.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))
        try:
            verify_design_system(page)
            print("Verification script completed successfully")
        except Exception as e:
            print(f"Error during verification: {e}")
            # Take error screenshot
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
