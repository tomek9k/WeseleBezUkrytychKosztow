import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

test('desktop: treść, grafiki, nawigacja, FAQ i demo bez płatności', async ({ page }) => {
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
  await page.getByRole('button', { name: /^Kup teraz/ }).click();
  await expect(page.locator('#notice-dialog')).toBeVisible();
  await expect(page.locator('#notice-text')).toContainText('nie przyjmuje płatności');
  await page.keyboard.press('Escape');
  await expect(page.locator('#notice-dialog')).not.toBeVisible();
  await page.locator('#faq summary').first().click();
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  await page.locator('[data-legal="termsUrl"]').click();
  await expect(page.locator('#notice-text')).toContainText('nie został jeszcze udostępniony');
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

test('niepełna lub niebezpieczna konfiguracja nie aktywuje sprzedaży', async ({ page }) => {
  await page.route('**/sale-config.json', route => route.fulfill({ json: { enabled: true, pricePLN: 99, checkoutUrl: 'javascript:alert(1)' } }));
  await page.goto('/'); await page.locator('[data-buy]').click();
  await expect(page.locator('#notice-dialog')).toBeVisible();
  await expect(page.locator('#price')).toHaveText('— zł');
});

test('pełna konfiguracja kieruje do koszyka HTTPS bez symulowania płatności', async ({ page }) => {
  const config = { enabled: true, pricePLN: 89, checkoutUrl: 'https://checkout.example.test/product', deliveryDescription: 'TEST: dostawa przez operatora.', sellerName: 'Dane testowe', sellerDetails: 'Wyłącznie test automatyczny', contactEmail: 'test@example.test', termsUrl: 'https://example.test/terms', privacyUrl: 'https://example.test/privacy', consumerRightsUrl: 'https://example.test/rights' };
  await page.route('**/sale-config.json', route => route.fulfill({ json: config }));
  await page.route('https://checkout.example.test/**', route => route.fulfill({ body: 'Koszyk testowy — bez transakcji.' }));
  await page.goto('/'); await expect(page.locator('#price')).toContainText('89');
  await expect(page.locator('#delivery')).toHaveText(config.deliveryDescription);
  await expect(page.getByRole('link', { name: 'Regulamin', exact: true })).toHaveAttribute('href', config.termsUrl);
  await page.locator('[data-buy]').click(); await expect(page).toHaveURL(config.checkoutUrl);
});

test('artefakt publikacji nie zawiera pełnego PDF ani sekretów', () => {
  function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir,e.name)) : [join(dir,e.name)]); }
  const all = files('dist'); expect(all.some(p => p.toLowerCase().endsWith('.pdf'))).toBe(false);
  expect(all.filter(p => /sample-.*webp$/.test(p))).toHaveLength(2);
  expect(JSON.parse(readFileSync('dist/sale-config.json','utf8')).enabled).toBe(false);
});
