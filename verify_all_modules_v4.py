import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # The project seems to run on 8080 usually, let's check common ports
        # We'll try 8080 as per the previous successful run in memory
        base_url = "http://localhost:8080"
        page = await browser.new_page()

        modules = [
            "/inventory",
            "/hrm",
            "/front-desk",
            "/pos",
            "/banquet",
            "/settings",
            "/finance",
            "/reservations",
            "/guests"
        ]

        # We need to bypass auth if possible, or just see if the page crashes before auth check
        # Usually, ProtectedRoute might redirect to /auth

        for module in modules:
            print(f"Checking {module}...")
            try:
                response = await page.goto(f"{base_url}{module}", timeout=10000)
                await page.wait_for_timeout(2000) # Wait for lazy loading

                # Check for "white screen" (empty body or just the loader)
                content = await page.content()
                if "ReferenceError" in content or "TypeError" in content:
                    print(f"  [CRASH] Found error in content for {module}")

                # Take a screenshot for visual verification
                sanitized_name = module.replace("/", "")
                screenshot_path = f"verification/screenshot_{sanitized_name}.png"
                os.makedirs("verification", exist_ok=True)
                await page.screenshot(path=screenshot_path)
                print(f"  [SUCCESS] Screenshot saved to {screenshot_path}")

            except Exception as e:
                print(f"  [ERROR] Failed to visit {module}: {str(e)}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
