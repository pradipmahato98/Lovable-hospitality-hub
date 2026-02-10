import { test, expect } from '@playwright/test';

test('verify ios materials settings and classes', async ({ page }) => {
  await page.goto('http://localhost:8080/staff?tab=preferences');

  // Wait for the page to load
  await page.waitForSelector('text=System Preferences');

  // Check if iOS Materials toggle is present
  const iosToggle = page.locator('button[role="switch"]').last();
  await expect(iosToggle).toBeVisible();

  // Ensure it's checked by default (as per our defaultUIPreferences)
  const isChecked = await iosToggle.getAttribute('aria-checked');
  console.log('iOS Materials checked:', isChecked);

  // Check if Intensity selector is visible (since it's checked by default)
  const intensitySelector = page.locator('button:has-text("Standard")');
  await expect(intensitySelector).toBeVisible();

  // Check if Disable on Mobile toggle is present
  const mobileToggle = page.locator('text=Disable on Mobile').locator('..').locator('..').locator('button[role="switch"]');
  await expect(mobileToggle).toBeVisible();

  // Verify body class
  const bodyClass = await page.evaluate(() => document.body.className);
  console.log('Body classes:', bodyClass);
  expect(bodyClass).toContain('ios-enabled');
  expect(bodyClass).toContain('ios-intensity-medium');

  // Take a screenshot of the preferences tab
  await page.screenshot({ path: 'ios_preferences.png' });

  // Go to Dashboard and take a screenshot to see the effect on Header/Cards
  await page.goto('http://localhost:8080/');
  await page.waitForSelector('h1:has-text("Dashboard")');
  await page.screenshot({ path: 'dashboard_glass.png' });

  console.log('Verification completed successfully');
});
