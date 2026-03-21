import { test, expect } from '@playwright/test';

test('verify final reservation detail panel', async ({ page }) => {
  await page.goto('http://localhost:8080/reservations');

  // Wait for calendar to load
  await page.waitForSelector('.rbc-event', { timeout: 10000 });

  // Click on the first reservation event
  await page.click('.rbc-event');

  // Wait for the detail panel to appear
  await page.waitForSelector('text=Reservation No');

  // Take screenshot
  await page.screenshot({ path: 'final_reservation_panel.png' });

  // Check for specific elements
  await expect(page.locator('text=Who booking for')).toBeVisible();
  await expect(page.locator('text=Advance Payment')).toBeVisible();
  await expect(page.locator('text=Booking Source')).toBeVisible();

  // Check for icons in header (edit and print)
  // We can't easily check for lucide icons by text, but we can check the button existence
  const headerButtons = await page.locator('button').count();
  console.log('Number of buttons in panel:', headerButtons);
});
