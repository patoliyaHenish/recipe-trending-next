const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3000/admin/manage-users');
  await page.waitForTimeout(3000);
  const email = await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
  if (await email.isVisible()) {
    await email.fill('togethercook1@gmail.com');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.locator('button[type="submit"]').click();
    await page.waitForNavigation({ waitUntil: 'networkidle' });
  }
  
  // Navigate to users again
  await page.goto('http://localhost:3000/admin/manage-users');
  await page.waitForTimeout(3000);
  
  // Get grid DOM
  const gridHtml = await page.evaluate(() => {
    const wrapper = document.querySelector('.ag-root-wrapper');
    if (!wrapper) return 'NOT_FOUND';
    
    // Check if rows are rendered
    const rows = document.querySelectorAll('.ag-row');
    const headers = document.querySelectorAll('.ag-header-cell');
    
    return {
      outerHTML: wrapper.outerHTML,
      rowCount: rows.length,
      headerCount: headers.length,
      height: wrapper.clientHeight,
      width: wrapper.clientWidth,
      display: window.getComputedStyle(wrapper).display
    };
  });
  
  console.log(JSON.stringify(gridHtml, null, 2));
  await browser.close();
})();
