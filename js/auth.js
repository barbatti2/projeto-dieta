import { startApp } from './app.js';
import { icons } from './utils.js';

/* ============================================================
   LOGIN GATE
   ============================================================ */
export const APP_PASSWORD_HASH = "fe47d3f52122243998056618c7146e35ece42d79d1e3a0bbbdc66d5ca2b17cb3";

// Sessão de login: depois de entrar com a senha uma vez, fica logado por 24h
// (guardado no localStorage do navegador). Passado esse prazo, pede a senha de novo.
export const AUTH_SESSION_KEY = 'dietapro_auth_until';
export const AUTH_SESSION_MS = 24 * 60 * 60 * 1000; // 24 horas

export function hasValidSession(){
  try{
    const until = parseInt(localStorage.getItem(AUTH_SESSION_KEY), 10);
    return !isNaN(until) && Date.now() < until;
  }catch(e){ return false; }
}
export function startSession(){
  try{ localStorage.setItem(AUTH_SESSION_KEY, String(Date.now() + AUTH_SESSION_MS)); }catch(e){}
}

export async function sha256Hex(text){
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export function wireLogin(){
  const input = document.getElementById('loginPasswordInput');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const errorEl = document.getElementById('loginError');
  const card = document.getElementById('loginCard');
  const eyeBtn = document.getElementById('toggleEyeBtn');

  async function tryLogin(){
    const hash = await sha256Hex(input.value);
    if(hash === APP_PASSWORD_HASH){
      startSession();
      document.getElementById('loginScreen').style.display = 'none';
      startApp();
    } else {
      errorEl.classList.remove('hidden');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    }
  }
  submitBtn.addEventListener('click', tryLogin);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') tryLogin(); });
  eyeBtn.addEventListener('click', ()=>{
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    eyeBtn.innerHTML = `<i data-lucide="${isPwd?'eye-off':'eye'}"></i>`;
    icons();
  });
}
