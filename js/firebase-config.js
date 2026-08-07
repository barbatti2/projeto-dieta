import { icons, showToast } from './utils.js';

/* Configuração e conexão automática com o Firestore (sincronização na nuvem). */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAd6s6CIJN25EHLFUg8fDdSKOMalcZvpEg",
  authDomain: "nutri-b9074.firebaseapp.com",
  projectId: "nutri-b9074",
  storageBucket: "nutri-b9074.firebasestorage.app",
  messagingSenderId: "480936579666",
  appId: "1:480936579666:web:770b5759b52a0bdec4058b"
};

export function firebaseConfigProvided(){
  return !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
}
export function loadFirebaseSDK(){
  if(window.firebase && window.firebase.firestore && window.firebase.auth) return Promise.resolve();
  return new Promise((resolve, reject)=>{
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
    s1.onload = ()=>{
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
      s2.onload = ()=>{
        const s3 = document.createElement('script');
        s3.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
        s3.onload = resolve;
        s3.onerror = reject;
        document.head.appendChild(s3);
      };
      s2.onerror = reject;
      document.head.appendChild(s2);
    };
    s1.onerror = reject;
    document.head.appendChild(s1);
  });
}
export async function autoConnectFirestore(){
  if(!firebaseConfigProvided()){ window.__firestoreReady = false; updateSyncStatusUI(); return; }
  try{
    await loadFirebaseSDK();
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    window.__db = firebase.firestore();
    // Sign in anonymously so Firestore security rules can safely require
    // `request.auth != null` — this happens silently, with no extra login
    // screen for Gabriel/Raissa (their only login is the password gate).
    // We only mark Firestore as "ready" if this succeeds — otherwise every
    // read/write would silently fail with permission-denied while the app
    // still claimed to be connected.
    await firebase.auth().signInAnonymously();
    window.__firestoreReady = true;
  }catch(e){
    console.error('Firestore/Auth não conectou — verifique: 1) "Anonymous" habilitado em Authentication > Sign-in method, 2) o domínio atual em Authentication > Settings > Authorized domains, 3) as regras do Firestore.', e);
    window.__firestoreReady = false;
  }
  updateSyncStatusUI();
  console.log('[NutriRing] Firestore pronto?', window.__firestoreReady);
}
export function reportFirestoreError(e){
  console.error('Erro de sincronização com o Firestore', e);
  if(!window.__firestoreErrorShown){
    window.__firestoreErrorShown = true;
    showToast('Não sincronizou com o Firestore — confira as regras de segurança do projeto.');
  }
}
export function updateSyncStatusUI(){
  const wrap = document.getElementById('syncStatus');
  const icon = document.getElementById('syncIcon');
  if(!wrap || !icon) return;
  wrap.classList.toggle('on', !!window.__firestoreReady);
  icon.setAttribute('data-lucide', window.__firestoreReady ? 'cloud-check' : 'cloud-off');
  icons();
}
