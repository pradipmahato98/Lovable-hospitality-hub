
import asyncio
from playwright.async_api import async_playwright, expect
import os

async def verify_pos():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 1600})
        page = await context.new_page()

        # Go to POS Dashboard
        print("Navigating to /pos...")
        await page.goto("http://localhost:8080/pos")

        # Wait for loading to finish if any
        await page.wait_for_timeout(2000)

        # Take screenshot of Dashboard
        await page.screenshot(path="/home/jules/verification/pos_dashboard_v3.png")

        # Check for 3D elements
        print("Checking for 3D elements...")
        expect(page.locator("svg path[fill*='url']")).to_have_count(0, timeout=5000) # Re-checking count logic

        # Check for Stats
        expect(page.get_by_text("Today's Sales")).to_be_visible()
        expect(page.get_by_text("Active Tables")).to_be_visible()

        # Navigate to History
        print("Navigating to History...")
        await page.get_by_role("button", name="History").click()
        await page.wait_for_url("**/pos/history")
        await page.wait_for_timeout(2000)

        # Check for mock transaction data in History
        print("Checking History page...")
        await page.screenshot(path="/home/jules/verification/pos_history_v3.png")

        # Look for the transaction number prefix
        # Use a locator that is more flexible
        txn_found = await page.get_by_text("TXN-").first.is_visible()
        if not txn_found:
            print("TXN- not found, retrying after wait...")
            await page.wait_for_timeout(3000)
            await page.screenshot(path="/home/jules/verification/pos_history_v3_retry.png")
            expect(page.get_by_text("TXN-").first).to_be_visible()

        # Navigate to Terminal
        print("Navigating to Terminal...")
        await page.get_by_role("button", name="Terminal").click()
        await page.wait_for_url("**/pos/terminal")
        expect(page.get_by_text("Tables")).to_be_visible()

        print("Verification successful!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_pos())
