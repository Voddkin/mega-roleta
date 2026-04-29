import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--no-sandbox'])
        page = await browser.new_page()

        # Load the HTML
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(1000)

        print("Testing Speed Lines spin")
        await page.evaluate('''() => {
            const spinBtn = document.getElementById('btn-spin');
            if(spinBtn) spinBtn.click();
        }''')

        # Wait a little for the spin to start (anticipation and then actual fast spin)
        await page.wait_for_timeout(600)
        await page.screenshot(path="verification/screenshots/speed_lines_mid_spin.png")

        await browser.close()

asyncio.run(main())
