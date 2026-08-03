import { CATEGORY_ICONS, FOOD_DB } from './food-db.js';
import { MEAL_ICONS, MEAL_LABELS, menuEditor, saveState, store } from './state.js';
import { heroHTML, render } from './ui-core.js';
import { formatQtyLabel, isBeverageFood } from './ui-inicio.js';
import { clamp, escapeHtml, icons, normalize, showToast } from './utils.js';

/* Aba Cardápio: lista de alimentos planejados por refeição. */
export const cardapioEditingState = {}; // mealType -> true/false explícito (só nesta sessão, ex: reabriu p/ editar)
export const cardapioViewExpanded = {}; // mealType -> true/false (só nesta sessão) — se o card salvo está expandido
export function isCardapioEditing(mealType){
  if(cardapioEditingState[mealType] !== undefined) return cardapioEditingState[mealType];
  if(store.state.cardapioSalvo[mealType]) return false;
  const hasChecked = store.state.cardapioUnico[mealType].some(it=>it.checked);
  if(hasChecked) return false; // já tem alimentos marcados: mostra em modo visualização, não edição
  return true; // refeição vazia/nunca configurada: começa em edição
}
export function mealCheckedTotal(mealType){
  const items = store.state.cardapioUnico[mealType];
  return items.reduce((sum,it)=> sum + (it.checked ? it.kcal : 0), 0);
}
export function renderCardapio(){
  return `
    ${heroHTML('cardapio')}
    ${Object.keys(MEAL_LABELS).map(mt=>renderMenuMealCard(mt)).join('')}
  `;
}
export function renderMenuMealCard(mealType){
  const items = store.state.cardapioUnico[mealType];
  const checkedItems = items.filter(it=>it.checked);
  const total = mealCheckedTotal(mealType);
  const editing = isCardapioEditing(mealType);

  if(editing){
    return `
      <section class="card menu-meal-card">
        <div class="menu-meal-header">
          <div class="menu-meal-icon"><i data-lucide="${MEAL_ICONS[mealType]}"></i></div>
          <div class="menu-meal-title">${MEAL_LABELS[mealType]}</div>
          <div class="menu-meal-sub">${items.length}${items.length===1?' alimento':' alimentos'}</div>
        </div>
        ${items.length===0 ? '<p class="menu-empty-slots">Nenhum alimento ainda. Adicione o primeiro abaixo.</p>' :
          `<div class="menu-food-chips">${items.map(it=>renderMenuFoodRow(mealType, it)).join('')}</div>`}

        <button class="menu-add-food-btn" data-add-food="${mealType}"><i data-lucide="plus"></i>Adicionar alimento</button>

        <div class="menu-meal-footer">
          <div class="mf-total">Selecionado: <b>${Math.round(total)} kcal</b></div>
          <button class="menu-save-btn" data-save-meal="${mealType}"><i data-lucide="save"></i>Salvar ${MEAL_LABELS[mealType].toLowerCase()}</button>
        </div>
      </section>
    `;
  }

  const expanded = !!cardapioViewExpanded[mealType];
  return `
    <section class="card menu-meal-card menu-view-card">
      <div class="menu-view-toprow">
        <button class="menu-view-header" data-toggle-menu="${mealType}">
          <div class="menu-view-icon"><i data-lucide="${MEAL_ICONS[mealType]}"></i></div>
          <div class="menu-view-info">
            <span class="menu-view-name">${MEAL_LABELS[mealType]}</span>
            <span class="menu-view-sub">${checkedItems.length}${checkedItems.length===1?' alimento':' alimentos'}</span>
          </div>
          <div class="menu-view-right">
            <span class="menu-view-kcal">${Math.round(total)} kcal</span>
            <i data-lucide="chevron-down" class="menu-view-chevron${expanded?' open':''}"></i>
          </div>
        </button>
        ${expanded ? `<button class="menu-edit-pencil" data-edit-meal="${mealType}" title="Editar"><i data-lucide="pencil"></i></button>` : ''}
      </div>
      <div class="menu-view-body${expanded?' open':''}">
        ${checkedItems.length===0 ? '<p class="menu-empty-slots">Nada salvo ainda neste cardápio.</p>' :
          `<div class="menu-food-chips">${checkedItems.map(it=>renderMenuFoodRowView(it)).join('')}</div>`}
      </div>
    </section>
  `;
}
export function renderMenuFoodRow(mealType, item){
  return `
    <div class="mf-chip ${item.checked?'checked':''}" data-toggle-food="${item.uid}" data-meal="${mealType}">
      <i data-lucide="check" class="mf-chip-check"></i>
      <div class="mf-chip-text">
        <span class="mf-chip-name">${escapeHtml(item.name)}</span>
        <span class="mf-chip-sub">${formatQtyLabel(item)} · ${Math.round(item.kcal)}kcal</span>
      </div>
      <button class="mf-chip-remove" data-remove-food="${item.uid}" data-meal="${mealType}"><i data-lucide="minus-circle"></i></button>
    </div>
  `;
}
export function renderMenuFoodRowView(item){
  return `
    <div class="mf-chip view">
      <div class="mf-chip-icon"><i data-lucide="${CATEGORY_ICONS[item.category] || 'utensils'}"></i></div>
      <div class="mf-chip-text">
        <span class="mf-chip-name">${escapeHtml(item.name)}</span>
        <span class="mf-chip-sub">${formatQtyLabel(item)}</span>
      </div>
      <span class="mf-chip-kcal">${Math.round(item.kcal)}kcal</span>
    </div>
  `;
}


