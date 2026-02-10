import { test, expect } from '@playwright/test';

test('verify security tab enhancements', async ({ page }) => {
  await page.goto('http://localhost:8080/staff?tab=about&sub=security');
  await page.waitForSelector('text=Change Password');

  // Fill in a new password to trigger strength meter
  await page.fill('#new-password', 'Weak');
  await page.screenshot({ path: 'security_weak.png' });

  await page.fill('#new-password', 'Stronger123!');
  await page.screenshot({ path: 'security_strong.png' });
});
