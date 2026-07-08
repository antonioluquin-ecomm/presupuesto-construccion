/* ============================================================
   Sección PAGOS Y AVANCES — alta de movimientos + listado.
   Tres formularios: compra de material, pago de mano de obra, avance de obra.
   ============================================================ */
'use strict';

let _pagosBound = false;

function renderPagos() {
  if (!_pagosBound) {
    document.querySelectorAll('#pagoTabs .tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        STATE.ui.pagoTipo = b.dataset.pgtab;
        document.querySelectorAll('#pagoTabs .tab-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderPagoForm();
      });
    });
    document.getElementById('movsSearch').addEventListener('input', renderMovsTable);
    document.getElementById('movsFiltroTipo').addEventListener('change', renderMovsTable);
    document.getElementById('movsFiltroOficio').addEventListener('change', renderMovsTable);
    document.getElementById('movsExport').addEventListener('click', exportMovs);
    _pagosBound = true;
  }
  document.querySelectorAll('#pagoTabs .tab-btn').forEach(function (x) { x.classList.toggle('active', x.dataset.pgtab === STATE.ui.pagoTipo); });
  // filtro de oficio
  const sel = document.getElementById('movsFiltroOficio');
  sel.innerHTML = '<option value="">Todos los oficios</option>' + STATE.catalogos.oficios.map(function (o) { return '<option>' + escapeHtml(o) + '</option>'; }).join('');
  renderPagoForm();
  renderMovsTable();
}

function _materialOpts() {
  return STATE.partidas.filter(function (p) { return p.estado !== 'Cancelada' && p.tipo === 'Material'; })
    .map(function (p) { return '<option value="' + p.id + '">' + escapeHtml(p.concepto) + ' (' + num(p.cantidad_presupuestada) + ' ' + escapeHtml(p.unidad || '') + ')</option>'; }).join('');
}
function _moOpts() {
  return STATE.partidas.filter(function (p) { return p.estado !== 'Cancelada' && p.tipo === 'Mano de obra'; })
    .map(function (p) { return '<option value="' + p.id + '">' + escapeHtml(p.concepto) + ' — ' + escapeHtml(p.oficio || '') + '</option>'; }).join('');
}
function _oficiosOpts() { return STATE.catalogos.oficios.map(function (o) { return '<option>' + escapeHtml(o) + '</option>'; }).join(''); }
function _mediosOpts() { return STATE.catalogos.medios_pago.map(function (m) { return '<option>' + escapeHtml(m) + '</option>'; }).join(''); }

function renderPagoForm() {
  const c = document.getElementById('pagoForms');
  const tipo = STATE.ui.pagoTipo;
  if (tipo === 'material') {
    c.innerHTML = '<div class="form-card"><div class="panel-title">Compra de material</div>'
      + '<div class="field"><label>Partida de material *</label><select id="fmPartida">' + _materialOpts() + '</select><span class="hint">¿No está? Creala en Partidas → Materiales.</span></div>'
      + '<div class="field-row-3">'
      + '<div class="field"><label>Fecha</label><input type="date" id="fmFecha" value="' + hoy() + '" /></div>'
      + '<div class="field"><label>Cantidad</label><input type="number" step="any" id="fmCant" placeholder="0" /></div>'
      + '<div class="field"><label>Importe pagado *</label><input type="number" step="any" id="fmImporte" placeholder="0" /></div>'
      + '</div>'
      + '<div class="field-row">'
      + '<div class="field"><label>Medio de pago</label><select id="fmMedio">' + _mediosOpts() + '</select></div>'
      + '<div class="field"><label>Observación</label><input id="fmObs" placeholder="Proveedor / detalle" /></div>'
      + '</div>'
      + '<button onclick="guardarCompraMaterial()">Registrar compra</button></div>';
  } else if (tipo === 'mano') {
    c.innerHTML = '<div class="form-card"><div class="panel-title">Pago de mano de obra</div>'
      + '<div class="field-row-3">'
      + '<div class="field"><label>Oficio *</label><select id="fmOficio">' + _oficiosOpts() + '</select></div>'
      + '<div class="field"><label>Fecha</label><input type="date" id="fmFecha" value="' + hoy() + '" /></div>'
      + '<div class="field"><label>Importe pagado *</label><input type="number" step="any" id="fmImporte" placeholder="0" /></div>'
      + '</div>'
      + '<div class="field-row">'
      + '<div class="field"><label>Medio de pago</label><select id="fmMedio">' + _mediosOpts() + '</select></div>'
      + '<div class="field"><label>Responsable / observación</label><input id="fmObs" placeholder="Ej: pago semanal albañiles" /></div>'
      + '</div>'
      + '<span class="hint">Este pago no se asocia a una partida puntual: suma al total pagado del oficio (útil para pagos semanales en efectivo).</span><br/><br/>'
      + '<button onclick="guardarPagoMO()">Registrar pago</button></div>';
  } else {
    c.innerHTML = '<div class="form-card"><div class="panel-title">Avance de obra</div>'
      + '<div class="field"><label>Partida de mano de obra *</label><select id="fmPartida" onchange="avancePreview()">' + _moOpts() + '</select></div>'
      + '<div class="field-row-3">'
      + '<div class="field"><label>Fecha</label><input type="date" id="fmFecha" value="' + hoy() + '" /></div>'
      + '<div class="field"><label>Cantidad ejecutada *</label><input type="number" step="any" id="fmCant" placeholder="0" oninput="avancePreview()" /></div>'
      + '<div class="field"><label>Observación</label><input id="fmObs" placeholder="Ej: 60% del encadenado" /></div>'
      + '</div>'
      + '<div class="form-preview" id="fmPreview">Seleccioná una partida.</div>'
      + '<button onclick="guardarAvance()">Registrar avance</button></div>';
    avancePreview();
  }
}