/* ---------- bottom sheet: adicionar alimento à lista da refeição ---------- */
export function openMenuOptionPicker(mealType){
  menuEditor.mealType = mealType;
  menuEditor.selected = null;
  menuEditor.isUnit = false;
  menuEditor.qty = 100;
  menuEditor.macros = null;

  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  box.classList.add('modal-box-tall');
  box.innerHTML = `
    <div class="sheet-drag-handle"></div>
    <h3>Adicionar alimento</h3>
    <p class="sheet-subtitle">${MEAL_LABELS[mealType]}</p>

    <div class="search-wrap">
      <span class="search-input-icon"><i data-lucide="search"></i></span>
      <input type="text" id="deSearchInput" placeholder="Digite o nome do alimento..." autocomplete="off">
      <div id="deDropdown" class="dropdown hidden"></div>
    </div>

    <div id="deTicket" class="food-ticket">
      <div class="ft-top">
        <div class="ft-icon" id="deIcon"><i data-lucide="utensils"></i></div>
        <div>
          <div class="ft-name" id="deName"></div>
          <div class="ft-cat" id="deCat"></div>
        </div>
      </div>
      <div class="ft-macros" id="deMacros"></div>
      <div class="qty-control">
        <button id="deQtyMinus" class="qty-btn"><i data-lucide="minus"></i></button>
        <div class="qty-display" id="deQtyDisplay">100<span class="qty-sub" id="deQtySub">gramas</span></div>
        <button id="deQtyPlus" class="qty-btn"><i data-lucide="plus"></i></button>
      </div>
      <div class="quick-qty" id="deQuickQty"></div>
    </div>

    <button id="deIncludeBtn" class="btn-gradient full" style="margin-top:12px;"><i data-lucide="plus"></i>Incluir alimento</button>
    <button class="modal-close" id="deDoneBtn">Concluído</button>
  `;
  overlay.classList.remove('hidden');
  icons();
  wireMenuOptionPicker();
}
export function closeMenuOptionPicker(){
  const overlay = document.getElementById('modalOverlay');
  const box = document.getElementById('modalBox');
  overlay.classList.add('hidden');
  box.classList.remove('modal-box-tall');
  box.innerHTML = '';
  render();
}
export function updateMeQtyUI(rebuildPresets){
  const food = menuEditor.selected;
  if(!food) return;
  const qtyDisplay = document.getElementById('deQtyDisplay');
  const qtySub = document.getElementById('deQtySub');
  const quickQty = document.getElementById('deQuickQty');
  qtyDisplay.childNodes[0].nodeValue = menuEditor.qty;
  qtySub.textContent = menuEditor.isUnit ? (menuEditor.qty===1?'unidade':'unidades') : (isBeverageFood(food) ? 'ml' : 'gramas');

  if(rebuildPresets){
    const presets = menuEditor.isUnit ? [1,2,3,4] : [50,100,150,200];
    quickQty.innerHTML = presets.map(p=>`<button class="quick-btn" data-qty="${p}">${p}${menuEditor.isUnit?' un':(isBeverageFood(food)?'ml':'g')}</button>`).join('');
  }
  quickQty.querySelectorAll('.quick-btn').forEach(b=>b.classList.toggle('active', parseFloat(b.dataset.qty)===menuEditor.qty));

  if(!menuEditor.macros) return;

  const gramsEquiv = menuEditor.isUnit ? menuEditor.qty*food.unitWeight : menuEditor.qty;
  const factor = gramsEquiv/100;
  const macros = menuEditor.macros;
  const ftMacros = document.getElementById('deMacros');
  ftMacros.children[0].firstElementChild.textContent = Math.round(macros.kcal*factor);
  ftMacros.children[1].firstElementChild.textContent = (Math.round(macros.protein*factor*10)/10)+'g';
  ftMacros.children[2].firstElementChild.textContent = (Math.round(macros.carbs*factor*10)/10)+'g';
  ftMacros.children[3].firstElementChild.textContent = (Math.round(macros.fat*factor*10)/10)+'g';
}
export function selectMeFood(food){
  menuEditor.selected = food;
  menuEditor.isUnit = !!food.unit;
  menuEditor.qty = food.unit ? 1 : 100;
  menuEditor.macros = {kcal:food.kcal, protein:food.protein, carbs:food.carbs, fat:food.fat};

  const ticket = document.getElementById('deTicket');
  if(!ticket) return;
  ticket.classList.add('show');
  document.getElementById('deName').textContent = food.name;
  const deCat = document.getElementById('deCat');
  deCat.textContent = food.category + (food.unit ? ' · medido por unidade' : (isBeverageFood(food) ? ' · medido por ml' : ' · medido por gramas'));
  deCat.classList.remove('loading');
  document.getElementById('deIcon').innerHTML = `<i data-lucide="${CATEGORY_ICONS[food.category] || 'utensils'}"></i>`;
  document.getElementById('deMacros').innerHTML = `
    <div class="ft-macro"><div class="fm-val">0</div><div class="fm-label">kcal</div></div>
    <div class="ft-macro"><div class="fm-val">0g</div><div class="fm-label">prot</div></div>
    <div class="ft-macro"><div class="fm-val">0g</div><div class="fm-label">carb</div></div>
    <div class="ft-macro"><div class="fm-val">0g</div><div class="fm-label">gord</div></div>
  `;
  updateMeQtyUI(true);
  icons();
}
export function clearMeFoodSelection(){
  menuEditor.selected = null;
  menuEditor.isUnit = false;
  menuEditor.qty = 100;
  menuEditor.macros = null;
  const ticket = document.getElementById('deTicket');
  if(ticket) ticket.classList.remove('show');
  const input = document.getElementById('deSearchInput');
  if(input) input.value = '';
}
export function wireMenuOptionPicker(){
  const searchInput = document.getElementById('deSearchInput');
  const dropdown = document.getElementById('deDropdown');

  searchInput.addEventListener('input', ()=>{
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
  });
  dropdown.addEventListener('click', (e)=>{
    const item = e.target.closest('.dropdown-item');
    if(!item) return;
    const id = parseInt(item.dataset.foodId,10);
    const food = FOOD_DB.find(f=>f.id===id);
    if(food){
      searchInput.value = food.name;
      dropdown.classList.add('hidden');
      selectMeFood(food);
    }
  });
  document.getElementById('modalBox').addEventListener('click', (e)=>{
    if(!e.target.closest('.search-wrap')) dropdown.classList.add('hidden');
  });

  document.getElementById('deQtyMinus').addEventListener('click', ()=>{
    if(!menuEditor.selected) return;
    const step = menuEditor.isUnit ? 1 : 10;
    const min = menuEditor.isUnit ? 1 : 10;
    menuEditor.qty = clamp(menuEditor.qty-step, min, 5000);
    updateMeQtyUI();
  });
  document.getElementById('deQtyPlus').addEventListener('click', ()=>{
    if(!menuEditor.selected) return;
    const step = menuEditor.isUnit ? 1 : 10;
    menuEditor.qty = clamp(menuEditor.qty+step, 1, 5000);
    updateMeQtyUI();
  });
  document.getElementById('deQuickQty').addEventListener('click', (e)=>{
    const btn = e.target.closest('.quick-btn');
    if(!btn || !menuEditor.selected) return;
    menuEditor.qty = parseFloat(btn.dataset.qty);
    updateMeQtyUI();
  });

  document.getElementById('deIncludeBtn').addEventListener('click', async ()=>{
    if(!menuEditor.selected){ showToast('Selecione um alimento primeiro'); return; }
    const f = menuEditor.selected;
    const macros = menuEditor.macros || {kcal:f.kcal, protein:f.protein, carbs:f.carbs, fat:f.fat};
    const gramsEquiv = menuEditor.isUnit ? menuEditor.qty*f.unitWeight : menuEditor.qty;
    const factor = gramsEquiv/100;
    store.state.cardapioUnico[menuEditor.mealType].push({
      uid: Date.now()+'_'+Math.random().toString(36).slice(2,7),
      name:f.name, category:f.category, grams:gramsEquiv, qty:menuEditor.qty, isUnit:menuEditor.isUnit,
      kcal:macros.kcal*factor, protein:macros.protein*factor, carbs:macros.carbs*factor, fat:macros.fat*factor,
      checked:false
    });
    showToast('Alimento incluído: '+f.name);
    await saveState();
    clearMeFoodSelection();
  });

  document.getElementById('deDoneBtn').addEventListener('click', closeMenuOptionPicker);
  const overlayEl = document.getElementById('modalOverlay');
  overlayEl.onclick = (e)=>{ if(e.target===overlayEl) closeMenuOptionPicker(); };
}

