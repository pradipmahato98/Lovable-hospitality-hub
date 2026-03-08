import { test, expect } from '@playwright/test';

test('verify finance permission matrix and role simulation', async ({ page }) => {
  await page.goto('http://localhost:5173/finance');
  await page.waitForSelector('text=Finance & Accounting');

  // Dashboard screenshot (FA role)
  await page.screenshot({ path: 'verification/finance_dashboard_fa.png', fullPage: true });

  // Go to Setup
  await page.click('button:has-text("Setup")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/finance_setup_fa.png', fullPage: true });

  // Open Permission Matrix
  await page.click('text=Role-based permissions');
  await page.waitForSelector('text=Finance & Accounting Role Matrix');
  await page.screenshot({ path: 'verification/finance_matrix.png', fullPage: true });

  // Switch to AP Executive
  await page.click('button:has-text("AP")');
  await page.waitForTimeout(500);

  // Go back to Setup
  await page.click('button:has-text("Back to Setup")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/finance_setup_ap.png', fullPage: true });

  // Go to Transactions
  await page.click('button:has-text("Transactions")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verification/finance_transactions_ap.png', fullPage: true });
});
