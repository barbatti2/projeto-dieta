import { MARK_INFO, MEAL_ICONS, MEAL_LABELS, saveState, store } from './state.js';
import { render } from './ui-core.js';
import { escapeHtml, fmtDateLong, fmtDateShort, icons, nowBRTime, showToast, todayStr } from './utils.js';

/* Calendário (dieta/treino) e modais de excluir/editar refeição ou peso. */
export function renderCalendarSection(){
  const year = store.calendarViewDate.getFullYear();
  const month = store.calendarViewDate.getMonth();
  const monthLabel = new Intl.DateTimeFormat('pt-BR', {month:'long', year:'numeric'}).format(store.calendarViewDate);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = todayStr();

  let cells = '';
  for(let i=0;i<firstDay;i++) cells += '<div class="cal-day empty"></div>';
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isToday = dateStr===today;
    const mark = store.state.calendarMarks[dateStr];
    const markCls = mark ? MARK_INFO[mark].cls : '';
    cells += `<div class="cal-day ${isToday?'today':''} ${markCls}" data-date="${dateStr}">${d}</div>`;
  }

  const counts = {dieta_treino:0, dieta:0, treino:0};
  Object.keys(store.state.calendarMarks).forEach(dt=>{
    if(dt.startsWith(year+'-'+String(month+1).padStart(2,'0'))){
      counts[store.state.calendarMarks[dt]] = (counts[store.state.calendarMarks[dt]]||0)+1;
    }
  });

  return `
    <section class="card">
      <h2><i data-lucide="calendar-days"></i>Calendário</h2>
      <div class="cal-clock" id="brClock"><i data-lucide="clock-3"></i>Horário de Brasília: ${nowBRTime()}</div>
      <div class="cal-header">
        <button class="cal-nav-btn" id="calPrev"><i data-lucide="chevron-left"></i></button>
        <span class="cal-month-label">${monthLabel}</span>
        <button class="cal-nav-btn" id="calNext"><i data-lucide="chevron-right"></i></button>
      </div>
      <div class="cal-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
      <div class="cal-grid" id="calGrid">${cells}</div>
      <div class="cal-legend">
        <div class="legend-item"><span class="legend-dot" style="background:linear-gradient(135deg,var(--accent-1),var(--accent-2))"></span>Dieta + Treino</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--accent-1)"></span>Só Dieta</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--accent-2)"></span>Só Treino</div>
      </div>
    </section>
    <section class="cal-counters">
      <div class="counter-card"><div class="cc-num">${counts.dieta_treino}</div><div class="cc-label">Dieta + Treino</div></div>
      <div class="counter-card"><div class="cc-num">${counts.dieta}</div><div class="cc-label">Só Dieta</div></div>
      <div class="counter-card"><div class="cc-num">${counts.treino}</div><div class="cc-label">Só Treino</div></div>
    </section>
  `;
}
export function wireCalendarSection(){
  clearInterval(window.__clockInterval);
  window.__clockInterval = setInterval(()=>{
    const el = document.getElementById('brClock');
    if(el) el.innerHTML = '<i data-lucide="clock-3"></i>Horário de Brasília: '+nowBRTime();
    else { clearInterval(window.__clockInterval); return; }
    icons();
  }, 1000);

  document.getElementById('calPrev').addEventListener('click', ()=>{
    store.calendarViewDate = new Date(store.calendarViewDate.getFullYear(), store.calendarViewDate.getMonth()-1, 1);
    render();
  });
  document.getElementById('calNext').addEventListener('click', ()=>{
    store.calendarViewDate = new Date(store.calendarViewDate.getFullYear(), store.calendarViewDate.getMonth()+1, 1);
    render();
  });
  document.getElementById('calGrid').addEventListener('click', (e)=>{
    const cell = e.target.closest('.cal-day');
    if(!cell || cell.classList.contains('empty')) return;
    openDayModal(cell.dataset.date);
  });
}
export function openDayModal(dateStr){
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  const current = store.state.calendarMarks[dateStr];
  box.innerHTML = `
    <h3>${fmtDateLong(dateStr)}</h3>
    <div class="modal-options">
      <button class="modal-opt-btn" data-mark="dieta_treino"><i data-lucide="dumbbell"></i>Dieta + Treino</button>
      <button class="modal-opt-btn" data-mark="dieta"><i data-lucide="salad"></i>Só Dieta</button>
      <button class="modal-opt-btn" data-mark="treino"><i data-lucide="dumbbell"></i>Só Treino</button>
      ${current ? '<button class="modal-opt-btn remove" data-mark="__remove"><i data-lucide="trash-2"></i>Remover marcação</button>' : ''}
    </div>
    <button class="modal-close" id="modalCloseBtn">Cancelar</button>
  `;
  overlay.classList.remove('hidden');
  icons();
  box.querySelectorAll('[data-mark]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const mk = btn.dataset.mark;
      if(mk==='__remove') delete store.state.calendarMarks[dateStr];
      else store.state.calendarMarks[dateStr] = mk;
      await saveState();
      overlay.classList.add('hidden');
      render();
    });
  });
  document.getElementById('modalCloseBtn').addEventListener('click', ()=>overlay.classList.add('hidden'));
  overlay.onclick = (e)=>{ if(e.target===overlay) overlay.classList.add('hidden'); };
}

