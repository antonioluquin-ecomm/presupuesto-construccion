/* ============================================================
   PRESUPUESTO & CONTABILIDAD DE OBRA — app.js
   Comunicación con Apps Script + modo demo local (mock) + utilidades.
   Nunca hacer fetch() directo en los módulos: usar estos helpers.
   ============================================================ */

'use strict';

/* ─── UTILIDADES UI ──────────────────────────────────────── */

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setStatus(elId, msg, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = 'status-bar' + (type ? ' ' + type : '');
  el.textContent = msg;
}

function toast(icon, msg, type) {
  let wrap = document.getElementById('toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.innerHTML = '<span>' + escapeHtml(icon) + '</span><span>' + escapeHtml(msg) + '</span>';
  wrap.appendChild(t);
  setTimeout(function () { t.remove(); }, 3200);
}

function normalizeText(v) {
  return String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/* ─── NÚMEROS Y FECHAS ───────────────────────────────────── */

// Parseo tolerante (acepta "1.234,56", "1234.56", vacío).
function n(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
  return isFinite(Number(s)) ? Number(s) : 0;
}
function num(v)   { return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(Number(v || 0)); }
function money(v) {
  const cur = /^[A-Z]{3}$/.test(CFG.moneda) ? CFG.moneda : 'ARS';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Number(v || 0));
}
function pct(v)   { return num(Math.round(Number(v || 0) * 10) / 10) + '%'; }
function hoy()    { return new Date().toISOString().slice(0, 10); }
function fmtFecha(d) { if (!d) return '—'; const x = new Date(String(d).slice(0, 10) + 'T12:00:00'); return isNaN(x) ? '—' : x.toLocaleDateString('es-AR'); }

/* ─── CSV ────────────────────────────────────────────────── */

function csvEscape(value) {
  const str = String(value == null ? '' : value).replace(/"/g, '""');
  return /[,;\n"]/.test(str) ? '"' + str + '"' : str;
}
function downloadCSV(filename, rows) {
  const content = rows.map(function (r) { return r.map(csvEscape).join(','); }).join('\n');
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── CÁLCULOS DE DOMINIO ────────────────────────────────── */

// Enriquece una partida con sus movimientos: ejecutado, pagado, teórico, desvío, %.
function enrichPartida(partida) {
  const movs = STATE.movimientos.filter(function (m) { return String(m.id_partida) === String(partida.id) && m.estado !== 'Cancelado'; });
  const avances = movs.filter(function (m) { return m.tipo_movimiento === 'Avance' || m.tipo_movimiento === 'Ajuste'; });
  const ejec   = avances.reduce(function (a, m) { return a + n(m.cantidad_ejecutada); }, 0);
  const pagado = movs.reduce(function (a, m) { return a + n(m.importe_pagado); }, 0);
  const cant = n(partida.cantidad_presupuestada);
  const pu   = n(partida.costo_unitario);
  const total   = cant * pu;
  const avancePct = cant > 0 ? Math.min(ejec / cant * 100, 100) : 0;
  const teorico = ejec * pu;                 // valor real ejecutado (lo que "vale" lo hecho)
  const desvio  = pagado - teorico;          // > 0 pagué de más, < 0 pagué de menos
  return Object.assign({}, partida, { ejec: ejec, pagado: pagado, total: total, avancePct: avancePct, teorico: teorico, desvio: desvio, movs: movs });
}

// Agregados globales para el dashboard.
function calcResumen() {
  const activas = STATE.partidas.filter(function (p) { return p.estado !== 'Cancelada'; });
  const en = activas.map(enrichPartida);
  const mat = en.filter(function (i) { return i.tipo === 'Material'; });
  const mo  = en.filter(function (i) { return i.tipo === 'Mano de obra'; });

  // Pagos globales de MO (sin partida asociada) — pagos semanales al albañil por oficio.
  const globalMovs = STATE.movimientos.filter(function (m) {
    return (!m.id_partida || m.id_partida === '') && n(m.importe_pagado) > 0 && m.estado !== 'Cancelado';
  });
  const globalPagos = globalMovs.reduce(function (a, m) { return a + n(m.importe_pagado); }, 0);

  const matPresup = mat.reduce(function (a, i) { return a + i.total; }, 0);
  const matPagado = mat.reduce(function (a, i) { return a + i.pagado; }, 0);
  const moPresup  = mo.reduce(function (a, i) { return a + i.total; }, 0);
  const moTeorico = mo.reduce(function (a, i) { return a + i.teorico; }, 0);
  const moPagado  = mo.reduce(function (a, i) { return a + i.pagado; }, 0) + globalPagos;

  // Desglose por oficio: presupuestado / teórico / pagado.
  const oficios = {};
  function bucket(o) { if (!oficios[o]) oficios[o] = { presup: 0, teorico: 0, pagado: 0 }; return oficios[o]; }
  mo.forEach(function (i) { const b = bucket(i.oficio || 'Sin oficio'); b.presup += i.total; b.teorico += i.teorico; b.pagado += i.pagado; });
  globalMovs.forEach(function (m) { bucket(m.oficio || 'Sin oficio').pagado += n(m.importe_pagado); });

  const totalPresup = matPresup + moPresup;
  const totalPagado = matPagado + moPagado;
  const totalTeorico = matPagado + moTeorico;   // material: lo pagado ya es su valor real
  const fondos = STATE.config ? n(STATE.config.fondos_asignados) : 0;
  const ejecPct = fondos > 0 ? totalPagado / fondos * 100 : 0;

  return {
    en: en, mat: mat, mo: mo,
    matPresup: matPresup, matPagado: matPagado,
    moPresup: moPresup, moTeorico: moTeorico, moPagado: moPagado, globalPagos: globalPagos,
    oficios: oficios,
    totalPresup: totalPresup, totalPagado: totalPagado, totalTeorico: totalTeorico,
    fondos: fondos, ejecPct: ejecPct, restante: fondos - totalPagado,
  };
}

/* ─── CARGA INICIAL ──────────────────────────────────────── */

let _mockLoaded = false;

async function loadInitialData() {
  if (CFG.isMock()) {
    if (!_mockLoaded) {
      const base = _assetBase();
      const r = await fetch(base + 'src/data/demo.json');
      const j = await r.json();
      STATE.config      = j.config || {};
      STATE.partidas    = j.partidas || [];
      STATE.movimientos = j.movimientos || [];
      _mockLoaded = true;
    }
    _setMode('demo');
    return;
  }
  const data = await apiGet('getInitialData');
  STATE.config      = data.config || {};
  STATE.partidas    = data.partidas || [];
  STATE.movimientos = data.movimientos || [];
  if (data.catalogos) STATE.catalogos = data.catalogos;
  _setMode('live');
}

function _assetBase() {
  const tag = document.querySelector('script[src*="config.js"]');
  if (tag) return tag.getAttribute('src').replace('config.js', '');
  return '';
}

function _setMode(mode) {
  const el = document.getElementById('modeIndicator');
  if (!el) return;
  el.innerHTML = mode === 'live'
    ? '<span class="mode-dot live"></span>Conectado a Google Sheets'
    : '<span class="mode-dot demo"></span>Modo demo (datos locales)';
}

/* ─── LLAMADAS AL BACKEND ────────────────────────────────── */

async function apiGet(action) {
  const res = await fetch(CFG.apiUrl + '?action=' + encodeURIComponent(action));
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Error');
  return json.data;
}

// Ejecuta una acción de escritura. Devuelve el registro afectado y actualiza STATE local.
async function callApi(action, payload) {
  payload = payload || {};
  let rec;
  if (CFG.isMock()) {
    rec = _mockMutate(action, payload);
  } else {
    const res = await fetch(CFG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, params: payload }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error');
    rec = json.data;
  }
  _applyLocal(action, payload, rec);
  return rec;
}

function _nextId(arr) { return arr.reduce(function (m, x) { return Math.max(m, Number(x.id) || 0); }, 0) + 1; }

// En modo demo construye el registro resultante (asigna id, defaults).
function _mockMutate(action, p) {
  switch (action) {
    case 'createPartida':
      return Object.assign({ id: _nextId(STATE.partidas), estado: 'Activa' }, p);
    case 'updatePartida':
      return Object.assign({}, STATE.partidas.find(function (x) { return String(x.id) === String(p.id); }), p);
    case 'deletePartida':
      return { id: p.id, estado: 'Cancelada' };
    case 'createMovimiento':
      return Object.assign({ id: _nextId(STATE.movimientos), estado: 'Activo' }, p);
    case 'updateMovimiento':
      return Object.assign({}, STATE.movimientos.find(function (x) { return String(x.id) === String(p.id); }), p);
    case 'deleteMovimiento':
      return { id: p.id };
    case 'updateConfig':
      return Object.assign({}, STATE.config, p);
    default:
      return p;
  }
}

// Aplica el resultado al STATE local (igual en demo y en vivo, para UI instantánea).
function _applyLocal(action, p, rec) {
  const partIdx = function (id) { return STATE.partidas.findIndex(function (x) { return String(x.id) === String(id); }); };
  const movIdx  = function (id) { return STATE.movimientos.findIndex(function (x) { return String(x.id) === String(id); }); };
  switch (action) {
    case 'createPartida':  STATE.partidas.push(rec); break;
    case 'updatePartida':  { const i = partIdx(rec.id); if (i >= 0) STATE.partidas[i] = Object.assign(STATE.partidas[i], rec); break; }
    case 'deletePartida':  { const i = partIdx(p.id); if (i >= 0) STATE.partidas[i].estado = 'Cancelada'; break; }
    case 'createMovimiento': STATE.movimientos.push(rec); break;
    case 'updateMovimiento': { const i = movIdx(rec.id); if (i >= 0) STATE.movimientos[i] = Object.assign(STATE.movimientos[i], rec); break; }
    case 'deleteMovimiento': { const i = movIdx(p.id); if (i >= 0) STATE.movimientos.splice(i, 1); break; }
    case 'updateConfig':   STATE.config = Object.assign(STATE.config || {}, rec); break;
  }
}

/* ─── HELPERS DE DOMINIO (azúcar) ────────────────────────── */

function apiCreatePartida(d)   { return callApi('createPartida', d); }
function apiUpdatePartida(d)   { return callApi('updatePartida', d); }
function apiDeletePartida(id)  { return callApi('deletePartida', { id: id }); }
function apiCreateMovimiento(d){ return callApi('createMovimiento', d); }
function apiUpdateMovimiento(d){ return callApi('updateMovimiento', d); }
function apiDeleteMovimiento(id){ return callApi('deleteMovimiento', { id: id }); }
function apiUpdateConfig(d)    { return callApi('updateConfig', d); }
