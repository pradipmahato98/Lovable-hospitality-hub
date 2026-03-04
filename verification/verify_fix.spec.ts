import { test, expect } from '@playwright/test';

test('verify search fix and new width', async ({ page }) => {
  // Catch console errors
  const consoleErrors: string[] = [];
  page.on('pageerror', (exception) => {
    consoleErrors.push(exception.message);
  });

  await page.goto('http://localhost:8080/');

  // Wait for loading to finish
  await page.waitForLoadState('networkidle');

  // Find search box
  const searchInput = await page.getByPlaceholder('Search modules, guests, or staff...');
  await expect(searchInput).toBeVisible();

  // Check initial width (now should be sm:w-64 lg:w-80)
  const initialBox = await page.locator('div.relative.w-full.sm\\:w-64.lg\\:w-80').first();
  const boxRect = await initialBox.boundingBox();
  console.log(`Initial width: ${boxRect?.width}`);

  // Type something that previously caused a crash or might (null values)
  await searchInput.fill('admin');

  // Give it a moment to process filtering
  await page.waitForTimeout(500);

  console.log(`Console errors: ${JSON.stringify(consoleErrors)}`);

  // Check if main content is still visible (not blank)
  const dashboardHeader = await page.getByText('Dashboard', { exact: true });
  const isVisible = await dashboardHeader.isVisible();
  console.log(`Dashboard still visible: ${isVisible}`);

  // Take a screenshot of the state
  await page.screenshot({ path: 'verification/fix_verify.png' });

  expect(consoleErrors.length).toBe(0);
  expect(isVisible).toBe(true);
  // lg:w-80 is 320px
  expect(boxRect?.width).toBeCloseTo(320, 1);
});
