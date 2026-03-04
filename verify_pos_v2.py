import asyncio
from playwright.async_api import async_playwright
import os

async def verify_pos():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 1200})
        page = await context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        print("Navigating to POS Dashboard...")
        try:
            # Increase timeout and wait for network idle
            response = await page.goto("http://localhost:8080/pos", timeout=60000, wait_until="networkidle")
            print(f"Response status: {response.status if response else 'No response'}")

            await page.wait_for_timeout(5000) # Wait a bit for React to mount
            await page.screenshot(path="pos_dashboard_v2_debug_2.png")

            title = await page.title()
            print(f"Page title: {title}")

            # Check if there is any content
            content = await page.content()
            print(f"Content length: {len(content)}")
            if len(content) < 500:
                print("Content seems too short, maybe not loaded.")

        except Exception as e:
            print(f"Verification failed: {e}")
            await page.screenshot(path="pos_error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_pos())
