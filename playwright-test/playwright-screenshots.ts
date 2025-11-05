import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('CRM Screenshots', () => {
  const BASE_URL = 'http://localhost:5173';
  const SCREENSHOT_DIR = 'docs/screenshots';

  test.beforeAll(async () => {
    // Create screenshot directory if it doesn't exist
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
  });

  test('Capture CRM screenshots', async ({ page }) => {
    await page.goto(BASE_URL);

    // Login
    await page.fill('input[name="username"]', 'ADMIN');
    await page.fill('input[name="password"]', '1234');
    await page.click('button:has-text("Login")');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Dashboard Screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard.png'), fullPage: true });
    console.log('Captured dashboard.png');

    // Navigate to Pipeline View
    await page.click('a:has-text("Pipeline")');
    await page.waitForURL(`${BASE_URL}/pipeline`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'pipeline-view.png'), fullPage: true });
    console.log('Captured pipeline-view.png');

    // Navigate to Settings View
    await page.click('a:has-text("Settings")');
    await page.waitForURL(`${BASE_URL}/settings`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings-view.png'), fullPage: true });
    console.log('Captured settings-view.png');

    // Navigate to Settings View (SMTP section visible)
    // Scroll to the SMTP section if necessary, or ensure it's visible
    const smtpSection = page.locator('h2:has-text("Email (SMTP) Configuration")');
    await smtpSection.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'settings-smtp.png'), fullPage: true });
    console.log('Captured settings-smtp.png');
  });
});
