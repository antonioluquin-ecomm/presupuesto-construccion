/* ============================================================
   PRESUPUESTO & CONTABILIDAD DE OBRA — config.js
   Configuración global, constantes, estado y theme.
   Cargar primero, antes de app.js y los módulos de src/js/.
   ============================================================ */

'use strict';

/* ─── VERSIÓN ─────────────────────────────────────────────── */

const VERSION = {
  number: '1.0.0',
  date:   '2026-07-08',
  notes:  'Versión inicial: migración del Excel/HTML "todo en uno" al estándar del ecosistema (SPA + GAS + Sheets). Secciones Resumen / Partidas / Pagos / Configuración, tema terracota, modo demo con datos migrados.',
};

const CHANGELOG = [
  { v: '1.0.0', date: '2026-07-08', desc: 'Versión inicial. Se reemplaza el index.html monolítico (1.548 líneas) por un proyecto estructurado según el estándar: index.html (shell SPA) + config.js + app.js + src/css/main.css + módulos src/js/. Backend Apps Script (router, CRUD de partidas y movimientos, dashboard, migración). Dominio: partidas presupuestadas (Material / Mano de obra con costo_unitario) y movimientos (Pago / Avance / Ajuste) para medir valor real (teórico) vs pagado y su desvío. Datos del Excel migrados como semilla demo.' },
];

function initVersionBadge() {
  const span    = document.getElementById('sidebarVersion');
  const btn     = document.getElementById('sidebarVersionBtn');
  const popover = document.getElementById('versionPopover');
  if (!span) return;
  span.textContent = `v${VERSION.number}`;
  if (!btn || !popover || !CHANGELOG.length) return;
  popover.innerHTML =
    '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding-bottom:8px;margin-bottom:10px;border-bottom:1px solid var(--sidebar-line)">Historial de cambios</div>'
    + CHANGELOG.map(c =>
      `<div style="margin-bottom:8px;">`
      + `<span style="font-weight:600;font-size:13px;">v${c.v}</span>`
      + `<span style="color:var(--muted);font-size:11px;margin-left:6px;">${c.date}</span>`
      + `<div style="font-size:12px;margin-top:2px;line-height:1.4;">${c.desc}</div>`
      + `</div>`
    ).join('');
  btn.style.cursor = 'pointer';
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    popover.style.display = popover.style.display !== 'none' ? 'none' : 'block';
  });
  document.addEventListener('click', function () { popover.style.display = 'none'; });
}

/* ─── DOMINIOS (espejo de apps-script/Config.gs) ──────────── */

const TIPOS_PARTIDA   = ['Material', 'Mano de obra'];
const TIPOS_MOVIMIENTO = ['Pago', 'Avance', 'Ajuste'];
const OFICIOS         = ['Albañilería', 'Plomería', 'Electricidad', 'Herrería', 'Pintura', 'Otro'];
const MEDIOS_PAGO     = ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Cheque', 'Otro'];
const SECTORES        = ['General', 'Frente', 'Portones', 'Estructura', 'Instalaciones', 'Imprevistos'];

// Colores/clase por oficio (definidos como variables CSS en main.css).
const OFICIO_META = {
  'Albañilería': { cls: 'pill-alb', varc: '--alb', icon: '🧱' },
  'Plomería':    { cls: 'pill-plo', varc: '--plo', icon: '🔧' },
  'Electricidad':{ cls: 'pill-ele', varc: '--ele', icon: '⚡' },
  'Herrería':    { cls: 'pill-her', varc: '--her', icon: '🔩' },
  'Pintura':     { cls: 'pill-muted', varc: '--primary', icon: '🎨' },
  'Otro':        { cls: 'pill-muted', varc: '--primary', icon: '🛠️' },
};
function oficioMeta(o) { return OFICIO_META[o] || { cls: 'pill-muted', varc: '--primary', icon: '•' }; }

/* ─── ESTADO GLOBAL ───────────────────────────────────────── */

const STATE = {
  config:      null,   // meta del proyecto (nombre, fondos, moneda…)
  partidas:    [],     // ítems presupuestados
  movimientos: [],     // pagos / avances / ajustes
  catalogos:   { oficios: OFICIOS.slice(), medios_pago: MEDIOS_PAGO.slice(), sectores: SECTORES.slice() },
  ui:          { partidaTab: 'Material', pagoTipo: 'material' },
};

/* ─── CONFIG (localStorage) ───────────────────────────────── */

// URL canónica del Web App de Apps Script. Pegá acá la URL del deploy para que la app
// funcione out-of-the-box; vacío = modo demo (src/data/demo.json).
const APPS_SCRIPT_URL = '';

const CFG = {
  get apiUrl()  { return localStorage.getItem('obra_api_url') || APPS_SCRIPT_URL; },
  set apiUrl(v) { if (v) { localStorage.setItem('obra_api_url', v); } else { localStorage.removeItem('obra_api_url'); } },

  get moneda()  { return localStorage.getItem('obra_moneda') || (STATE.config && STATE.config.moneda) || 'ARS'; },
  set moneda(v) { if (v) localStorage.setItem('obra_moneda', v); },

  isMock() {
    if (localStorage.getItem('obra_demo') === '1') return true;
    if (/[?&]demo=1\b/.test(location.search)) return true;
    return !this.apiUrl;
  },
};

/* ─── THEME ───────────────────────────────────────────────── */

const THEME_KEY = 'obra_theme';

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function _updateThemeToggles(theme) {
  const t = theme || getCurrentTheme();
  const isLight = t === 'light';
  document.querySelectorAll('.th-icon').forEach(function (el) { el.textContent = isLight ? '☾' : '☀'; });
}

function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  _updateThemeToggles(next);
}

function toggleTheme() { setTheme(getCurrentTheme() === 'light' ? 'dark' : 'light'); }

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY)
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(saved);
}
