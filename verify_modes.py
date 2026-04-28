from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:3000/index.html")
    page.wait_for_timeout(1000)

    # Click first roulette card to open editor
    page.get_by_role("button", name="Abrir Roleta").first.click()
    page.wait_for_timeout(1000)

    # Click on the pencil edit button
    page.get_by_title("Editar Roleta").click()
    page.wait_for_timeout(500)

    # Enable advanced mode
    page.locator("#toggle-advanced").evaluate("node => node.click()")
    page.wait_for_timeout(500)

    # Check new modes checkboxes
    page.locator("#toggle-mystery").evaluate("node => node.click()")
    page.wait_for_timeout(500)

    page.locator("#toggle-fatigue").evaluate("node => node.click()")
    page.wait_for_timeout(500)

    # Take screenshot of the new UI controls
    page.screenshot(path="/home/jules/verification/screenshots/new_modes.png")
    page.wait_for_timeout(500)

    # Start a spin (Need to save first to exit edit mode)
    page.get_by_role("button", name="Salvar").first.click()
    page.wait_for_timeout(1000)

    page.get_by_role("button", name="GIRAR A ROLETA").click()
    page.wait_for_timeout(2000)

    # Screenshot during spin to capture speed lines
    page.screenshot(path="/home/jules/verification/screenshots/spinning.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
