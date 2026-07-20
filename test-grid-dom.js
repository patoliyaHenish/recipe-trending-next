const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
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
  await page.waitForTimeout(3000);
  
  const gridHtml = await page.evaluate(() => {
    // Find the container box that has the class ag-theme-alpine or ag-theme-alpine-dark
    const container = document.querySelector('.ag-theme-alpine-dark, .ag-theme-alpine');
    if (!container) return 'CONTAINER_NOT_FOUND';
    
    return {
      containerHTML: container.innerHTML,
    };
  });
  
  console.log(JSON.stringify(gridHtml, null, 2));
  await browser.close();
})();
