from playwright.sync_api import sync_playwright, expect

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Wait for dev server to be ready
        import time
        max_retries = 10
        for i in range(max_retries):
            try:
                page.goto("http://localhost:8080", wait_until="networkidle")
                break
            except Exception as e:
                if i == max_retries - 1:
                    print(f"Failed to connect to dev server: {e}")
                    return
                time.sleep(2)

        # 1. Verify User Management Tabs
        page.goto("http://localhost:8080/user-management", wait_until="networkidle")
        # Check if we are redirected to Auth
        if "/auth" in page.url:
            print("Redirected to Auth, attempting to skip check for now or handle mock auth")

        page.screenshot(path="/home/jules/verification/user_management_users.png")

        # Try to click if visible
        try:
            page.click("text=Staff Activity", timeout=5000)
        except:
            print("Could not click Staff Activity, maybe not logged in or element not found")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/user_management_activity.png")

        # 2. Verify Database Control Center
        page.goto("http://localhost:8080/database", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/database_explorer.png")

        # Click Schema tab
        try:
            page.click("text=Schema", timeout=5000)
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/database_schema.png")
        except:
            print("Could not click Schema")

        # 3. Verify Finance Dashboard
        page.goto("http://localhost:8080/finance", wait_until="networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/finance_dashboard.png")

        browser.close()

if __name__ == "__main__":
    verify_changes()
