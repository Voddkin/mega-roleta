from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1000)

    # 1. Add new category
    page.locator("#btn-add-category").click()
    page.wait_for_timeout(1000)
    page.locator("#input-category-name").fill("Trabalho")
    page.wait_for_timeout(1000)
    page.locator("#btn-confirm-category").click()
    page.wait_for_timeout(1000)

    # 2. Add roulette to category
    page.locator("button[title='Categorias']").first.click()
    page.wait_for_timeout(1000)
    # Check the first custom category (which should be "Trabalho")
    page.locator(".category-assign-item input[type='checkbox']").first.check()
    page.wait_for_timeout(1000)
    page.locator("#btn-close-assign-category").click()
    page.wait_for_timeout(1000)

    # 3. Switch to category tab
    page.locator("#dashboard-tabs-list").get_by_text("Trabalho").click()
    page.wait_for_timeout(1000)

    # Take screenshot of Dashboard with Category Tab active
    page.screenshot(path="/home/jules/verification/screenshots/category_tab.png")
    page.wait_for_timeout(1000)

    # 4. Open Manage Categories
    page.locator("#btn-manage-categories").click()
    page.wait_for_timeout(1000)

    # Take screenshot of Manage Categories Modal
    page.screenshot(path="/home/jules/verification/screenshots/manage_categories.png")
    page.wait_for_timeout(1000)

    page.locator("#btn-close-manage-categories").click()
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