function avancePreview() {
  const el = document.getElementById('fmPreview'); if (!el) return;
  const id = document.getElementById('fmPartida').value;
  const p = STATE.partidas.find(function (x) { return String(x.id) === String(id); });
  if (!p) { el.textContent = 'Seleccioná una partida.'; return; }
  const cant = n(document.getElementById('fmCant').value);
  el.textContent = 'Valor real de este avance: ' + money(cant * n(p.costo_unitario)) + '  (costo unit. ' + money(p.costo_unitario) + ' × ' + num(cant) + ')';
}

async function guardarCompraMaterial() {
  const id = document.getElementById('fmPartida').value;
  const importe = n(document.getElementById('fmImporte').value);
  if (!id) { toast('⚠️', 'Elegí una partida de material', 'error'); return; }
  if (importe <= 0) { toast('⚠️', 'Ingresá el importe pagado', 'error'); return; }
  const p = STATE.partidas.find(function (x) { return String(x.id) === String(id); }) || {};
  const payload = {
    fecha: document.getElementById('fmFecha').value || hoy(), id_partida: Number(id),
    tipo_movimiento: 'Pago', cantidad_ejecutada: n(document.getElementById('fmCant').value),
    importe_pagado: importe, oficio: '', responsable: 'Corralón / proveedor',
    sector: p.sector || 'General', medio_pago: document.getElementById('fmMedio').value,
    observacion: document.getElementById('fmObs').value.trim(),
  };
  await _guardarMov(payload, 'Compra registrada');
}

async function guardarPagoMO() {
  const importe = n(document.getElementById('fmImporte').value);
  if (importe <= 0) { toast('⚠️', 'Ingresá el importe pagado', 'error'); return; }
  const payload = {
    fecha: document.getElementById('fmFecha').value || hoy(), id_partida: '',
    tipo_movimiento: 'Pago', cantidad_ejecutada: 0, importe_pagado: importe,
    oficio: document.getElementById('fmOficio').value, responsable: document.getElementById('fmObs').value.trim() || 'Mano de obra',
    sector: '', medio_pago: document.getElementById('fmMedio').value,
    observacion: document.getElementById('fmObs').value.trim(),
  };
  await _guardarMov(payload, 'Pago registrado');
}

async function guardarAvance() {
  const id = document.getElementById('fmPartida').value;
  const cant = n(document.getElementById('fmCant').value);
  if (!id) { toast('⚠️', 'Elegí una partida', 'error'); return; }
  if (cant <= 0) { toast('⚠️', 'Ingresá la cantidad ejecutada', 'error'); return; }
  const p = STATE.partidas.find(function (x) { return String(x.id) === String(id); }) || {};
  const payload = {
    fecha: document.getElementById('fmFecha').value || hoy(), id_partida: Number(id),
    tipo_movimiento: 'Avance', cantidad_ejecutada: cant, importe_pagado: 0,
    oficio: p.oficio || '', responsable: p.responsable || '', sector: p.sector || '',
    medio_pago: '', observacion: document.getElementById('fmObs').value.trim(),
  };
  await _guardarMov(payload, 'Avance registrado');
}

