import { test, expect } from '@playwright/test';

test('Journal Entry Editor Workflow', async ({ page }) => {
  // Go to Finance page
  await page.goto('http://localhost:8080/finance');

  // Wait for the page to load and find the Transaction Layer tab
  // Use a more specific selector for the tab
  const transactionTab = page.locator('button[role="tab"]:has-text("Transaction Layer")');
  await transactionTab.click();

  // Find and click Journal Management
  const journalService = page.locator('div:has-text("Journal Management")').filter({ hasText: 'Journal Register' });
  await journalService.click();

  // Click "New Journal Entry" button
  await page.getByRole('button', { name: 'New Journal Entry', exact: true }).click();

  // Verify we are on the new entry page
  await expect(page).toHaveURL(/\/finance\/journal\/new/);
  await expect(page.getByText('New Journal Entry', { exact: true })).toBeVisible();

  // Type something to make it dirty
  await page.getByPlaceholder('Description of the transaction').fill('Verification Test Entry');

  // Try to go back
  await page.getByText('Back to Journal Register').click();

  // Check for the alert dialog
  await expect(page.getByText('Unsaved Changes')).toBeVisible();

  // Take a screenshot of the alert
  await page.screenshot({ path: '/home/jules/verification/journal_exit_confirm.png' });

  // Click "Leave Page"
  await page.getByRole('button', { name: 'Leave Page' }).click();

  // Verify we are back on the Finance page
  await expect(page).toHaveURL(/\/finance/);

  // Check if "Quick Post" button is also working (should go to /finance/journal/new?quick=true)
  const transactionTab2 = page.locator('button[role="tab"]:has-text("Transaction Layer")');
  await transactionTab2.click();
  await journalService.click();

  await page.getByRole('button', { name: 'Quick Post', exact: true }).click();
  await expect(page).toHaveURL(/\/finance\/journal\/new\?quick=true/);
  await expect(page.getByText('Quick Journal Entry', { exact: true })).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/journal_quick_post.png' });
});
