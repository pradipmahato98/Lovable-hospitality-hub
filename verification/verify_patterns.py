from playwright.sync_api import sync_playwright, expect
import time

def verify_patterns(page):
    page.goto("http://localhost:8080/admin-console")
    page.wait_for_selector("text=Admin Console", timeout=30000)

    page.get_by_role("tab", name="Design System").click()
    page.get_by_role("tab", name="Patterns").click()

    page.wait_for_selector("text=Reusable UI Patterns")
    page.screenshot(path="verification/patterns_library.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        try:
            verify_patterns(page)
            print("Patterns verification successful")
        finally:
            browser.close()
