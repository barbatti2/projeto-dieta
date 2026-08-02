import { CATEGORY_ICONS } from './food-db.js';
import { MEAL_LABELS, store } from './state.js';
import { clamp, todayStr } from './utils.js';

/* Aba Início: resumo do dia (calorias e macros) e lista de refeições. */
export function renderInicio(){
  const today = store.homeViewDate;
  const isToday = today === todayStr();
  const meals = store.state.meals.filter(m=>m.date===today);
  const sum = meals.reduce((a,m)=>({kcal:a.kcal+m.kcal, protein:a.protein+m.protein, carbs:a.carbs+m.carbs, fat:a.fat+m.fat}), {kcal:0,protein:0,carbs:0,fat:0});
  const goals = store.state.goals;
  const pct = clamp(goals.calorias>0 ? (sum.kcal/goals.calorias*100) : 0, 0, 100);

  const goalFat = Math.round(goals.calorias*0.28/9); // meta de gordura derivada (~28% das calorias da meta)
  const rawPctProtein = goals.proteina>0 ? sum.protein/goals.proteina*100 : 0;
  const rawPctCarbs = goals.carboidratos>0 ? sum.carbs/goals.carboidratos*100 : 0;
  const rawPctFat = goalFat>0 ? sum.fat/goalFat*100 : 0;
  const pctProtein = clamp(rawPctProtein,0,100);
  const pctCarbs = clamp(rawPctCarbs,0,100);
  const pctFat = clamp(rawPctFat,0,100);

  const isOverGoal = goals.calorias>0 && sum.kcal > goals.calorias;
  const overAmount = Math.round(sum.kcal - goals.calorias);
  const remaining = Math.max(0, Math.round(goals.calorias - sum.kcal));

  const dayLabel = new Intl.DateTimeFormat('pt-BR', {timeZone:'UTC', weekday:'long', day:'2-digit', month:'long'}).format(new Date(today+'T12:00:00Z'));
  const RING_CIRC = 371.5; // 2 * PI * r(59.13, matches 130px ring at stroke-width 11)
  const ringOffset = (RING_CIRC * (1 - pct/100)).toFixed(1);

  return `
    <section class="card today-card">
      <div class="today-card-top">
        <span class="today-eyebrow">${dayLabel}</span>
        ${isToday ? '' : '<span class="today-badge">dia selecionado</span>'}
      </div>
      <div class="today-body">
        <div class="ring-outer">
          <svg class="ring-svg" viewBox="0 0 130 130">
            <circle class="ring-track" cx="65" cy="65" r="59.13"/>
            <circle class="ring-progress${isOverGoal?' over':''}" cx="65" cy="65" r="59.13" stroke-dasharray="${RING_CIRC}" stroke-dashoffset="${RING_CIRC}" data-ring-offset="${ringOffset}"/>
          </svg>
          <div class="ring-inner">
            <span class="ring-num" data-count-to="${Math.round(sum.kcal)}">0</span>
            <span class="ring-goal">de ${goals.calorias} kcal</span>
          </div>
        </div>
        <div class="today-macros">
          <div class="today-macro-row">
            <div class="today-macro-label"><span class="tm-name">Proteína <span class="tm-vals">${Math.round(sum.protein)}/${goals.proteina}g</span></span><span class="tm-pct${rawPctProtein>100?' over':''}">${Math.round(rawPctProtein)}%</span></div>
            <div class="today-macro-bar-track"><div class="today-macro-bar-fill${rawPctProtein>100?' warn':''}" data-fill="${pctProtein}%" style="width:0%;"></div></div>
          </div>
          <div class="today-macro-row">
            <div class="today-macro-label"><span class="tm-name">Carboidratos <span class="tm-vals">${Math.round(sum.carbs)}/${goals.carboidratos}g</span></span><span class="tm-pct${rawPctCarbs>100?' over':''}">${Math.round(rawPctCarbs)}%</span></div>
            <div class="today-macro-bar-track"><div class="today-macro-bar-fill${rawPctCarbs>100?' warn':''}" data-fill="${pctCarbs}%" style="width:0%;"></div></div>
          </div>
          <div class="today-macro-row">
            <div class="today-macro-label"><span class="tm-name">Gordura <span class="tm-vals">${Math.round(sum.fat)}/${goalFat}g</span></span><span class="tm-pct${rawPctFat>100?' over':''}">${Math.round(rawPctFat)}%</span></div>
            <div class="today-macro-bar-track"><div class="today-macro-bar-fill${rawPctFat>100?' warn':''}" data-fill="${pctFat}%" style="width:0%;"></div></div>
          </div>
        </div>
      </div>
      ${isOverGoal
        ? `<div class="today-alert"><i data-lucide="alert-triangle"></i>${overAmount} kcal acima da meta</div>`
        : ''}
      <p class="today-caption">${meals.length} ${meals.length===1?'item registrado':'itens registrados'} ${isToday ? 'hoje' : 'nesse dia'} · ${remaining} kcal restantes</p>
    </section>

    <section class="card">
      <button class="collapsible-header" id="mealsToggleBtn" type="button">
        <span class="collapsible-title"><i data-lucide="clipboard-list"></i>${isToday ? 'Refeições de hoje' : 'Refeições do dia'}</span>
        <span class="collapsible-meta">${meals.length} ${meals.length===1?'item':'itens'}</span>
        <i data-lucide="chevron-down" class="collapsible-chevron${store.homeMealsExpanded?' open':''}"></i>
      </button>
      <div class="collapsible-body${store.homeMealsExpanded?' open':''}">
        ${meals.length===0 ? '<p class="empty-hint">Nenhum alimento registrado ainda'+(isToday?'. Vá até "Adicionar" para começar.':' nesse dia.')+'</p>' :
          Object.keys(MEAL_LABELS).map(mt=>{
            const items = meals.filter(m=>m.mealType===mt);
            if(items.length===0) return '';
            const tot = items.reduce((a,i)=>a+i.kcal,0);
            return `<div class="hist-meal-group">
              <div class="hist-meal-title">${MEAL_LABELS[mt]} · ${Math.round(tot)} kcal</div>
              ${items.map(i=>`<div class="food-row" data-meal-id="${i.id}"><div class="fr-icon"><i data-lucide="${CATEGORY_ICONS[i.category] || 'utensils'}"></i></div><div class="fr-info"><span class="fr-name">${i.name}</span><span class="fr-sub">${formatQtyLabel(i)}</span></div><span class="fr-kcal">${Math.round(i.kcal)} kcal</span><button class="fr-delete" data-delete-meal="${i.id}" data-meal-name="${i.name.replace(/"/g,'&quot;')}"><i data-lucide="trash-2"></i></button></div>`).join('')}
            </div>`;
          }).join('')
        }
      </div>
    </section>
  `;
}
export function wireInicio(){
  const btn = document.getElementById('mealsToggleBtn');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    store.homeMealsExpanded = !store.homeMealsExpanded;
    const body = btn.parentElement.querySelector('.collapsible-body');
    const chevron = btn.querySelector('.collapsible-chevron');
    if(body) body.classList.toggle('open', store.homeMealsExpanded);
    if(chevron) chevron.classList.toggle('open', store.homeMealsExpanded);
  });
}
export function isBeverageFood(food){
  return !!food && food.category === 'Bebidas';
}
export function formatQtyLabel(item){
  const unit = isBeverageFood(item) ? 'ml' : 'g';
  if(item.isUnit) return item.qty+(item.qty===1?' unidade':' unidades')+' (~'+Math.round(item.grams)+unit+')';
  return Math.round(item.grams)+unit;
}
