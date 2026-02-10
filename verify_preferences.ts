import { test, expect } from '@playwright/test';

test('verify preferences tab', async ({ page }) => {
  await page.goto('http://localhost:8083/staff?tab=about&sub=preferences');
  await page.waitForTimeout(2000);

  // Check for theme toggle
  const themeToggle = page.locator('button:has-text("Switch to")');
  await expect(themeToggle).toBeVisible();

  // Check for notification toggles
  await expect(page.locator('text=Email Notifications')).toBeVisible();
  await expect(page.locator('text=Push Notifications')).toBeVisible();

  await page.screenshot({ path: 'staff_preferences.png' });
});
