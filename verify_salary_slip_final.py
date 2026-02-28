import asyncio
import os
from playwright.async_api import async_playwright

async def verify_salary_slip_final():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create a directory for screenshots if it doesn't exist
        os.makedirs('/home/jules/verification', exist_ok=True)

        # Use a larger viewport to capture the full dialog
        context = await browser.new_context(viewport={'width': 1280, 'height': 1200})
        page = await context.new_page()

        # In a real app we'd need to login, but since we disabled the admin check for DEV
        # we can try to navigate directly to /hr
        # However, to be safe and see the PersonalDetailsTab too, let's try to mock the auth if needed.
        # For this verification, we'll just check if the components are reachable.

        await page.goto('http://localhost:8081/hr')
        await page.wait_for_timeout(2000)

        # Take a screenshot of the HR page with the new tab label
        await page.screenshot(path='/home/jules/verification/hr_page_tabs.png')
        print("HR page screenshot saved.")

        # Click on Payroll & Slips tab
        await page.click('text="Payroll & Slips"')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='/home/jules/verification/payroll_panel_with_slips.png')
        print("Payroll panel screenshot saved.")

        # Check if "View Slip" button exists and click it
        view_slip_button = page.locator('text="View Slip"').first
        if await view_slip_button.is_visible():
            await view_slip_button.click()
            await page.wait_for_timeout(2000)
            await page.screenshot(path='/home/jules/verification/salary_slip_modal_final.png')
            print("Salary slip modal screenshot saved.")
        else:
            print("View Slip button not found in payroll table.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_salary_slip_final())
