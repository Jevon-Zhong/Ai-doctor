import { chromium } from "playwright";
export const crawlWebFn = async (url: string) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForSelector('#richTextContainer', { timeout: 10000 })
        const content = await page.$eval('#richTextContainer', (el) => el.textContent.trim())
        return content
    } catch (error) {
        return error
    } finally {
        await browser.close();
    }
}