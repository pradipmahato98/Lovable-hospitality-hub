from playwright.sync_api import sync_playwright

def verify_tabs(page):
    page.goto("http://localhost:8080/staff")
    page.wait_for_selector("text=About Staff")
    page.screenshot(path="staff_new_tabs.png")
    print("Screenshot saved: staff_new_tabs.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        try:
            verify_tabs(page)
        finally:
            browser.close()
