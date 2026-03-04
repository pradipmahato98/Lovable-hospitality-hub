from playwright.sync_api import sync_playwright, expect

def verify_final_width(page):
    # Go to the app
    page.goto("http://localhost:8080/")

    # Wait for the search input
    search_input = page.get_by_placeholder("Search modules, guests, or staff...")
    expect(search_input).to_be_visible()

    # Check width (should be lg:w-80 -> 320px)
    box = page.locator("div.relative.w-full.sm\\:w-64.lg\\:w-80").first
    rect = box.bounding_box()
    print(f"Final search box width: {rect['width']}")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/final_search_width.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        try:
            verify_final_width(page)
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()