export function wireCardapio(){
  document.querySelectorAll('.menu-meal-card').forEach(card=>{
    card.addEventListener('click', async (e)=>{
      const toggleBtn = e.target.closest('[data-toggle-menu]');
      if(toggleBtn){
        const mt = toggleBtn.dataset.toggleMenu;
        cardapioViewExpanded[mt] = !cardapioViewExpanded[mt];
        render();
        return;
      }

      const addFoodBtn = e.target.closest('[data-add-food]');
      if(addFoodBtn){ openMenuOptionPicker(addFoodBtn.dataset.addFood); return; }

      const saveBtn = e.target.closest('[data-save-meal]');
      if(saveBtn){
        const mt = saveBtn.dataset.saveMeal;
        store.state.cardapioSalvo[mt] = true;
        cardapioEditingState[mt] = false;
        await saveState();
        render();
        showToast(MEAL_LABELS[mt]+' salvo no cardápio!');
        return;
      }

      const editBtn = e.target.closest('[data-edit-meal]');
      if(editBtn){
        cardapioEditingState[editBtn.dataset.editMeal] = true;
        render();
        return;
      }

      const removeBtn = e.target.closest('[data-remove-food]');
      if(removeBtn){
        const mt = removeBtn.dataset.meal, uid = removeBtn.dataset.removeFood;
        store.state.cardapioUnico[mt] = store.state.cardapioUnico[mt].filter(it=>it.uid!==uid);
        await saveState();
        render();
        return;
      }

      const row = e.target.closest('[data-toggle-food]');
      if(row){
        const mt = row.dataset.meal, uid = row.dataset.toggleFood;
        const item = store.state.cardapioUnico[mt].find(it=>it.uid===uid);
        item.checked = !item.checked;
        await saveState();
        render();
      }
    });
  });
}
