import { test, expect } from '@playwright/test';

test('Database Control Center - Detailed Verification', async ({ page }) => {
  await page.goto('http://localhost:8080/database');

  // Check title
  await expect(page.locator('h1')).toContainText('Database Control Center');

  // Verify Tabs
  const tabs = ['Table Explorer', 'SQL Editor', 'Schema', 'Auth', 'Storage', 'Realtime', 'Health'];
  for (const tabName of tabs) {
    const tab = page.getByRole('tab', { name: tabName });
    await expect(tab).toBeVisible();
  }

  // Verify Auth Tab content
  await page.getByRole('tab', { name: 'Auth' }).click();
  await expect(page.locator('text=Total Users')).toBeVisible();
  await expect(page.locator('text=admin@luxestay.com')).toBeVisible();

  // Verify Storage Tab content
  await page.getByRole('tab', { name: 'Storage' }).click();
  await expect(page.locator('text=Buckets')).toBeVisible();
  await expect(page.locator('text=avatars')).toBeVisible();

  // Verify Realtime Tab content
  await page.getByRole('tab', { name: 'Realtime' }).click();
  await expect(page.locator('text=Live Event Stream')).toBeVisible();
  await expect(page.locator('text=Connected')).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/database_detailed.png', fullPage: true });
});
