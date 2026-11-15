# Wesele bez ukrytych kosztów

Responsywna polska strona jednego e-booka. Vite + HTML/CSS/JavaScript, bez frameworka, zewnętrznych fontów, trackerów i płatnych zależności. Wszystkie obrazy są lokalne. Wersja demonstracyjna nie przyjmuje zamówień.

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

## Podłączenie sprzedaży — `public/sale-config.json`

1. Utwórz produkt cyfrowy w Naffy, Easycart lub wybranej platformie. Wgraj **pełny PDF wyłącznie do platformy sprzedażowej**, ustaw cenę, płatności oraz automatyczne dostarczenie pliku. Nie dodawaj PDF do repozytorium, `public` ani `dist`.
2. W `checkoutUrl` wklej pełny adres HTTPS opublikowanego koszyka. Nie są potrzebne klucze API po stronie landing page.
3. Ustaw `pricePLN` jako liczbę (końcowa cena w złotych zgodna z koszykiem), `deliveryDescription` zgodnie z rzeczywistą metodą i terminem dostawy. Nie używaj przykładowych obietnic automatycznej wysyłki bez weryfikacji operatora.
4. Uzupełnij `sellerName`, `sellerDetails` (wymagane dane sprzedawcy), `contactEmail` i adresy HTTPS gotowych dokumentów: `termsUrl`, `privacyUrl`, `consumerRightsUrl`. Dokumenty muszą odpowiadać rzeczywistym warunkom sprzedaży treści cyfrowych, w tym informacjom o reklamacjach i odstąpieniu. Projekt nie zawiera wymyślonych dokumentów prawnych.
5. Ustaw `enabled: true` dopiero po uzupełnieniu wszystkiego, ponownie zbuduj i opublikuj stronę. Jeśli konfiguracja jest niepełna, błędna lub nie da się jej pobrać, strona pozostaje w trybie demo.
6. Sprawdź przejście do koszyka, zgodność ceny, zakup testowy w trybie testowym operatora i dostarczenie pliku. Integracja landing page to przekierowanie; sam serwis nie realizuje transakcji i nie potwierdza płatności.

Wszystkie pola konfiguracji są publiczne — nie zapisuj tam sekretów. Po zmianie konfiguracji wymagany jest kolejny build/deploy. Nagłówki bezpieczeństwa zapisano w `netlify.toml`.

## Zawartość i grafiki

Analiza pełnego PDF i uwagi: `docs/analiza-produktu.md`. Dokumentacja grafiki: `docs/grafiki.md`.
Publiczne materiały to okładka oraz **tylko strony 4 i 12** jako WebP. Pełny plik źródłowy nie jest częścią repozytorium ani buildu. Mockup książki jest wizualizacją produktu cyfrowego, nie ofertą wydruku. Materiały robocze są częścią PDF, nie plikami Excel.

Przed sprzedażą należy wyjaśnić rozbieżność 12 punktów zapowiedzianych w rozdziale 6 wobec 11 wierszy tabeli oraz zweryfikować aktualność źródeł, zgodnie z zaleceniem zawartym w samym PDF. Kod strony nie zmienia produktu.

## Dostępność i interakcje

Menu mobilne, kotwice, zakładki podglądu (również strzałki klawiatury), powiększanie prawdziwych stron, FAQ, dialogi z Escape i przywracaniem fokusu, obsługa `prefers-reduced-motion`. Bez JavaScript treść pozostaje widoczna. Nie zamieszczono fikcyjnych opinii ani danych autora.