/* ============================================================
   EXCLUIR ALIMENTO SALVO (Início e Histórico)
   ============================================================ */
export function confirmDeleteMeal(mealId, mealName){
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <h3>Excluir "${mealName}"?</h3>
    <div class="modal-options">
      <button class="modal-opt-btn remove" data-confirm-delete="1"><i data-lucide="trash-2"></i>Sim, excluir</button>
    </div>
    <button class="modal-close" id="modalCloseBtn">Cancelar</button>
  `;
  overlay.classList.remove('hidden');
  icons();
  box.querySelector('[data-confirm-delete]').addEventListener('click', async ()=>{
    store.state.meals = store.state.meals.filter(m=>m.id!==mealId);
    await saveState();
    overlay.classList.add('hidden');
    render();
    showToast('Alimento excluído.');
  });
  document.getElementById('modalCloseBtn').addEventListener('click', ()=>overlay.classList.add('hidden'));
  overlay.onclick = (e)=>{ if(e.target===overlay) overlay.classList.add('hidden'); };
}
export function openEditMealModal(mealId){
  const meal = store.state.meals.find(m=>m.id===mealId);
  if(!meal) return;
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  let chosenMealType = meal.mealType;
  box.innerHTML = `
    <h3>Editar "${escapeHtml(meal.name)}"</h3>
    <div class="modal-field">
      <label>Refeição</label>
      <div class="meal-type-grid" id="editMealTypeGrid">
        ${Object.keys(MEAL_LABELS).map(mt=>`<button class="meal-type-btn${mt===meal.mealType?' active':''}" data-meal="${mt}"><i data-lucide="${MEAL_ICONS[mt]}"></i>${MEAL_LABELS[mt]}</button>`).join('')}
      </div>
    </div>
    <div class="modal-field">
      <label>Data</label>
      <input type="date" id="editMealDate" class="name-input" value="${meal.date}" max="${todayStr()}">
    </div>
    <button class="btn-gradient full" id="saveEditMealBtn"><i data-lucide="save"></i>Salvar alterações</button>
    <button class="modal-close" id="editMealCloseBtn">Cancelar</button>
  `;
  overlay.classList.remove('hidden');
  icons();
  document.getElementById('editMealTypeGrid').addEventListener('click', (e)=>{
    const btn = e.target.closest('.meal-type-btn');
    if(!btn) return;
    chosenMealType = btn.dataset.meal;
    document.querySelectorAll('#editMealTypeGrid .meal-type-btn').forEach(b=>b.classList.toggle('active', b.dataset.meal===chosenMealType));
  });
  document.getElementById('saveEditMealBtn').addEventListener('click', async ()=>{
    const newDate = document.getElementById('editMealDate').value || meal.date;
    meal.mealType = chosenMealType;
    meal.date = newDate;
    await saveState();
    overlay.classList.add('hidden');
    render();
    showToast('Alimento atualizado!');
  });
  document.getElementById('editMealCloseBtn').addEventListener('click', ()=>overlay.classList.add('hidden'));
  overlay.onclick = (e)=>{ if(e.target===overlay) overlay.classList.add('hidden'); };
}
document.getElementById('content').addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-delete-meal]');
  if(!btn) return;
  confirmDeleteMeal(btn.dataset.deleteMeal, btn.dataset.mealName || 'este alimento');
});
document.getElementById('content').addEventListener('click', (e)=>{
  if(e.target.closest('[data-delete-meal]')) return;
  const row = e.target.closest('[data-edit-meal]');
  if(!row) return;
  openEditMealModal(row.dataset.editMeal);
});

/* ============================================================
   EXCLUIR REGISTRO DE PESO (Pesos e medidas)
   ============================================================ */
export function confirmDeleteWeight(dateStr, pesoVal){
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  box.innerHTML = `
    <h3>Excluir registro de ${fmtDateShort(dateStr)} (${pesoVal}kg)?</h3>
    <div class="modal-options">
      <button class="modal-opt-btn remove" data-confirm-delete-weight="1"><i data-lucide="trash-2"></i>Sim, excluir</button>
    </div>
    <button class="modal-close" id="modalCloseBtn">Cancelar</button>
  `;
  overlay.classList.remove('hidden');
  icons();
  box.querySelector('[data-confirm-delete-weight]').addEventListener('click', async ()=>{
    store.state.weight.history = store.state.weight.history.filter(h=>h.date!==dateStr);
    await saveState();
    overlay.classList.add('hidden');
    render();
    showToast('Registro de peso excluído.');
  });
  document.getElementById('modalCloseBtn').addEventListener('click', ()=>overlay.classList.add('hidden'));
  overlay.onclick = (e)=>{ if(e.target===overlay) overlay.classList.add('hidden'); };
}
