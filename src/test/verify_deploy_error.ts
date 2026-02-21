import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  try {
    console.log('Visiting http://localhost:8081');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(5000); // Wait for any pop-ups

    const screenshotPath = 'verification/dev_screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to ${screenshotPath}`);

    // Check for any visible dialogs or cards that might be error pop-ups
    const dialogs = await page.locator('div[role="dialog"], .card, .alert').count();
    console.log(`Found ${dialogs} potential pop-ups/cards`);

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await browser.close();
  }
})();
