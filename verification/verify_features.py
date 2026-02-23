from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # 1. Verify Admin Console - Overview
        print("Checking Admin Console...")
        page.goto("http://localhost:8080/admin-console")
        page.wait_for_selector("text=System Overview")
        page.screenshot(path="verification/admin_console_overview.png")

        # 2. Verify Admin Console - Analytics
        print("Checking Analytics tab...")
        page.click("text=Analytics")
        page.wait_for_selector("text=Revenue Growth")
        page.screenshot(path="verification/admin_console_analytics.png")

        # 3. Verify User Management - Users Tab
        print("Checking User Management - Users...")
        page.goto("http://localhost:8080/users")
        page.wait_for_selector("text=User Control Center")
        page.screenshot(path="verification/user_management_users.png")

        # 4. Verify User Management - Room Management Tab
        print("Checking Room Management tab...")
        page.click("text=Room Management")
        page.wait_for_selector("text=Add Room")
        page.screenshot(path="verification/user_management_rooms.png")

        # 5. Verify Reservations
        print("Checking Reservations...")
        page.goto("http://localhost:8080/reservations")
        page.wait_for_selector("text=All Reservations")
        page.screenshot(path="verification/reservations_list.png")

        browser.close()

if __name__ == "__main__":
    run()
