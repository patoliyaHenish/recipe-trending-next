const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleLogs.push(`[PAGE_ERROR] ${err.message}`);
  });

  await page.goto('http://localhost:3000/admin/manage-users');
  await page.waitForTimeout(3000);
  const email = await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
  if (await email.isVisible()) {
    await email.fill('togethercook1@gmail.com');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  }
  
  await page.goto('http://localhost:3000/admin/manage-users');
  await page.waitForTimeout(4000);
  
  console.log("=== BROWSER LOGS ===");
  console.log(consoleLogs.join('\n'));
  console.log("====================");
  
  await browser.close();
})();