async function _guardarMov(payload, okMsg) {
  try {
    await apiCreateMovimiento(payload);
    toast('✅', okMsg, 'success');
    renderPagoForm();
    renderMovsTable();
    renderAll();
  } catch (e) { toast('❌', e.message, 'error'); }
}

function _movsFiltrados() {
  const q = normalizeText(document.getElementById('movsSearch').value || '');
  const ft = document.getElementById('movsFiltroTipo').value;
  const fo = document.getElementById('movsFiltroOficio').value;
  return STATE.movimientos.filter(function (m) { return m.estado !== 'Cancelado'; })
    .filter(function (m) { return !ft || m.tipo_movimiento === ft; })
    .filter(function (m) { return !fo || m.oficio === fo; })
    .filter(function (m) {
      if (!q) return true;
      const p = STATE.partidas.find(function (x) { return String(x.id) === String(m.id_partida); });
      return normalizeText((p ? p.concepto : '') + ' ' + (m.oficio || '') + ' ' + (m.observacion || '') + ' ' + (m.responsable || '')).indexOf(q) >= 0;
    })
    .sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)) || (Number(b.id) - Number(a.id)); });
}

function renderMovsTable() {
  const rows = _movsFiltrados();
  const t = document.getElementById('movsTable');
  const head = '<thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto / Oficio</th><th class="num">Cant. ejec.</th><th class="num">Importe</th><th>Medio</th><th>Detalle</th><th></th></tr></thead>';
  if (!rows.length) { t.innerHTML = head + '<tbody><tr><td class="empty-row" colspan="8">Sin movimientos.</td></tr></tbody>'; return; }
  let sImp = 0;
  const body = rows.map(function (m) {
    sImp += n(m.importe_pagado);
    const p = STATE.partidas.find(function (x) { return String(x.id) === String(m.id_partida); });
    const meta = oficioMeta(m.oficio);
    const concepto = p ? escapeHtml(p.concepto) : (m.oficio ? '<span class="pill ' + meta.cls + '">' + escapeHtml(m.oficio) + '</span>' : escapeHtml(m.responsable || '—'));
    return '<tr>'
      + '<td>' + fmtFecha(m.fecha) + '</td>'
      + '<td><span class="tag-mov ' + m.tipo_movimiento + '">' + escapeHtml(m.tipo_movimiento) + '</span></td>'
      + '<td>' + concepto + '</td>'
      + '<td class="num">' + (n(m.cantidad_ejecutada) ? num(m.cantidad_ejecutada) : '—') + '</td>'
      + '<td class="num">' + (n(m.importe_pagado) ? money(m.importe_pagado) : '—') + '</td>'
      + '<td>' + escapeHtml(m.medio_pago || '—') + '</td>'
      + '<td>' + escapeHtml(m.observacion || '') + '</td>'
      + '<td class="row-actions"><button class="icon-btn danger" title="Eliminar" onclick="eliminarMovimiento(' + m.id + ')">🗑</button></td>'
      + '</tr>';
  }).join('');
  const foot = '<tfoot><tr><td colspan="4">Total pagado (' + rows.length + ' mov.)</td><td class="num">' + money(sImp) + '</td><td colspan="3"></td></tr></tfoot>';
  t.innerHTML = head + '<tbody>' + body + '</tbody>' + foot;
}

async function eliminarMovimiento(id) {
  if (!confirm('¿Eliminar este movimiento?')) return;
  try { await apiDeleteMovimiento(Number(id)); toast('🗑', 'Movimiento eliminado', 'success'); renderMovsTable(); renderAll(); }
  catch (e) { toast('❌', e.message, 'error'); }
}

function exportMovs() {
  const rows = _movsFiltrados();
  const header = ['Fecha', 'Tipo', 'Concepto', 'Oficio', 'Cantidad ejecutada', 'Importe pagado', 'Medio', 'Responsable', 'Observacion'];
  const data = rows.map(function (m) {
    const p = STATE.partidas.find(function (x) { return String(x.id) === String(m.id_partida); });
    return [m.fecha, m.tipo_movimiento, p ? p.concepto : '', m.oficio, m.cantidad_ejecutada, m.importe_pagado, m.medio_pago, m.responsable, m.observacion];
  });
  downloadCSV('movimientos.csv', [header].concat(data));
}
