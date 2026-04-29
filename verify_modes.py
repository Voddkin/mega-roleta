from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1000)

    # 1. Open roulette
    page.get_by_role("button", name="Abrir Roleta").first.click()
    page.wait_for_timeout(1000)

    # Click EDIT
    page.locator("button[title='Editar Roleta']").click()
    page.wait_for_timeout(1000)

    # Just force advanced mode to show everything
    page.evaluate("document.body.classList.add('show-advanced')")
    page.wait_for_timeout(1000)

    # Toggle PRD
    page.evaluate("document.getElementById('toggle-prd').click()")
    page.wait_for_timeout(1000)

    # Enable scoreboard
    page.evaluate("document.getElementById('toggle-scoreboard').click()")
    page.wait_for_timeout(1000)

    # Save
    page.get_by_role("button", name="Salvar").click()
    page.wait_for_timeout(1000)

    # 2. Spin roulette
    page.get_by_role("button", name="GIRAR A ROLETA").click()

    # Wait for spin to finish (spin time max ~12s)
    page.wait_for_timeout(14000)

    # Close winner modal
    page.get_by_role("button", name="Fechar").click()
    page.wait_for_timeout(1000)

    # Scroll to scoreboard
    page.evaluate("document.querySelector('#btn-show-analytics').scrollIntoView()")
    page.wait_for_timeout(500)

    # 3. View Analytics
    page.get_by_text("Ver Analytics").click()
    page.wait_for_timeout(2000)

    # Take screenshot of Analytics Modal
    page.screenshot(path="/home/jules/verification/screenshots/analytics.png")
    page.wait_for_timeout(1000)

    # Close Analytics Modal
    page.locator("#btn-close-analytics").click()
    page.wait_for_timeout(1000)

    # 4. Configure Sub-Roulette
    page.locator("button[title='Editar Roleta']").click()
    page.wait_for_timeout(1000)

    # Force show advanced again if it toggled off
    page.evaluate("document.body.classList.add('show-advanced')")
    page.wait_for_timeout(500)

    # Select first option's sub-roulette
    page.evaluate("document.querySelector('.sub-roulette-select').scrollIntoView()")
    page.wait_for_timeout(500)

    page.locator(".sub-roulette-select").first.select_option(index=1)
    page.wait_for_timeout(1000)

    # Force that option to win by giving it weight 100 and others 1
    page.locator("input[data-field='weight']").first.fill("100")
    page.wait_for_timeout(1000)

    page.get_by_role("button", name="Salvar").click()
    page.wait_for_timeout(1000)

    # Spin to trigger nested
    page.evaluate("document.querySelector('.canvas-container').scrollIntoView()")
    page.wait_for_timeout(500)

    page.get_by_role("button", name="GIRAR A ROLETA").click()

    page.wait_for_timeout(15000)
    # The modal should auto close and spin the sub-roulette

    # Wait for transition and sub-roulette spin
    page.wait_for_timeout(15000)

    # Close sub-roulette winner modal
    page.get_by_role("button", name="Fechar").click()
    page.wait_for_timeout(1000)

    # Take screenshot of sub-roulette view showing 'Voltar' button
    page.screenshot(path="/home/jules/verification/screenshots/nested.png")
    page.wait_for_timeout(1000)

    # Click Voltar (force=True since btn-back intercepts pointer events?)
    # btn-back-nested is positioned relative, btn-back is absolute. btn-back might be hiding it. Let's just evaluate click.
    page.evaluate("document.getElementById('btn-back-nested').click()")
    page.wait_for_timeout(1000)


if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
