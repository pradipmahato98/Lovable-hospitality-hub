
import { test, expect } from '@playwright/test';

test('Finance Dashboard is visible and handles tabs', async ({ page }) => {
  await page.goto('http://localhost:5173/finance');

  // Verify Main Dashboard
  await expect(page.getByText('Net Income', { exact: false })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Revenue vs Expenses', { exact: false })).toBeVisible();

  // Click General Ledger tab - using a more flexible selector
  const glTab = page.locator('button:has-text("General Ledger")');
  await glTab.click();

  // Check if Dashboard toggle exists in Ledger
  // It might take a moment for the ledger content to load
  await expect(page.getByText('Ledger Transactions', { exact: false })).toBeVisible({ timeout: 10000 });

  const dashboardToggle = page.getByRole('button', { name: 'Dashboard' });
  await expect(dashboardToggle).toBeVisible();

  // Toggle to Dashboard view in Ledger
  await dashboardToggle.click();

  // Verify that the dashboard is now showing in the ledger view
  // (It will likely say "Select an account to view dashboard" if no account is selected)
  await expect(page.getByText('Select an account to view dashboard', { exact: false })).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/finance_ledger_dashboard.png', fullPage: true });
});
