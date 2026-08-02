import { reportFirestoreError } from './firebase-config.js';
import { render } from './ui-core.js';
import { todayStr } from './utils.js';

/* Estado global do app (store), forma padrão dos dados e leitura/gravação (localStorage + Firestore). */
export const store = {
  currentProfile: 'gabriel',
  state: null,
  currentTab: 'inicio',
  calendarViewDate: new Date(),
  historicoFilter: 'dia',
  homeViewDate: todayStr(),
  homeMealsExpanded: false,
  homeCalendarViewDate: new Date()
};

export const PROFILE_NAMES = {gabriel:'Gabriel', raissa:'Raissa'};
export const MEAL_LABELS = {cafe_manha:'Café da manhã', almoco:'Almoço', cafe_tarde:'Café da tarde', jantar:'Jantar'};
export const MEAL_ICONS = {cafe_manha:'sunrise', almoco:'sun', cafe_tarde:'coffee', jantar:'moon'};
export const MARK_INFO = {
  dieta_treino: {label:'Dieta + Treino', cls:'mark-dieta_treino', icon:'dumbbell'},
  dieta: {label:'Só Dieta', cls:'mark-dieta', icon:'salad'},
  treino: {label:'Só Treino', cls:'mark-treino', icon:'dumbbell'}
};
export const TAB_META = {
  inicio: {title:'Início', subtitle:'Resumo de hoje', icon:'home'},
  adicionar: {title:'Adicionar alimento', subtitle:'Monte sua refeição', icon:'plus'},
  cardapio: {title:'Cardápio', subtitle:'Seu cardápio, com opções por categoria', icon:'book-open'},
  calendario: {title:'Calendário', subtitle:'Planeje seus dias', icon:'calendar-days'},
  historico: {title:'Histórico', subtitle:'Tudo que você registrou', icon:'history'},
  pesos: {title:'Perfil', subtitle:'Metas, evolução e calendário', icon:'user-round'}
};

export function emptyMenuMeal(){ return []; } // array de slots: {id, categoria, options:[...]}
export function defaultCardapioUnico(){
  return {
    cafe_manha: emptyMenuMeal(),
    almoco: emptyMenuMeal(),
    cafe_tarde: emptyMenuMeal(),
    jantar: emptyMenuMeal()
  };
}

export const histExpandedDays = {};
export const addFoodState = {qty:100, isUnit:false, mealType:'cafe_manha', selected:null, itemsToSave:[], macros:null, activeCategory:'Todos'};
// menuEditor: estado da tela (bottom sheet) de edição de uma refeição do cardápio único
export const menuEditor = {
  mealType:null, slotId:null, selected:null, isUnit:false, qty:100, macros:null
};
export const profileCache = {};

