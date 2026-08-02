import { TAB_META, ensureStateShape, loadProfile, store } from './state.js';
import { renderAdicionar, wireAdicionar } from './ui-adicionar.js';
import { renderCardapio, wireCardapio } from './ui-cardapio.js';
import { renderHistorico, wireHistorico } from './ui-historico.js';
import { renderInicio, wireInicio } from './ui-inicio.js';
import { renderPesos, wirePesos } from './ui-perfil.js';
import { addDays, clamp, fmtDateShort, icons, todayStr } from './utils.js';

/* Núcleo do app: dispatcher de renderização, navegação por dia, seletor de perfil. */
export function triggerFillAnimations(){
  // thin bars (macro bars, weight progress capsule): animate width from 0 to target
  document.querySelectorAll('[data-fill]').forEach(el=>{
    el.style.transition = 'none';
    el.style.width = '0%';
    void el.getBoundingClientRect();
    el.style.transition = '';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.width = el.dataset.fill; }));
  });
  // calorie ring: animate stroke fill from empty to target
  document.querySelectorAll('[data-ring-offset]').forEach(el=>{
    const fullCirc = el.getAttribute('stroke-dasharray');
    el.style.transition = 'none';
    el.style.strokeDashoffset = fullCirc;
    void el.getBoundingClientRect();
    el.style.transition = '';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ el.style.strokeDashoffset = el.dataset.ringOffset; }));
  });
  // big numbers (calorias, macros): count up from 0 to the target value on every load
  document.querySelectorAll('[data-count-to]').forEach(el=>{
    const target = parseFloat(el.dataset.countTo);
    if(!isFinite(target)) return;
    const duration = 900;
    const start = performance.now();
    function tick(now){
      const p = clamp((now-start)/duration, 0, 1);
      const eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(target*eased).toLocaleString('pt-BR');
      if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ---------- render dispatcher ---------- */
export function render(){
  ensureStateShape(store.state);
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===store.currentTab));
  if(window.__profileSliderSet) window.__profileSliderSet(store.currentProfile, false);
  updateHeaderDayNav();

  const content = document.getElementById('content');
  if(store.currentTab==='inicio'){ content.innerHTML = renderInicio(); wireInicio(); triggerFillAnimations(); }
  else if(store.currentTab==='adicionar'){ content.innerHTML = renderAdicionar(); wireAdicionar(); }
  else if(store.currentTab==='cardapio'){ content.innerHTML = renderCardapio(); wireCardapio(); }
  else if(store.currentTab==='historico'){ content.innerHTML = renderHistorico(); wireHistorico(); }
  else if(store.currentTab==='pesos'){ content.innerHTML = renderPesos(); wirePesos(); triggerFillAnimations(); }
  icons();
}
export function heroHTML(tab){
  const m = TAB_META[tab];
  return `<section class="page-hero">
    <div class="hero-title-row">
      <div class="hero-icon-inline"><i data-lucide="${m.icon}"></i></div>
      <h1>${m.title}</h1>
    </div>
    <p>${m.subtitle}</p>
  </section>`;
}

/* ============================================================
   DAY NAVIGATION (own row above the tab icons; header + mini calendar picker)
   Visible on every tab. Selecting a day here shifts the whole app's view
   (Início, Adicionar, Histórico) to that date. This is in-memory only —
   refreshing the page always resets it back to today.
   ============================================================ */
export function homeDateLabel(dateStr){
  const today = todayStr();
  if(dateStr===today) return 'Hoje';
  if(dateStr===addDays(today,-1)) return 'Ontem';
  return fmtDateShort(dateStr);
}
export function weekdayAbbr(dateStr){
  return new Intl.DateTimeFormat('pt-BR', {weekday:'short', timeZone:'UTC'}).format(new Date(dateStr+'T12:00:00Z')).replace('.','').toUpperCase();
}
export function computeStripDates(){
  const today = todayStr();
  let dates = [-2,-1,0,1,2].map(off=>addDays(store.homeViewDate, off));
  // never show dates beyond today — shift the whole window back if needed
  while(dates[dates.length-1] > today){
    dates = dates.map(d=>addDays(d,-1));
  }
  return dates;
}
export function updateHeaderDayNav(){
  const row = document.getElementById('dayNavRow');
  if(!row) return;
  const today = todayStr();
  const isAtToday = store.homeViewDate === today;
  const dates = computeStripDates();

  const cellsHTML = dates.map(d=>{
    const selected = d===store.homeViewDate;
    const isToday = d===today;
    const future = d > today;
    const num = parseInt(d.slice(8,10),10);
    const cls = ['ds-cell', selected?'selected':'', isToday?'is-today':'', future?'disabled':''].filter(Boolean).join(' ');
    return `<button class="${cls}" data-date="${d}">
      <span class="ds-weekday">${weekdayAbbr(d)}</span>
      <span class="ds-num">${num}</span>
    </button>`;
  }).join('');

  row.innerHTML = `
    <div class="date-strip">
      <button class="ds-arrow" id="homePrevDay"><i data-lucide="chevron-left"></i></button>
      <div class="ds-track" id="dsTrack">${cellsHTML}</div>
      <button class="ds-arrow" id="homeNextDay" ${isAtToday?'disabled':''}><i data-lucide="chevron-right"></i></button>
    </div>
  `;
  icons();
  document.getElementById('homePrevDay').addEventListener('click', ()=>{
    store.homeViewDate = addDays(store.homeViewDate,-1);
    render();
  });
  document.getElementById('homeNextDay').addEventListener('click', ()=>{
    if(store.homeViewDate < todayStr()){
      store.homeViewDate = addDays(store.homeViewDate,1);
      render();
    }
  });
}
/* tap-to-select on the day strip. Wired once (delegated on document) since
   #dayNavRow's inner HTML gets rebuilt on every render(). Tapping the day
   that's already selected opens the full calendar so you can jump anywhere. */
export function setupDateStripDrag(){
  if(window.__dateStripWired) return;
  window.__dateStripWired = true;
  document.addEventListener('click', (e)=>{
    const cell = e.target.closest('.ds-cell');
    if(!cell) return;
    if(cell.classList.contains('disabled')) return;
    if(cell.classList.contains('selected')){
      openHomeCalendarModal();
      return;
    }
    store.homeViewDate = cell.dataset.date;
    render();
  });
}
export function openHomeCalendarModal(){
  const d = new Date(store.homeViewDate+'T12:00:00Z');
  store.homeCalendarViewDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), 1);
  renderHomeCalendarModal();
  document.getElementById('modalOverlay').classList.remove('hidden');
}
export function renderHomeCalendarModal(){
  const box = document.getElementById('modalBox');
  const year = store.homeCalendarViewDate.getFullYear();
  const month = store.homeCalendarViewDate.getMonth();
  const monthLabel = new Intl.DateTimeFormat('pt-BR', {month:'long', year:'numeric'}).format(store.homeCalendarViewDate);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = todayStr();

  let cells = '';
  for(let i=0;i<firstDay;i++) cells += '<div class="cal-day empty"></div>';
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    if(dateStr > today){
      cells += `<div class="cal-day empty" style="opacity:.3;">${d}</div>`;
      continue;
    }
    const isToday = dateStr===today;
    const isSelected = dateStr===store.homeViewDate;
    cells += `<div class="cal-day ${isToday?'today':''} ${isSelected?'mark-dieta_treino':''}" data-pick-date="${dateStr}">${d}</div>`;
  }

  box.innerHTML = `
    <h3>Selecionar dia</h3>
    <div class="cal-header">
      <button class="cal-nav-btn" id="homeCalPrev"><i data-lucide="chevron-left"></i></button>
      <span class="cal-month-label">${monthLabel}</span>
      <button class="cal-nav-btn" id="homeCalNext"><i data-lucide="chevron-right"></i></button>
    </div>
    <div class="cal-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
    <div class="cal-grid" id="homeCalGrid">${cells}</div>
    <button class="modal-close" id="homeCalCloseBtn">Fechar</button>
  `;
  icons();
  document.getElementById('homeCalPrev').addEventListener('click', ()=>{
    store.homeCalendarViewDate = new Date(year, month-1, 1);
    renderHomeCalendarModal();
  });
  document.getElementById('homeCalNext').addEventListener('click', ()=>{
    store.homeCalendarViewDate = new Date(year, month+1, 1);
    renderHomeCalendarModal();
  });
  document.getElementById('homeCalGrid').addEventListener('click', (e)=>{
    const cell = e.target.closest('[data-pick-date]');
    if(!cell) return;
    store.homeViewDate = cell.dataset.pickDate;
    document.getElementById('modalOverlay').classList.add('hidden');
    render();
  });
  document.getElementById('homeCalCloseBtn').addEventListener('click', ()=>document.getElementById('modalOverlay').classList.add('hidden'));
  const overlayEl = document.getElementById('modalOverlay');
  overlayEl.onclick = (e)=>{ if(e.target===overlayEl) overlayEl.classList.add('hidden'); };
}

