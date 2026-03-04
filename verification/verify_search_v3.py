from playwright.sync_api import sync_playwright, expect

def verify_search_fix(page):
    # Go to the app
    page.goto("http://localhost:8080/")

    # Wait for the search input
    search_input = page.get_by_placeholder("Search modules, guests, or staff...")
    expect(search_input).to_be_visible()

    # Check width (should be lg:w-72 -> 288px)
    # We use a locator that matches our new class
    box = page.locator("div.relative.w-full.sm\\:w-64.lg\\:w-72").first
    rect = box.bounding_box()
    print(f"Search box width: {rect['width']}")

    # Type to trigger filtering logic
    search_input.fill("a")
    page.wait_for_timeout(500)

    # Check if page crashed (Dashboard should still be there)
    dashboard_text = page.get_by_text("Dashboard", exact=True).first
    expect(dashboard_text).to_be_visible()
    print("Dashboard still visible after typing 'a'")

    search_input.fill("admin")
    page.wait_for_timeout(500)
    expect(dashboard_text).to_be_visible()
    print("Dashboard still visible after typing 'admin'")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/search_fix_v3.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        try:
            verify_search_fix(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="/home/jules/verification/crash_detected.png")
        finally:
            browser.close()
