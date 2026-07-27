const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:8081');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  try {
    const loginBtn = page.getByText('기존 계정으로 로그인하기');
    if (await loginBtn.count()) {
      await loginBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch(e) { console.log('landing btn error:', e.message); }

  try {
    const fillBtn = page.getByText('입력란에 자동으로 채우기');
    if (await fillBtn.count()) {
      await fillBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.fill('input[type="email"]', 'dev@fitback.local');
      await page.fill('input[type="password"]', 'FitBack-dev-2026');
    }
  } catch(e) {
    console.log('fill error, trying direct:', e.message);
    try {
      await page.fill('input[type="email"]', 'dev@fitback.local');
      await page.fill('input[type="password"]', 'FitBack-dev-2026');
    } catch(e2) { console.log('direct fill error:', e2.message); }
  }

  try {
    const submit = page.getByText('로그인').last();
    await submit.click();
    await page.waitForTimeout(5000);
  } catch(e) { console.log('submit error:', e.message); }

  console.log('URL after login:', page.url());
  console.log('Login done - keeping browser open 2 min');
  await page.waitForTimeout(120000);
})().catch(e => { console.error('Fatal:', e.message); });