/* ============================================================
   TAB: INÍCIO
   ============================================================ */


/* ============================================================
   PROFILE SLIDER — drag to switch profile (iOS "slide to power off" style)
   ============================================================ */
export function setupProfileSlider(){
  const slider = document.getElementById('profileSlider');
  const pill = document.getElementById('psPill');
  let dragging = false, startX = 0, startLeft = 0;

  function bounds(){
    return {min:3, max:slider.clientWidth - pill.offsetWidth - 3};
  }
  function setPillForProfile(profile, animate){
    const {min,max} = bounds();
    pill.style.transition = animate===false ? 'none' : '';
    pill.style.left = (profile==='gabriel' ? min : max)+'px';
    slider.querySelectorAll('.ps-label').forEach(l=>l.classList.toggle('active-label', l.dataset.target===profile));
    if(animate===false){ void pill.offsetWidth; pill.style.transition=''; }
  }
  setPillForProfile(store.currentProfile, false);

  function pointerX(e){ return e.touches ? e.touches[0].clientX : e.clientX; }
  function onDown(e){
    dragging = true;
    pill.classList.add('dragging');
    startX = pointerX(e);
    startLeft = parseFloat(pill.style.left) || bounds().min;
    e.preventDefault();
  }
  function onMove(e){
    if(!dragging) return;
    const delta = pointerX(e) - startX;
    const {min,max} = bounds();
    pill.style.left = clamp(startLeft+delta, min, max)+'px';
    e.preventDefault();
  }
  async function onUp(){
    if(!dragging) return;
    dragging = false;
    pill.classList.remove('dragging');
    const {min,max} = bounds();
    const left = parseFloat(pill.style.left);
    const target = left > (min+max)/2 ? 'raissa' : 'gabriel';
    setPillForProfile(target, true);
    if(target !== store.currentProfile) await loadProfile(target);
  }
  // dragging works from anywhere on the track, not just the small pill —
  // this is the ONLY way to switch profile now (no tap-to-switch on the labels).
  slider.addEventListener('mousedown', onDown);
  slider.addEventListener('touchstart', onDown, {passive:false});
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, {passive:false});
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);

  window.__profileSliderSet = setPillForProfile;
}
