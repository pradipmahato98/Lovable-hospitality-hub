import os
import time
from playwright.sync_api import sync_playwright

def verify_inventory():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Assuming port 8080 as per memory, but will check 8081 if needed.
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            print("Navigating to Inventory page...")
            page.goto("http://localhost:8080/inventory")
            time.sleep(5)

            # Check for the main layout and tabs
            if page.query_selector("text=Inventory Management"):
                print("Inventory page loaded.")
            else:
                print("Inventory page title not found, checking alternatives...")

            # Take a screenshot of the Dashboard
            page.screenshot(path="inventory_dashboard.png")
            print("Dashboard screenshot saved.")

            # Click on Items tab
            page.click("button:has-text('Items')")
            time.sleep(2)
            page.screenshot(path="inventory_items.png")
            print("Items tab screenshot saved.")

            # Click on Requisitions tab
            page.click("button:has-text('Requisitions')")
            time.sleep(2)
            page.screenshot(path="inventory_requisitions.png")
            print("Requisitions tab screenshot saved.")

            # Click on Reports tab
            page.click("button:has-text('Reports')")
            time.sleep(3)
            page.screenshot(path="inventory_reports.png")
            print("Reports tab screenshot saved.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="inventory_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_inventory()
