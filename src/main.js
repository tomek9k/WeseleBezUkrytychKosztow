const $ = (s) => document.querySelector(s);
const menu = $('.menu-toggle');
const navigation = $('#navigation');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); navigation.classList.remove('open'); menu.setAttribute('aria-label', 'Otwórz menu'); }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('open', open);
  menu.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
});
navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

const chapters = ['Zanim podpiszecie pierwszą umowę','Jak powstaje prawdziwa cena wesela','Mapa dopłat: o co pytać salę','Dodatkowe koszty poza salą','Jak porównać trzy oferty bez zgadywania','Czytanie umowy: 12 miejsc, które trzeba sprawdzić','Zadatek, zaliczka, raty i rezygnacja','Zmiany, odwołanie i sytuacje awaryjne','Jak negocjować bez konfliktu','Dokumentowanie ustaleń i kontrola płatności','Prawa konsumenta: co warto wiedzieć','Plan działania na 7 dni','Materiały robocze do skopiowania','Źródła, metodologia i ważne zastrzeżenia'];
// Zachowujemy rzeczywisty tytuł rozdziału w spisie treści. Uwaga o 11 wierszach tabeli: docs/analiza-produktu.md.
chapters.forEach(title => { const li = document.createElement('li'); li.textContent = title; $('#toc-list').append(li); });

const samples = {
  costs: { src: '/images/sample-costs.webp', page: 4, alt: 'Strona 4: przykład porównania dwóch ofert i początek mapy dopłat' },
  worksheet: { src: '/images/sample-worksheet.webp', page: 12, alt: 'Strona 12: karta założeń wesela i porównywarka trzech ofert' }
};
let selected = samples.costs;
const tabs = [...document.querySelectorAll('[data-sample]')];
function selectSample(tab) {
  selected = samples[tab.dataset.sample];
  tabs.forEach(t => { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1; });
  $('#sample-image').src = selected.src; $('#sample-image').alt = selected.alt;
  $('#preview-panel').setAttribute('aria-labelledby', tab.id);
  $('#page-caption').textContent = `PRAWDZIWY FRAGMENT PUBLIKACJI · STRONA ${selected.page} / 15`;
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectSample(tab));
  tab.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const index = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (['ArrowRight','ArrowDown'].includes(e.key) ? 1 : -1) + tabs.length) % tabs.length;
    selectSample(tabs[index]); tabs[index].focus();
  });
});
const imageDialog = $('#image-dialog');
function enlarge() { $('#large-sample').src = selected.src; $('#large-sample').alt = selected.alt; imageDialog.showModal(); }
$('#enlarge').addEventListener('click', enlarge); $('#page-enlarge').addEventListener('click', enlarge);
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('.dialog-close,.dialog-dismiss').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', e => {
    const r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
  });
});
function notice(text) { $('#notice-text').textContent = text; $('#notice-dialog').showModal(); }

// JEDYNE MIEJSCE KONFIGURACJI SPRZEDAŻY: public/sale-config.json.
// Nie umieszczaj tu kluczy API ani pełnego PDF. Dostawę skonfiguruj u operatora koszyka.
let sale = null;
function safeHttps(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function validSale(c) {
  return c?.enabled === true && typeof c.pricePLN === 'number' && Number.isFinite(c.pricePLN) && c.pricePLN > 0 &&
    ['checkoutUrl','termsUrl','privacyUrl','consumerRightsUrl'].every(k => safeHttps(c[k])) &&
    ['deliveryDescription','sellerName','sellerDetails','contactEmail'].every(k => typeof c[k] === 'string' && c[k].trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contactEmail);
}
async function loadSale() {
  try {
    const response = await fetch('/sale-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Nie można odczytać konfiguracji');
    const config = await response.json();
    if (!validSale(config)) return;
    sale = config;
    $('#price').textContent = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(config.pricePLN);
    $('#price-note').textContent = 'Cena końcowa produktu';
    $('#purchase-status').textContent = 'Przejdziecie do zewnętrznego, bezpiecznego koszyka.';
    $('#delivery').textContent = config.deliveryDescription; $('#faq-delivery').textContent = config.deliveryDescription;
    $('#seller').textContent = `${config.sellerName} · ${config.sellerDetails}`;
    const contact = document.createElement('a'); contact.href = `mailto:${config.contactEmail}`; contact.textContent = config.contactEmail;
    $('#contact').replaceChildren(contact);
    $('#footer-demo').textContent = 'Produkt cyfrowy · PDF';
    $('.demo-note').textContent = 'Produkt cyfrowy · czytajcie na telefonie, tablecie lub komputerze';
    document.querySelectorAll('[data-legal]').forEach(button => {
      const a = document.createElement('a'); a.href = safeHttps(config[button.dataset.legal]); a.textContent = button.textContent; button.replaceWith(a);
    });
  } catch { /* Brak konfiguracji zawsze pozostawia bezpieczny tryb demonstracyjny. */ }
}
const saleReady = loadSale();
document.querySelectorAll('[data-buy]').forEach(button => button.addEventListener('click', async () => {
  await saleReady;
  if (sale) window.location.assign(safeHttps(sale.checkoutUrl));
  else notice('Koszyk nie został jeszcze podłączony. Ta strona nie przyjmuje płatności ani zamówień. Cena i warunki dostarczenia PDF zostaną podane przed uruchomieniem sprzedaży.');
}));
document.querySelectorAll('[data-legal]').forEach(button => button.addEventListener('click', () => {
  notice('Ten dokument nie został jeszcze udostępniony przez sprzedawcę. Wersja demonstracyjna nie przyjmuje zamówień. Dokumenty i dane sprzedawcy muszą zostać uzupełnione przed rozpoczęciem sprzedaży.');
}));
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
