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
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
