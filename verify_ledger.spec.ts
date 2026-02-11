
import { test, expect } from '@playwright/test';

test('Finance Ledger has Dashboard toggle', async ({ page }) => {
  await page.goto('http://localhost:5173/finance');
  const glTab = page.locator('button:has-text("General Ledger")');
  await glTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/finance_ledger_tab.png', fullPage: true });
});
