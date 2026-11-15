# Wesele bez ukrytych kosztów

Responsywna polska strona jednego e-booka. Vite + HTML/CSS/JavaScript, bez frameworka, zewnętrznych fontów, trackerów i płatnych zależności. Wszystkie obrazy są lokalne. Zakup obsługuje zewnętrzny koszyk Naffy.

## Uruchomienie i publikacja

Wymagany Node.js 22.12+ lub 24 LTS. W katalogu repozytorium:

```sh
npm ci
npm run dev -- --port 5173
npm run build
npm run preview -- --port 4173
npm test
```

`npm test` uruchamia testy Chromium. W tym środowisku korzysta z `/usr/bin/chromium`; można wskazać inną przeglądarkę przez `CHROMIUM_PATH`. Jeśli system nie ma Chromium, zainstaluj przeglądarkę Playwright: `npx playwright install chromium`. Netlify odczyta `netlify.toml`: komenda `npm run build`, publikowany wyłącznie katalog `dist`. Na innym hostingu statycznym również publikuj tylko `dist`, nigdy całe `/workspace`.

## Cena i zakup — `public/sale-config.json`

To jedyne źródło ceny (`pricePLN`) i adresu zakupu (`checkoutUrl`). Aktualna cena wynosi 29,99 zł. Wszystkie cztery przyciski zakupowe są zwykłymi linkami do Naffy, otwieranymi w tej samej karcie — również bez JavaScript. Vite wstawia cenę i adres do HTML podczas budowania. Nie ma lokalnego koszyka, symulacji zamówienia ani obsługi płatności.

Po zmianie konfiguracji uruchom `npm run build`. Push do gałęzi `main` uruchomi wdrożenie, jeśli repozytorium jest połączone z Netlify. Niepoprawny adres HTTPS lub cena zatrzymują build.

Cenę w samym koszyku, dostarczenie PDF oraz dane sprzedawcy i dokumenty sprzedaży konfiguruje się w Naffy. Landing page odsyła do informacji dostępnych u operatora; nie tworzy dokumentów prawnych i nie potwierdza realizacji transakcji. Nie przechowuj w publicznej konfiguracji sekretów ani pełnego PDF.

## Zawartość i grafiki

Analiza pełnego PDF i uwagi: `docs/analiza-produktu.md`. Dokumentacja grafiki: `docs/grafiki.md`.
Publiczne materiały to okładka oraz **tylko strony 4 i 12** jako WebP. Pełny plik źródłowy nie jest częścią repozytorium ani buildu. Mockup książki jest wizualizacją produktu cyfrowego, nie ofertą wydruku. Materiały robocze są częścią PDF, nie plikami Excel.

Przed sprzedażą należy wyjaśnić rozbieżność 12 punktów zapowiedzianych w rozdziale 6 wobec 11 wierszy tabeli oraz zweryfikować aktualność źródeł, zgodnie z zaleceniem zawartym w samym PDF. Kod strony nie zmienia produktu.

## Dostępność i interakcje

Menu mobilne, kotwice, zakładki podglądu (również strzałki klawiatury), powiększanie prawdziwych stron, FAQ, dialogi z Escape i przywracaniem fokusu, obsługa `prefers-reduced-motion`. Bez JavaScript treść pozostaje widoczna. Nie zamieszczono fikcyjnych opinii ani danych autora.
