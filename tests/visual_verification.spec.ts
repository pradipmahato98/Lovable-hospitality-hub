import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock login by setting a session or bypassing auth if possible,
  // but usually we just go to the page and see if it renders.
  // In this environment, we might need to handle the login screen.
  await page.goto('http://localhost:8080/');

  // Try to bypass login if there's a dev mode or just wait for the page
  // If we can't bypass, we just screenshot what we can.
});

test('Admin Console Analytics', async ({ page }) => {
  await page.goto('http://localhost:8080/admin');
  // Wait for metrics to load
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/admin-analytics.png', fullPage: true });
});

test('Room Management', async ({ page }) => {
  await page.goto('http://localhost:8080/user-management');
  await page.click('button:has-text("Room Management")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/room-management.png', fullPage: true });
});

test('Reservations Management', async ({ page }) => {
  await page.goto('http://localhost:8080/reservations');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/reservations.png', fullPage: true });
});

test('User Control Center', async ({ page }) => {
  await page.goto('http://localhost:8080/user-management');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/user-management.png', fullPage: true });
});
