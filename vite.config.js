import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Cena i adres zakupu mają jedno źródło: public/sale-config.json.
// Wstawiamy je do HTML na serwerze deweloperskim i podczas buildu,
// dzięki czemu linki działają również bez JavaScript i bez pobierania konfiguracji.
export default defineConfig({
  plugins: [{
    name: 'sale-config-html',
    transformIndexHtml(html) {
      const config = JSON.parse(readFileSync(new URL('./public/sale-config.json', import.meta.url), 'utf8'));
      const url = new URL(config.checkoutUrl);
      if (url.protocol !== 'https:' || url.username || url.password || /[<>"'\s]/.test(config.checkoutUrl)) {
        throw new Error('Adres koszyka musi być poprawnym adresem HTTPS.');
      }
      if (typeof config.pricePLN !== 'number' || !Number.isFinite(config.pricePLN) || config.pricePLN <= 0) {
        throw new Error('Cena musi być dodatnią liczbą.');
      }
      const price = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(config.pricePLN);
      return html.replaceAll('__CHECKOUT_URL__', config.checkoutUrl.replaceAll('&', '&amp;'))
        .replaceAll('__PRICE_PLN__', price);
    }
  }]
});
