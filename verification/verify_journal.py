from playwright.sync_api import sync_playwright, expect
import time

def test_journal_editor():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Navigate to Finance page
        page.goto("http://localhost:8081/finance")

        # Click on Transactions tab
        page.click('button:has-text("Transaction Layer")')
        time.sleep(1)

        # Click on Journal Management Service
        page.click('text=Journal Management Service')
        time.sleep(1)

        # Click on New Journal Entry
        page.click('button:has-text("New Journal Entry")')
        time.sleep(1)

        # Take screenshot of the blocked state
        page.screenshot(path="verification/journal_blocked.png")

        # Select Voucher Type to unblock
        page.click('button:has-text("Select Type")')
        page.click('text=Journal Voucher')
        time.sleep(1)

        # Take screenshot of the unblocked state
        page.screenshot(path="verification/journal_unblocked.png")

        # Fill in some details
        page.fill('input[placeholder="Enter overall transaction narration"]', "Test Narration")

        # Screenshot of the entries table
        page.screenshot(path="verification/journal_entries.png")

        browser.close()

if __name__ == "__main__":
    test_journal_editor()
