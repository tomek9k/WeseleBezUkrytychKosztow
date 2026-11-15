import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('desktop: treść, grafiki, nawigacja i FAQ', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Wesele bez ukrytych kosztów/);
  await expect(page.locator('h1')).toContainText('Wasze wesele.');
  for (const a of await page.locator('a[href^="#"]').all()) {
    const href = await a.getAttribute('href');
    if (href !== '#') await expect(page.locator(href)).toHaveCount(1);
  }
  await page.evaluate(async () => { const imgs = [...document.images]; await Promise.all(imgs.map(i => { i.loading = 'eager'; return i.decode(); })); });
  expect(await page.locator('img').evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0))).toBe(true);
  await page.locator('#faq summary').first().click();
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  const bookRatio = await page.locator('.book img').evaluate(i => i.getBoundingClientRect().height / i.getBoundingClientRect().width);
  expect(bookRatio).toBeLessThan(2);
  expect(bookRatio).toBeGreaterThan(1.2);
  expect(errors).toEqual([]);
});

test('podgląd pokazuje rzeczywiste wybrane strony i obsługuje klawiaturę', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: /Materiały robocze/ }).click();
  await expect(page.locator('#sample-image')).toHaveAttribute('src', '/images/sample-worksheet.webp');
  await page.getByRole('button', { name: 'Powiększ wybraną stronę' }).click();
  await expect(page.locator('#image-dialog')).toBeVisible();
  await expect(page.locator('#large-sample')).toHaveAttribute('src', '/images/sample-worksheet.webp');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Powiększ wybraną stronę' })).toBeFocused();
  await page.locator('#tab-worksheet').focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tab-costs')).toHaveAttribute('aria-selected', 'true');
});

for (const width of [360, 390, 768, 1440]) {
  test(`responsywność ${width}px: bez przewijania poziomego`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 760) {
      await page.getByRole('button', { name: 'Otwórz menu' }).click();
      await expect(page.locator('#navigation')).toBeVisible();
      await page.locator('#navigation').getByRole('link', { name: 'FAQ', exact: true }).click();
      await expect(page.locator('#navigation')).not.toBeVisible();
      await expect(page).toHaveURL(/#faq$/);
    }
  });
}

test('ograniczenie animacji pozostawia treść widoczną', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('.problem-card').first()).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

const sale = JSON.parse(readFileSync('public/sale-config.json', 'utf8'));
for (const width of [390, 1440]) {
  test(`wszystkie przyciski zakupu kierują do Naffy w tej samej karcie (${width}px)`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    // Zatrzymujemy żądanie u operatora: test nie składa zamówienia i nie płaci.
    await page.route(sale.checkoutUrl, route => route.fulfill({ body: 'Cel przekierowania — bez transakcji.' }));
    await page.goto('/');
    await expect(page.locator('#price')).toHaveText('29,99 zł');
    await expect(page.locator('[data-buy]')).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await page.goto('/');
      const link = page.locator('[data-buy]').nth(i);
      await expect(link).toHaveAttribute('href', sale.checkoutUrl);
      expect(await link.getAttribute('target')).toBeNull();
      await link.click();
      await expect(page).toHaveURL(sale.checkoutUrl);
      expect(context.pages()).toHaveLength(1);
    }
  });
}

test('cena i zakup działają bez JavaScript; brak komunikatów demonstracyjnych', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#price')).toHaveText('29,99 zł');
  for (const link of await page.locator('[data-buy]').all()) {
    await expect(link).toHaveAttribute('href', sale.checkoutUrl);
  }
  await expect(page.locator('body')).not.toContainText(/demonstracyjn|nieaktywn|Cena do uzupełnienia|— zł|skonfigurowaniu|nie przyjmuje zamówień/i);
  await expect(page.locator('#notice-dialog')).toHaveCount(0);
  await context.close();
});

test('artefakt publikacji nie zawiera pełnego PDF ani sekretów', () => {
  function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]); }
  const all = files('dist'); expect(all.some(p => p.toLowerCase().endsWith('.pdf'))).toBe(false);
  expect(all.filter(p => /sample-.*webp$/.test(p))).toHaveLength(2);
  expect(JSON.parse(readFileSync('dist/sale-config.json','utf8'))).toEqual(sale);
  expect(readFileSync('dist/index.html', 'utf8')).not.toMatch(/__CHECKOUT_URL__|__PRICE_PLN__/);
});
