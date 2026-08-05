/* Barra de navegação inferior com efeito de bolha flutuante + recorte animado (notch),
   seguindo a cor do perfil ativo (var(--accent)). */

const R = 24;         // raio dos cantos da barra
const NOTCH_R = 30;   // raio do "buraco" ao redor da bolha
const DEPTH = 30;     // profundidade do afundamento
const LEAD_IN = 16;   // trecho reto antes da curva começar a afundar

let currentX = 0;
let targetX = 0;
let w = 0, h = 0;
let rafStarted = false;

function clampX(){
  const minX = R + NOTCH_R + LEAD_IN;
  const maxX = w - R - NOTCH_R - LEAD_IN;
  return Math.min(Math.max(targetX, minX), maxX);
}

function buildPath(notchX){
  const nx1 = notchX - NOTCH_R;
  const nx2 = notchX + NOTCH_R;
  return `
    M ${R},0
    L ${nx1 - LEAD_IN},0
    C ${nx1},0 ${nx1},${DEPTH} ${notchX},${DEPTH}
    C ${nx2},${DEPTH} ${nx2},0 ${nx2 + LEAD_IN},0
    L ${w - R},0
    Q ${w},0 ${w},${R}
    L ${w},${h - R}
    Q ${w},${h} ${w - R},${h}
    L ${R},${h}
    Q 0,${h} 0,${h - R}
    L 0,${R}
    Q 0,0 ${R},0
    Z
  `;
}

function resize(){
  const wrap = document.getElementById('navWrap');
  if(!wrap) return;
  w = wrap.offsetWidth;
  h = wrap.offsetHeight;
  const svg = document.getElementById('navBg');
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
}

function moveTo(el){
  const wrap = document.getElementById('navWrap');
  const bubble = document.getElementById('navBubble');
  if(!wrap || !bubble || !el) return;
  const navRect = wrap.getBoundingClientRect();
  const itemRect = el.getBoundingClientRect();
  targetX = itemRect.left - navRect.left + itemRect.width/2;
  const centerX = clampX();
  bubble.style.left = (centerX - bubble.offsetWidth/2) + 'px';
}

function animate(){
  const path = document.getElementById('navPath');
  if(path){
    currentX += (clampX() - currentX) * 0.18;
    path.setAttribute('d', buildPath(currentX));
  }
  requestAnimationFrame(animate);
}

export function updateNavBar(activeTab){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active', b.dataset.tab===activeTab));
  const active = document.querySelector('.nav-item.active');
  if(active) moveTo(active);
}

export function initNavBar(activeTab){
  resize();
  updateNavBar(activeTab);
  currentX = targetX; // sem animar na primeira carga
  if(!rafStarted){ rafStarted = true; requestAnimationFrame(animate); }
  window.addEventListener('resize', ()=>{
    resize();
    const active = document.querySelector('.nav-item.active');
    if(active) moveTo(active);
  });
}
