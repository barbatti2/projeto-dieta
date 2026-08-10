import { CATEGORY_ICONS } from './food-db.js';
import { MEAL_LABELS, histExpandedDays, saveState, store } from './state.js';
import { heroHTML } from './ui-core.js';
import { formatQtyLabel } from './ui-inicio.js';
import { addDays, fmtDateShort, icons, showToast, todayStr } from './utils.js';

const histMealExpanded = {}; // "data|mealType" -> true/false (só nesta sessão)

/* Aba Histórico: refeições passadas, filtradas por dia/semana/mês/ano. */
export function renderHistorico(){
  return `
    ${heroHTML('historico')}
    ${renderWeekSummaryHTML()}
    <section class="card">
      <div class="filter-segment" id="histFilter">
        <button class="seg-btn${store.historicoFilter==='dia'?' active':''}" data-filter="dia">Dia</button>
        <button class="seg-btn${store.historicoFilter==='semana'?' active':''}" data-filter="semana">Semana</button>
        <button class="seg-btn${store.historicoFilter==='mes'?' active':''}" data-filter="mes">Mês</button>
        <button class="seg-btn${store.historicoFilter==='ano'?' active':''}" data-filter="ano">Ano</button>
      </div>
      <p class="empty-hint" style="padding:0 0 10px 0;">Toque em um alimento para editar a refeição ou a data. Use a lixeira para excluir.</p>
      <div id="histMonthNav">${store.historicoFilter==='mes' ? renderMonthNavHTML() : ''}</div>
      <div id="histContent">${renderHistContent()}</div>
    </section>
  `;
}
function renderWeekSummaryHTML(){
  const today = todayStr();
  const start = addDays(today, -6);
  const meals = store.state.meals.filter(m=>m.date>=start && m.date<=today);
  const goalKcal = store.state.goals.calorias;
  const goalProtein = store.state.goals.proteina;
  const goalCarbs = store.state.goals.carboidratos;

  const byDay = {};
  meals.forEach(m=>{
    if(!byDay[m.date]) byDay[m.date] = {kcal:0, protein:0, carbs:0, fat:0};
    byDay[m.date].kcal += m.kcal; byDay[m.date].protein += m.protein; byDay[m.date].carbs += m.carbs; byDay[m.date].fat += m.fat;
  });
  const incompleteCount = Object.keys(byDay).filter(d=>store.state.incompleteDays[d]).length;
  const daysLogged = Object.keys(byDay).filter(d=>!store.state.incompleteDays[d]);

  if(daysLogged.length===0){
    return `<section class="card">
      <h2><i data-lucide="sparkles"></i>Resumo dos últimos 7 dias</h2>
      <p class="empty-hint">Sem registros nos últimos 7 dias ainda.</p>
    </section>`;
  }

  const n = daysLogged.length;
  const totals = daysLogged.reduce((a,d)=>({kcal:a.kcal+byDay[d].kcal, protein:a.protein+byDay[d].protein, carbs:a.carbs+byDay[d].carbs}), {kcal:0,protein:0,carbs:0});
  const avgKcal = totals.kcal/n;
  const avgProtein = totals.protein/n;
  const avgCarbs = totals.carbs/n;
  const daysWithin = daysLogged.filter(d=>byDay[d].kcal<=goalKcal).length;
  const daysOver = n - daysWithin;

  let bestDay = daysLogged[0], worstDay = daysLogged[0];
  daysLogged.forEach(d=>{
    if(Math.abs(byDay[d].kcal-goalKcal) < Math.abs(byDay[bestDay].kcal-goalKcal)) bestDay = d;
    if(byDay[d].kcal-goalKcal > byDay[worstDay].kcal-goalKcal) worstDay = d;
  });

  const insights = [];
  insights.push({
    icon: daysOver===0 ? 'check-circle-2' : 'alert-triangle',
    text: daysOver===0
      ? `Dentro da meta de calorias em todos os ${n} dias considerados — ótimo controle.`
      : `Dentro da meta em ${daysWithin} de ${n} dias considerados, acima em ${daysOver}.`
  });
  const proteinPct = goalProtein>0 ? (avgProtein/goalProtein*100) : 0;
  if(proteinPct < 85) insights.push({icon:'trending-down', text:`Proteína ${Math.round(100-proteinPct)}% abaixo da meta em média — vale reforçar.`});
  else if(proteinPct >= 100) insights.push({icon:'trending-up', text:`Meta de proteína batida em média — consistente na semana.`});
  if(byDay[worstDay] && byDay[worstDay].kcal > goalKcal){
    insights.push({icon:'flame', text:`Pico em ${fmtDateShort(worstDay)}: ${Math.round(byDay[worstDay].kcal)} kcal.`});
  }
  if(incompleteCount>0){
    insights.push({icon:'circle-slash', text:`${incompleteCount} dia${incompleteCount===1?'':'s'} com registro incompleto não ${incompleteCount===1?'foi incluído':'foram incluídos'} na média.`});
  }

  // mini-gráfico dos 7 dias (sem registro ou incompletos aparecem em cinza)
  const maxKcal = Math.max(goalKcal, ...daysLogged.map(d=>byDay[d].kcal), 1);
  let barsHTML = '';
  for(let i=6;i>=0;i--){
    const d = addDays(today, -i);
    const incomplete = !!store.state.incompleteDays[d];
    const has = !!byDay[d] && !incomplete;
    const kcal = has ? byDay[d].kcal : 0;
    const pct = Math.max(4, Math.min(100, (kcal/maxKcal)*100));
    const over = has && kcal > goalKcal;
    const wd = new Intl.DateTimeFormat('pt-BR', {weekday:'narrow', timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
    barsHTML += `<div class="week-bar-col">
      <div class="week-bar-track"><div class="week-bar-fill${incomplete?' incomplete':!has?' empty':over?' over':''}" style="height:${has?pct:incomplete?60:8}%;"></div></div>
      <span class="week-bar-label${d===today?' is-today':''}">${wd}</span>
    </div>`;
  }

  return `
    <section class="card">
      <h2><i data-lucide="sparkles"></i>Resumo dos últimos 7 dias</h2>
      <div class="goal-summary">
        <div class="goal-chip"><div class="gc-val">${Math.round(avgKcal)}</div><div class="gc-label">Média kcal/dia</div></div>
        <div class="goal-chip"><div class="gc-val">${Math.round(avgProtein)}g</div><div class="gc-label">Média proteína</div></div>
        <div class="goal-chip"><div class="gc-val">${Math.round(avgCarbs)}g</div><div class="gc-label">Média carbo</div></div>
        <div class="goal-chip"><div class="gc-val">${daysWithin}/${n}</div><div class="gc-label">Dias na meta</div></div>
      </div>
      <div class="week-chart">${barsHTML}</div>
      <div class="week-insights">
        ${insights.map(i=>`<p class="week-insight-line"><i data-lucide="${i.icon}"></i>${i.text}</p>`).join('')}
      </div>
    </section>
  `;
}
function renderMonthNavHTML(){
  const label = new Intl.DateTimeFormat('pt-BR', {month:'long', year:'numeric'}).format(store.historicoMonthView);
  const labelCap = label.charAt(0).toUpperCase()+label.slice(1);
  return `<div class="cal-header" style="margin-bottom:12px;">
    <button class="cal-nav-btn" id="histMonthPrev"><i data-lucide="chevron-left"></i></button>
    <span class="cal-month-label">${labelCap}</span>
    <button class="cal-nav-btn" id="histMonthNext"><i data-lucide="chevron-right"></i></button>
  </div>`;
}
export function renderHistContent(){
  const today = store.homeViewDate;
  if(store.historicoFilter==='ano'){
    const months = {};
    store.state.meals.forEach(m=>{
      if(m.date < addDays(today,-365)) return;
      const key = m.date.slice(0,7);
      if(!months[key]) months[key] = {kcal:0,count:0};
      months[key].kcal += m.kcal; months[key].count++;
    });
    const keys = Object.keys(months).sort().reverse();
    if(keys.length===0) return '<p class="empty-hint">Nenhum registro no último ano.</p>';
    return keys.map(k=>{
      const label = new Intl.DateTimeFormat('pt-BR',{month:'long', year:'numeric'}).format(new Date(k+'-15T12:00:00Z'));
      return `<div class="hist-day-group"><div class="hist-date-title">${label}</div><div class="hist-day-total">${months[k].count} itens · ${Math.round(months[k].kcal)} kcal totais</div></div>`;
    }).join('');
  }

  let startDate, endDate;
  if(store.historicoFilter==='dia'){ startDate = today; endDate = today; }
  else if(store.historicoFilter==='semana'){ startDate = addDays(today,-6); endDate = today; }
  else {
    const y = store.historicoMonthView.getFullYear();
    const m = store.historicoMonthView.getMonth();
    const lastDay = new Date(y, m+1, 0).getDate();
    startDate = y+'-'+String(m+1).padStart(2,'0')+'-01';
    endDate = y+'-'+String(m+1).padStart(2,'0')+'-'+String(lastDay).padStart(2,'0');
  }

  const relevant = store.state.meals.filter(m=>m.date>=startDate && m.date<=endDate);
  if(relevant.length===0) return '<p class="empty-hint">Nenhum registro nesse período.</p>';

  const byDate = {};
  relevant.forEach(m=>{ if(!byDate[m.date]) byDate[m.date]=[]; byDate[m.date].push(m); });
  const dates = Object.keys(byDate).sort().reverse();

  return dates.map(dt=>{
    const items = byDate[dt];
    const total = items.reduce((a,i)=>a+i.kcal,0);
    const groups = Object.keys(MEAL_LABELS).map(mt=>{
      const mi = items.filter(i=>i.mealType===mt);
      if(mi.length===0) return '';
      const mealTotal = mi.reduce((a,i)=>a+i.kcal,0);
      const key = dt+'|'+mt;
      const mealOpen = !!histMealExpanded[key];
      return `<div class="hist-meal-group">
        <button class="hist-meal-summary" data-toggle-mealtype="${key}">
          <span class="hist-meal-summary-name">${MEAL_LABELS[mt]}</span>
          <span class="hist-meal-summary-right"><span class="hist-meal-summary-kcal">${Math.round(mealTotal)} kcal</span><i data-lucide="chevron-down" class="hist-meal-summary-chevron${mealOpen?' open':''}"></i></span>
        </button>
        <div class="hist-meal-detail${mealOpen?' open':''}">
          ${mi.map(i=>`<div class="food-row clickable" data-edit-meal="${i.id}"><div class="fr-icon"><i data-lucide="${CATEGORY_ICONS[i.category] || 'utensils'}"></i></div><div class="fr-info"><span class="fr-name">${i.name}</span><span class="fr-sub">${formatQtyLabel(i)}</span></div><span class="fr-kcal">${Math.round(i.kcal)} kcal</span><button class="fr-delete" data-delete-meal="${i.id}" data-meal-name="${i.name.replace(/"/g,'&quot;')}"><i data-lucide="trash-2"></i></button></div>`).join('')}
        </div>
      </div>`;
    }).join('');
    const d = new Date(dt+'T12:00:00Z');
    const dayNum = d.getUTCDate();
    const monthAbbr = new Intl.DateTimeFormat('pt-BR', {month:'short', timeZone:'UTC'}).format(d).replace('.','');
    const monthLabel = monthAbbr.charAt(0).toUpperCase()+monthAbbr.slice(1);
    const today2 = store.homeViewDate;
    const dayWord = dt===today2 ? 'Hoje' : (dt===addDays(today2,-1) ? 'Ontem' : new Intl.DateTimeFormat('pt-BR',{weekday:'long', timeZone:'UTC'}).format(d).replace(/^\w/,c=>c.toUpperCase()));
    const dayTitle = `${dayWord}, ${dayNum} ${monthLabel}`;
    const dayIncomplete = !!store.state.incompleteDays[dt];
    const status = dayStatusClass(total, store.state.goals.calorias);
    const statusLabel = status==='ok' ? 'DENTRO DA META' : 'ACIMA DA META';
    const expanded = !!histExpandedDays[dt];
    return `<div class="hist-day-card">
      <button class="hist-day-header" data-toggle-day="${dt}">
        <div class="hist-day-main">
          <div class="hist-day-titlerow">
            ${dayIncomplete
              ? `<span class="hist-status-pill incomplete"><i data-lucide="alert-triangle"></i>REGISTRO INCOMPLETO</span>`
              : `<span class="hist-status-pill ${status}">${statusLabel}</span>`}
            <span class="hist-day-title">${dayTitle}</span>
          </div>
          <div class="hist-day-metarow">
            <span class="hist-meta-item"><i data-lucide="flame"></i>${Math.round(total)} kcal</span>
            <span class="hist-meta-item"><i data-lucide="shopping-basket"></i>${items.length} ${items.length===1?'item':'itens'}</span>
          </div>
        </div>
        <i data-lucide="chevron-down" class="hist-day-chevron${expanded?' open':''}"></i>
      </button>
      <div class="hist-day-body${expanded?' open':''}">
        <div class="hist-detail-label">Detalhes</div>
        ${groups}
        <button class="incomplete-toggle-small" data-toggle-incomplete="${dt}">
          <i data-lucide="${dayIncomplete?'x':'alert-triangle'}"></i>${dayIncomplete?'Desmarcar como incompleto':'Marcar como registro incompleto'}
        </button>
      </div>
    </div>`;
  }).join('');
}
export function dayStatusClass(kcalTotal, goalKcal){
  if(!goalKcal || goalKcal<=0) return 'ok';
  return kcalTotal <= goalKcal ? 'ok' : 'over';
}
function wireMonthNav(){
  const prev = document.getElementById('histMonthPrev');
  const next = document.getElementById('histMonthNext');
  if(!prev || !next) return;
  prev.addEventListener('click', ()=>{
    store.historicoMonthView = new Date(store.historicoMonthView.getFullYear(), store.historicoMonthView.getMonth()-1, 1);
    document.getElementById('histMonthNav').innerHTML = renderMonthNavHTML();
    document.getElementById('histContent').innerHTML = renderHistContent();
    wireMonthNav();
    icons();
  });
  next.addEventListener('click', ()=>{
    store.historicoMonthView = new Date(store.historicoMonthView.getFullYear(), store.historicoMonthView.getMonth()+1, 1);
    document.getElementById('histMonthNav').innerHTML = renderMonthNavHTML();
    document.getElementById('histContent').innerHTML = renderHistContent();
    wireMonthNav();
    icons();
  });
}
export function wireHistorico(){
  document.getElementById('histFilter').addEventListener('click', (e)=>{
    const btn = e.target.closest('.seg-btn');
    if(!btn) return;
    store.historicoFilter = btn.dataset.filter;
    document.querySelectorAll('#histFilter .seg-btn').forEach(b=>b.classList.toggle('active', b.dataset.filter===store.historicoFilter));
    document.getElementById('histMonthNav').innerHTML = store.historicoFilter==='mes' ? renderMonthNavHTML() : '';
    document.getElementById('histContent').innerHTML = renderHistContent();
    wireMonthNav();
    icons();
  });
  wireMonthNav();
  document.getElementById('histContent').addEventListener('click', (e)=>{
    const toggleBtn = e.target.closest('[data-toggle-day]');
    if(toggleBtn){
      const dt = toggleBtn.dataset.toggleDay;
      histExpandedDays[dt] = !histExpandedDays[dt];
      document.getElementById('histContent').innerHTML = renderHistContent();
      icons();
      return;
    }
    const mealBtn = e.target.closest('[data-toggle-mealtype]');
    if(mealBtn){
      const key = mealBtn.dataset.toggleMealtype;
      histMealExpanded[key] = !histMealExpanded[key];
      document.getElementById('histContent').innerHTML = renderHistContent();
      icons();
      return;
    }
    const incBtn = e.target.closest('[data-toggle-incomplete]');
    if(incBtn){
      const dt = incBtn.dataset.toggleIncomplete;
      if(store.state.incompleteDays[dt]) delete store.state.incompleteDays[dt];
      else store.state.incompleteDays[dt] = true;
      saveState().then(()=>{
        showToast(store.state.incompleteDays[dt] ? 'Dia marcado como registro incompleto.' : 'Marcação removida.');
        document.getElementById('histContent').innerHTML = renderHistContent();
        document.getElementById('histMonthNav').innerHTML = store.historicoFilter==='mes' ? renderMonthNavHTML() : '';
        icons();
      });
    }
  });
}