export function defaultCardapioSalvo(){
  return {cafe_manha:false, almoco:false, cafe_tarde:false, jantar:false};
}
export function defaultState(){
  return {
    meals: [],
    calendarMarks: {},
    weight: {initial:null, history:[]},
    goals: {calorias:2000, proteina:150, carboidratos:250},
    cardapioUnico: defaultCardapioUnico(),
    cardapioSalvo: defaultCardapioSalvo()
  };
}
export function ensureStateShape(s){
  if(!s) return;
  if(!s.cardapioUnico){
    // migra estrutura antiga (por dia da semana), se existir, para o cardápio único (lista simples)
    if(s.cardapioSemanal){
      const merged = defaultCardapioUnico();
      Object.keys(s.cardapioSemanal).forEach(dayKey=>{
        const dayMeals = s.cardapioSemanal[dayKey];
        Object.keys(MEAL_LABELS).forEach(mt=>{
          (dayMeals[mt]||[]).forEach(item=>{
            merged[mt].push({
              uid: item.uid || (Date.now()+'_'+Math.random().toString(36).slice(2,7)),
              name:item.name, category:item.category, grams:item.grams, qty:item.qty, isUnit:item.isUnit,
              kcal:item.kcal, protein:item.protein, carbs:item.carbs, fat:item.fat, checked:false
            });
          });
        });
      });
      s.cardapioUnico = merged;
      delete s.cardapioSemanal;
    } else {
      s.cardapioUnico = defaultCardapioUnico();
    }
  } else {
    // migra formato antigo (categorias/slots com alternativas) para lista simples de alimentos
    Object.keys(MEAL_LABELS).forEach(mt=>{
      if(!s.cardapioUnico[mt]) { s.cardapioUnico[mt] = emptyMenuMeal(); return; }
      const arr = s.cardapioUnico[mt];
      const hasSlots = arr.some(entry=>entry && Array.isArray(entry.options));
      if(hasSlots){
        const flat = [];
        arr.forEach(slot=>{
          (slot.options||[]).forEach(opt=>{
            flat.push({
              uid: opt.uid || (Date.now()+'_'+Math.random().toString(36).slice(2,7)),
              name:opt.name, category:opt.category, grams:opt.grams, qty:opt.qty, isUnit:opt.isUnit,
              kcal:opt.kcal, protein:opt.protein, carbs:opt.carbs, fat:opt.fat, checked:false
            });
          });
        });
        s.cardapioUnico[mt] = flat;
      } else {
        arr.forEach(item=>{ if(typeof item.checked!=='boolean') item.checked=false; });
      }
    });
  }
  if(!s.meals) s.meals = [];
  if(!s.calendarMarks) s.calendarMarks = {};
  if(!s.weight) s.weight = {initial:null, history:[]};
  if(!s.goals) s.goals = {calorias:2000, proteina:150, carboidratos:250};
  if(!s.cardapioSalvo){
    // primeira vez com esse campo: considera "já salvo" qualquer refeição que já tinha
    // algum alimento marcado em versões anteriores, pra não perder o que a pessoa já tinha escolhido
    s.cardapioSalvo = defaultCardapioSalvo();
    Object.keys(MEAL_LABELS).forEach(mt=>{
      if((s.cardapioUnico[mt]||[]).some(it=>it.checked)) s.cardapioSalvo[mt] = true;
    });
  } else {
    Object.keys(MEAL_LABELS).forEach(mt=>{ if(typeof s.cardapioSalvo[mt]!=='boolean') s.cardapioSalvo[mt]=false; });
  }
}

export function hasLocalStorage(){
  return typeof window.storage !== 'undefined' && window.storage !== null;
}
export async function loadProfile(profile){
  store.currentProfile = profile;
  document.body.setAttribute('data-profile', profile);
  if(profileCache[profile]){
    store.state = profileCache[profile];
    render();
    return;
  }
  // Firestore is the source of truth when connected; window.storage (only available
  // inside Claude's own artifact runtime) is just an extra offline cache when present.
  if(window.__firestoreReady){
    try{
      console.log('[NutriRing] Buscando perfil no Firestore:', profile);
      const doc = await window.__db.collection('nutriring').doc(profile).get();
      console.log('[NutriRing] Documento existe?', doc.exists, doc.exists ? doc.data() : null);
      if(doc.exists){
        store.state = doc.data();
        profileCache[profile] = store.state;
        if(hasLocalStorage()){
          window.storage.set('nutriring_'+profile, JSON.stringify(store.state), false).catch(()=>{});
        }
        render();
        return;
      }
    }catch(e){ reportFirestoreError(e); }
  }
  if(hasLocalStorage()){
    try{
      const res = await window.storage.get('nutriring_'+profile, false);
      store.state = res && res.value ? JSON.parse(res.value) : defaultState();
    }catch(e){
      store.state = defaultState();
    }
  } else {
    store.state = defaultState();
  }
  profileCache[profile] = store.state;
  render();
}
export async function saveState(){
  // keep the in-memory cache authoritative immediately so switching tabs/profiles
  // never shows stale data even if a network write is slow or briefly fails.
  profileCache[store.currentProfile] = store.state;
  if(hasLocalStorage()){
    try{
      const result = await window.storage.set('nutriring_'+store.currentProfile, JSON.stringify(store.state), false);
      if(!result){
        await window.storage.set('nutriring_'+store.currentProfile, JSON.stringify(store.state), false);
      }
    }catch(e){
      console.error('Erro ao salvar localmente', e);
    }
  }
  if(window.__firestoreReady){
    try{ await window.__db.collection('nutriring').doc(store.currentProfile).set(store.state); }
    catch(e){ reportFirestoreError(e); }
  }
}
