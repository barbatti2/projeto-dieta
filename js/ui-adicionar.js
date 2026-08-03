import { CATEGORY_ICONS, FOOD_DB } from './food-db.js';
import { MEAL_ICONS, MEAL_LABELS, addFoodState, saveState, store } from './state.js';
import { heroHTML } from './ui-core.js';
import { formatQtyLabel, isBeverageFood } from './ui-inicio.js';
import { clamp, icons, normalize, showToast } from './utils.js';

/* Aba Adicionar: busca de alimento, quantidade e fila de itens da refeição. */
export function renderAdicionar(){
  return `
    ${heroHTML('adicionar')}
    <section class="composer-hero">
      <label class="field-label">Buscar alimento</label>
      <div class="search-wrap">
        <span class="search-input-icon"><i data-lucide="search"></i></span>
        <input type="text" id="foodSearchInput" placeholder="Digite o nome do alimento..." autocomplete="off">
        <div id="foodDropdown" class="dropdown hidden"></div>
      </div>

      <div id="foodTicket" class="food-ticket">
        <div class="ft-top">
          <div class="ft-icon" id="ftIcon"><i data-lucide="utensils"></i></div>
          <div>
            <div class="ft-name" id="ftName"></div>
            <div class="ft-cat" id="ftCat"></div>
          </div>
        </div>
        <div class="ft-macros" id="ftMacros"></div>

        <div class="qty-control">
          <button id="qtyMinus" class="qty-btn"><i data-lucide="minus"></i></button>
          <div class="qty-display" id="qtyDisplay">100<span class="qty-sub" id="qtySub">gramas</span></div>
          <button id="qtyPlus" class="qty-btn"><i data-lucide="plus"></i></button>
        </div>
        <div class="quick-qty" id="quickQty"></div>
        <button id="includeItemBtn" class="btn-gradient full" style="margin-top:14px;"><i data-lucide="plus"></i>Incluir item</button>
      </div>
    </section>

    <section class="card">
      <h2><i data-lucide="clock"></i>Refeição</h2>
      <div class="meal-type-grid" id="mealTypeGrid">
        ${Object.keys(MEAL_LABELS).map(mt=>`<button class="meal-type-btn${mt===addFoodState.mealType?' active':''}" data-meal="${mt}"><i data-lucide="${MEAL_ICONS[mt]}"></i>${MEAL_LABELS[mt]}</button>`).join('')}
      </div>
    </section>

    <section class="card">
      <h2><i data-lucide="list-checks"></i>Itens selecionados</h2>
      <div id="itemsList" class="items-list">${renderItemsListHTML()}</div>
      <div class="queue-total">
        <span>Total na fila</span>
        <b id="queueTotalKcal">${Math.round(addFoodState.itemsToSave.reduce((a,i)=>a+i.kcal,0))} kcal</b>
      </div>
      <button id="saveMealBtn" class="btn-primary full"><i data-lucide="check-circle-2"></i>Salvar refeição</button>
    </section>
  `;
}
export function renderItemsListHTML(){
  if(addFoodState.itemsToSave.length===0) return '<p class="empty-hint">Nenhum item incluído ainda.</p>';
  return addFoodState.itemsToSave.map(it=>`
    <div class="item-row" data-item-id="${it.uid}">
      <div class="ir-info">
        <span class="ir-dot"></span>
        <div>
          <div class="ir-name">${it.name}</div>
          <div class="ir-sub">${formatQtyLabel(it)} · ${MEAL_LABELS[it.mealType]} · ${Math.round(it.kcal)}kcal</div>
        </div>
      </div>
      <button class="ir-remove" data-remove="${it.uid}"><i data-lucide="x"></i></button>
    </div>
  `).join('');
}
export function updateQtyUI(rebuildPresets){
  const food = addFoodState.selected;
  if(!food) return;
  const qtyDisplay = document.getElementById('qtyDisplay');
  const qtySub = document.getElementById('qtySub');
  const quickQty = document.getElementById('quickQty');
  qtyDisplay.childNodes[0].nodeValue = addFoodState.qty;
  qtySub.textContent = addFoodState.isUnit ? (addFoodState.qty===1?'unidade':'unidades') : (isBeverageFood(food) ? 'ml' : 'gramas');

  if(rebuildPresets){
    const presets = addFoodState.isUnit ? [1,2,3,4] : [50,100,150,200];
    quickQty.innerHTML = presets.map(p=>`<button class="quick-btn" data-qty="${p}">${p}${addFoodState.isUnit?' un':(isBeverageFood(food)?'ml':'g')}</button>`).join('');
  }
  quickQty.querySelectorAll('.quick-btn').forEach(b=>b.classList.toggle('active', parseFloat(b.dataset.qty)===addFoodState.qty));

  if(!addFoodState.macros) return; // placeholders na tela até o cálculo local terminar

  const gramsEquiv = addFoodState.isUnit ? addFoodState.qty*food.unitWeight : addFoodState.qty;
  const factor = gramsEquiv/100;
  const macros = addFoodState.macros;
  const ftMacros = document.getElementById('ftMacros');
  ftMacros.children[0].firstElementChild.textContent = Math.round(macros.kcal*factor);
  ftMacros.children[1].firstElementChild.textContent = (Math.round(macros.protein*factor*10)/10)+'g';
  ftMacros.children[2].firstElementChild.textContent = (Math.round(macros.carbs*factor*10)/10)+'g';
  ftMacros.children[3].firstElementChild.textContent = (Math.round(macros.fat*factor*10)/10)+'g';
}
export function selectFood(food){
  addFoodState.selected = food;
  addFoodState.isUnit = !!food.unit;
  addFoodState.qty = food.unit ? 1 : 100;
  addFoodState.macros = {kcal:food.kcal, protein:food.protein, carbs:food.carbs, fat:food.fat};

  const ticket = document.getElementById('foodTicket');
  if(!ticket) return;
  ticket.classList.add('show');
  document.getElementById('ftName').textContent = food.name;
  const ftCat = document.getElementById('ftCat');
  ftCat.textContent = food.category + (food.unit ? ' · medido por unidade' : (isBeverageFood(food) ? ' · medido por ml' : ' · medido por gramas'));
  ftCat.classList.remove('loading');
  document.getElementById('ftIcon').innerHTML = `<i data-lucide="${CATEGORY_ICONS[food.category] || 'utensils'}"></i>`;
  document.getElementById('ftMacros').innerHTML = `
    <div class="ft-macro"><div class="fm-val">0</div><div class="fm-label">kcal</div></div>
    <div class="ft-macro"><div class="fm-val">0g</div><div class="fm-label">prot</div></div>
    <div class="ft-macro"><div class="fm-val">0g</div><div class="fm-label">carb</div></div>
    <div class="ft-macro"><div class="fm-val">0g</div><div class="fm-label">gord</div></div>
  `;
  const includeBtn = document.getElementById('includeItemBtn');
  if(includeBtn) includeBtn.disabled = false;
  updateQtyUI(true);
  icons();
}
export function clearFoodSelection(){
  addFoodState.selected = null;
  addFoodState.isUnit = false;
  addFoodState.qty = 100;
  addFoodState.macros = null;
  const ticket = document.getElementById('foodTicket');
  if(ticket) ticket.classList.remove('show');
  const input = document.getElementById('foodSearchInput');
  if(input) input.value = '';
}
export function wireAdicionar(){
  const searchInput = document.getElementById('foodSearchInput');
  const dropdown = document.getElementById('foodDropdown');

  function runSearch(){
    const q = normalize(searchInput.value.trim());
    if(q.length===0){ dropdown.classList.add('hidden'); dropdown.innerHTML=''; return; }
    const results = FOOD_DB.filter(f=>normalize(f.name).includes(q)).slice(0,8);
    if(results.length===0){
      dropdown.innerHTML = '<div class="dropdown-empty">Nenhum alimento encontrado</div>';
    } else {
      dropdown.innerHTML = results.map(f=>`
        <div class="dropdown-item" data-food-id="${f.id}">
          <div class="di-icon"><i data-lucide="${CATEGORY_ICONS[f.category] || 'utensils'}"></i></div>
          <div class="di-text"><div class="di-name">${f.name}</div><div class="di-cat">${f.category}${f.unit?' · por unidade':''}</div></div>
        </div>`).join('');
    }
    dropdown.classList.remove('hidden');
    icons();
  }

  searchInput.addEventListener('input', runSearch);
  dropdown.addEventListener('click', (e)=>{
    const item = e.target.closest('.dropdown-item');
    if(!item) return;
    const id = parseInt(item.dataset.foodId,10);
    const food = FOOD_DB.find(f=>f.id===id);
    if(food){
      searchInput.value = food.name;
      dropdown.classList.add('hidden');
      selectFood(food);
    }
  });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.search-wrap')) dropdown.classList.add('hidden');
  });

  document.getElementById('qtyMinus').addEventListener('click', ()=>{
    if(!addFoodState.selected) return;
    const step = addFoodState.isUnit ? 1 : 10;
    const min = addFoodState.isUnit ? 1 : 10;
    addFoodState.qty = clamp(addFoodState.qty-step, min, 5000);
    updateQtyUI();
  });
  document.getElementById('qtyPlus').addEventListener('click', ()=>{
    if(!addFoodState.selected) return;
    const step = addFoodState.isUnit ? 1 : 10;
    addFoodState.qty = clamp(addFoodState.qty+step, 1, 5000);
    updateQtyUI();
  });
  document.getElementById('quickQty').addEventListener('click', (e)=>{
    const btn = e.target.closest('.quick-btn');
    if(!btn || !addFoodState.selected) return;
    addFoodState.qty = parseFloat(btn.dataset.qty);
    updateQtyUI();
  });

  document.getElementById('mealTypeGrid').addEventListener('click', (e)=>{
    const btn = e.target.closest('.meal-type-btn');
    if(!btn) return;
    addFoodState.mealType = btn.dataset.meal;
    document.querySelectorAll('.meal-type-btn').forEach(b=>b.classList.toggle('active', b.dataset.meal===addFoodState.mealType));
  });

  document.getElementById('includeItemBtn').addEventListener('click', ()=>{
    if(!addFoodState.selected){ showToast('Selecione um alimento primeiro'); return; }
    const f = addFoodState.selected;
    const macros = addFoodState.macros || {kcal:f.kcal, protein:f.protein, carbs:f.carbs, fat:f.fat};
    const gramsEquiv = addFoodState.isUnit ? addFoodState.qty*f.unitWeight : addFoodState.qty;
    const factor = gramsEquiv/100;
    addFoodState.itemsToSave.push({
      uid: Date.now()+'_'+Math.random().toString(36).slice(2,7),
      name:f.name, category:f.category, grams:gramsEquiv, qty:addFoodState.qty, isUnit:addFoodState.isUnit, mealType:addFoodState.mealType,
      kcal:macros.kcal*factor, protein:macros.protein*factor, carbs:macros.carbs*factor, fat:macros.fat*factor
    });
    showToast('Item incluído: '+f.name);
    // clear the pre-selection so the next food can be picked right away
    clearFoodSelection();
    document.getElementById('itemsList').innerHTML = renderItemsListHTML();
    document.getElementById('queueTotalKcal').textContent = Math.round(addFoodState.itemsToSave.reduce((a,i)=>a+i.kcal,0))+' kcal';
    icons();
  });

  document.getElementById('itemsList').addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-remove]');
    if(!btn) return;
    addFoodState.itemsToSave = addFoodState.itemsToSave.filter(it=>it.uid!==btn.dataset.remove);
    document.getElementById('itemsList').innerHTML = renderItemsListHTML();
    document.getElementById('queueTotalKcal').textContent = Math.round(addFoodState.itemsToSave.reduce((a,i)=>a+i.kcal,0))+' kcal';
    icons();
  });

  document.getElementById('saveMealBtn').addEventListener('click', async ()=>{
    if(addFoodState.itemsToSave.length===0){ showToast('Inclua pelo menos um item'); return; }
    const today = store.homeViewDate;
    addFoodState.itemsToSave.forEach(it=>{
      store.state.meals.push({
        id: Date.now()+'_'+Math.random().toString(36).slice(2,7),
        date: today, mealType: it.mealType, name: it.name, category: it.category, grams: it.grams, qty: it.qty, isUnit: it.isUnit,
        kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat
      });
    });
    addFoodState.itemsToSave = [];
    await saveState();
    document.getElementById('itemsList').innerHTML = renderItemsListHTML();
    document.getElementById('queueTotalKcal').textContent = '0 kcal';
    showToast('Refeição salva com sucesso!');
  });
}
