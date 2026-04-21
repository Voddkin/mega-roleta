from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1000)

    # Click the custom dropdown
    page.locator("#theme-dropdown-btn").click()
    page.wait_for_timeout(500)

    # Select the new 'vibe-sunset' theme
    page.locator('.theme-dropdown-item[data-theme-val="vibe-sunset"]').click()
    page.wait_for_timeout(1000)

    # Take screenshot of the vibe-sunset theme on dashboard to check titles
    page.screenshot(path="/home/jules/verification/screenshots/dashboard_sunset_fix.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        except Exception as e:
            print("Error:", e)
        finally:
            context.close()
            browser.close()
