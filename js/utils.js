/* Funções utilitárias genéricas: datas, formatação, toast e ícones. */
/* ============================================================
   NUTRIRING — APP LOGIC
   ============================================================ */

/* ---------- helpers ---------- */
export function normalize(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
export function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
export function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function todayStr(){
  return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
}
export function nowBRTime(){
  return new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date());
}
export function addDays(dateStr, delta){
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0,10);
}
export function fmtDateLong(dateStr){
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('pt-BR', {timeZone:'UTC', day:'2-digit', month:'long', year:'numeric'}).format(d);
}
export function fmtDateShort(dateStr){
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('pt-BR', {timeZone:'UTC', day:'2-digit', month:'2-digit'}).format(d);
}
export function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}
export function icons(){ if(window.lucide) lucide.createIcons(); }
