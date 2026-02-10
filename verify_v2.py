import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Check Staff Management - About Staff - User Details
        await page.goto('http://localhost:8083/staff?tab=about&sub=details')
        await page.wait_for_timeout(2000)
        await page.screenshot(path='v2_user_details.png')
        print("Captured v2_user_details")

        # Check Security - Sessions and 2FA
        await page.goto('http://localhost:8083/staff?tab=about&sub=security')
        await page.wait_for_timeout(2000)
        await page.screenshot(path='v2_security.png')
        print("Captured v2_security")

        # Open 2FA Dialog
        await page.click('button:has-text("Setup 2FA")')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='v2_2fa_dialog.png')
        print("Captured v2_2fa_dialog")

        # Close dialog and check Logs
        await page.click('button:has-text("Cancel")')
        await page.goto('http://localhost:8083/staff?tab=logs')
        await page.wait_for_timeout(3000) # Give more time for logs to load
        await page.screenshot(path='v2_logs.png')
        print("Captured v2_logs")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
