import { hasValidSession, wireLogin } from './auth.js';
import { autoConnectFirestore, firebaseConfigProvided } from './firebase-config.js';
import { loadProfile, store } from './state.js';
import { render, setupDateStripDrag, setupProfileSlider } from './ui-core.js';
import { icons, showToast } from './utils.js';

/* Ponto de entrada: liga a navegação por abas e inicia o app após o login. */
document.getElementById('tabNav').addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  store.currentTab = btn.dataset.tab;
  render();
});

/* ============================================================
   APP START (runs after successful login)
   ============================================================ */
export async function startApp(){
  document.getElementById('loadingScreen').style.display = 'flex';
  await autoConnectFirestore();
  await loadProfile('gabriel');
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  setupProfileSlider();
  setupDateStripDrag();
  icons();
  if(firebaseConfigProvided() && !window.__firestoreReady){
    showToast('Não conectou ao Firestore — os dados ficam salvos só nesta sessão. Veja o console (F12) para o motivo.');
  }
}

wireLogin();
icons();
if(hasValidSession()){
  document.getElementById('loginScreen').style.display = 'none';
  startApp();
}
