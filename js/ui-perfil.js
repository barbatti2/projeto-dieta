import { saveState, store } from './state.js';
import { heroHTML, render } from './ui-core.js';
import { confirmDeleteWeight, renderCalendarSection, wireCalendarSection } from './ui-modals-calendar.js';
import { clamp, fmtDateShort, icons, showToast, todayStr } from './utils.js';

/* Aba Perfil: metas, peso, progresso e o calendário (via ui-modals-calendar.js). */
export function renderPesos(){
  const w = store.state.weight;
  const initial = w.initial;
  const lastEntry = w.history.length ? w.history[w.history.length-1] : null;
  const currentWeight = lastEntry ? lastEntry.peso : (initial ? initial.peso : null);

  let progressPct = 0, progressLabel = '—';
  if(initial && currentWeight!==null){
    const total = initial.pesoAlvo - initial.peso;
    if(total===0) progressPct = 100;
    else progressPct = clamp(((currentWeight-initial.peso)/total)*100, 0, 100);
    progressLabel = Math.round(progressPct)+'%';
  }

  return `
    ${heroHTML('pesos')}
    ${renderCalendarSection()}
    <section class="card">
      <h2><i data-lucide="target"></i>Metas iniciais</h2>
      ${initial ? `
        <div class="goal-summary">
          <div class="goal-chip"><div class="gc-val">${initial.peso}kg</div><div class="gc-label">Peso inicial</div></div>
          <div class="goal-chip"><div class="gc-val">${initial.pesoAlvo}kg</div><div class="gc-label">Peso alvo</div></div>
          <div class="goal-chip"><div class="gc-val">${initial.cintura}cm</div><div class="gc-label">Cintura</div></div>
          <div class="goal-chip"><div class="gc-val">${initial.braco}cm</div><div class="gc-label">Braço</div></div>
        </div>
        <button class="btn-outline btn-small full" id="editInitialBtn"><i data-lucide="pencil"></i>Editar metas iniciais</button>
        <div id="initialFormWrap"></div>
      ` : `
        <div id="initialFormWrap">${renderInitialForm()}</div>
      `}
    </section>

    <section class="card">
      <h2><i data-lucide="trending-up"></i>Progresso rumo à meta</h2>
      <div class="progress-capsule">
        <div class="progress-capsule-fill" data-fill="${progressPct}%" style="width:0%"><span>${progressLabel}</span></div>
      </div>
      <p class="ring-caption" style="margin-top:12px;">${currentWeight!==null ? 'Peso atual: '+currentWeight+'kg' : 'Registre seu peso inicial para começar'}</p>
    </section>

    <section class="card">
      <h2><i data-lucide="line-chart"></i>Atualização semanal de peso</h2>
      <div class="inline-row">
        <div class="form-field">
          <label>Peso atual (kg)</label>
          <input type="number" id="newWeightInput" step="0.1" placeholder="Ex: 78.5">
        </div>
        <button class="btn-gradient btn-small" id="addWeightBtn"><i data-lucide="plus"></i>Registrar</button>
      </div>
      <div class="weight-history-list">
        ${w.history.length===0 ? '<p class="empty-hint">Nenhum registro ainda.</p>' :
          w.history.slice().reverse().map(h=>`<div class="wh-row wh-row-clickable" data-delete-weight="${h.date}" data-weight-val="${h.peso}"><span>${fmtDateShort(h.date)}</span><span class="wh-val">${h.peso}kg</span></div>`).join('')}
      </div>
    </section>

    <section class="card">
      <h2><i data-lucide="sliders-horizontal"></i>Configuração de metas</h2>
      <div class="form-grid">
        <div class="form-field"><label>Meta de calorias (kcal)</label><input type="number" id="goalKcal" value="${store.state.goals.calorias}"></div>
        <div class="form-field"><label>Meta de proteína (g)</label><input type="number" id="goalProtein" value="${store.state.goals.proteina}"></div>
        <div class="form-field"><label>Meta de carboidratos (g)</label><input type="number" id="goalCarbs" value="${store.state.goals.carboidratos}"></div>
      </div>
      <button class="btn-gradient full" id="saveGoalsBtn"><i data-lucide="save"></i>Salvar metas</button>
    </section>
  `;
}
export function renderInitialForm(){
  return `
    <div class="form-grid">
      <div class="form-field"><label>Peso atual (kg)</label><input type="number" id="fPeso" step="0.1" placeholder="Ex: 82"></div>
      <div class="form-field"><label>Peso alvo (kg)</label><input type="number" id="fPesoAlvo" step="0.1" placeholder="Ex: 75"></div>
      <div class="form-field"><label>Cintura (cm)</label><input type="number" id="fCintura" step="0.1" placeholder="Ex: 88"></div>
      <div class="form-field"><label>Braço (cm)</label><input type="number" id="fBraco" step="0.1" placeholder="Ex: 34"></div>
    </div>
    <button class="btn-gradient full" id="saveInitialBtn"><i data-lucide="save"></i>Salvar metas iniciais</button>
  `;
}
export function wirePesos(){
  wireCalendarSection();

  const editBtn = document.getElementById('editInitialBtn');
  if(editBtn){
    editBtn.addEventListener('click', ()=>{
      document.getElementById('initialFormWrap').innerHTML = renderInitialForm();
      wireInitialForm();
      icons();
    });
  } else {
    wireInitialForm();
  }

  document.getElementById('addWeightBtn').addEventListener('click', async ()=>{
    const val = parseFloat(document.getElementById('newWeightInput').value);
    if(isNaN(val) || val<=0){ showToast('Informe um peso válido'); return; }
    const today = todayStr();
    const existingIdx = store.state.weight.history.findIndex(h=>h.date===today);
    if(existingIdx>=0) store.state.weight.history[existingIdx].peso = val;
    else store.state.weight.history.push({date:today, peso:val});
    store.state.weight.history.sort((a,b)=>a.date<b.date?-1:1);
    await saveState();
    showToast('Peso registrado!');
    render();
  });

  document.querySelectorAll('[data-delete-weight]').forEach(row=>{
    row.addEventListener('click', ()=>{
      confirmDeleteWeight(row.dataset.deleteWeight, row.dataset.weightVal);
    });
  });

  document.getElementById('saveGoalsBtn').addEventListener('click', async ()=>{
    const k = parseInt(document.getElementById('goalKcal').value,10);
    const p = parseInt(document.getElementById('goalProtein').value,10);
    const c = parseInt(document.getElementById('goalCarbs').value,10);
    if(!isNaN(k) && k>0) store.state.goals.calorias = k;
    if(!isNaN(p) && p>0) store.state.goals.proteina = p;
    if(!isNaN(c) && c>0) store.state.goals.carboidratos = c;
    await saveState();
    showToast('Metas salvas com sucesso!');
  });
}
export function wireInitialForm(){
  const btn = document.getElementById('saveInitialBtn');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    const peso = parseFloat(document.getElementById('fPeso').value);
    const pesoAlvo = parseFloat(document.getElementById('fPesoAlvo').value);
    const cintura = parseFloat(document.getElementById('fCintura').value);
    const braco = parseFloat(document.getElementById('fBraco').value);
    if([peso,pesoAlvo,cintura,braco].some(v=>isNaN(v) || v<=0)){ showToast('Preencha todos os campos corretamente'); return; }
    store.state.weight.initial = {peso, pesoAlvo, cintura, braco, date: todayStr()};
    if(store.state.weight.history.length===0) store.state.weight.history.push({date:todayStr(), peso});
    await saveState();
    showToast('Metas iniciais salvas!');
    render();
  });
}
