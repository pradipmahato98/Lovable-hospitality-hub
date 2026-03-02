import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        # Navigate to the app
        await page.goto('http://localhost:8083')

        # Wait for search input
        search_input = page.get_by_placeholder("Search modules, guests, or staff...")
        await search_input.wait_for()

        # 1. Verify fixed width on focus
        initial_box = await page.query_selector('.group\/search')
        initial_width = (await initial_box.bounding_box())['width']
        print(f"Initial width: {initial_width}")

        await search_input.focus()
        await page.wait_for_timeout(500)
        focused_box = await page.query_selector('.group\/search')
        focused_width = (await focused_box.bounding_box())['width']
        print(f"Focused width: {focused_width}")

        await page.screenshot(path='verification/search_fixed_width.png')

        # 2. Type and verify clear button
        await search_input.fill("Reservations")
        await page.wait_for_timeout(500)
        await page.screenshot(path='verification/search_with_text_to_clear.png')

        # Check if X is visible
        clear_btn = page.locator('button:has(svg.lucide-x)')
        await clear_btn.wait_for()

        # Click clear button using mouse to simulate real click
        await clear_btn.click()
        await page.wait_for_timeout(300)

        final_query = await search_input.input_value()
        print(f"Query after clear: '{final_query}'")

        # Check if focus is maintained
        is_focused = await page.evaluate("document.activeElement.placeholder === 'Search modules, guests, or staff...'")
        print(f"Is input still focused? {is_focused}")

        await page.screenshot(path='verification/search_after_clear_click.png')

        await browser.close()

asyncio.run(run())
