/* ============================================================
   Sección PARTIDAS — ABM de ítems presupuestados (Material / Mano de obra).
   ============================================================ */
'use strict';

let _partidasBound = false;

function renderPartidas() {
  if (!_partidasBound) {
    document.querySelectorAll('#partidasTabs .tab-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        STATE.ui.partidaTab = b.dataset.ptab;
        document.querySelectorAll('#partidasTabs .tab-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderPartidasTable();
      });
    });
    document.getElementById('partidasSearch').addEventListener('input', renderPartidasTable);
    document.getElementById('partidasNueva').addEventListener('click', function () { openPartidaModal(null); });
    document.getElementById('partidasExport').addEventListener('click', exportPartidas);
    _partidasBound = true;
  }
  // reflejar tab activa
  document.querySelectorAll('#partidasTabs .tab-btn').forEach(function (x) { x.classList.toggle('active', x.dataset.ptab === STATE.ui.partidaTab); });
  renderPartidasTable();
}

function _partidasFiltradas() {
  const tab = STATE.ui.partidaTab;
  const q = normalizeText(document.getElementById('partidasSearch').value || '');
  return STATE.partidas
    .filter(function (p) { return p.estado !== 'Cancelada' && p.tipo === tab; })
    .filter(function (p) { return !q || normalizeText(p.concepto + ' ' + (p.oficio || '') + ' ' + (p.sector || '')).indexOf(q) >= 0; })
    .map(enrichPartida);
}

function renderPartidasTable() {
  const tab = STATE.ui.partidaTab;
  const rows = _partidasFiltradas();
  const isMO = tab === 'Mano de obra';
  const t = document.getElementById('partidasTable');

  const head = '<thead><tr>'
    + '<th>Concepto</th>'
    + (isMO ? '<th>Oficio</th>' : '<th>Sector</th>')
    + '<th>Unidad</th><th class="num">Cant.</th><th class="num">Costo unit.</th><th class="num">Total</th>'
    + (isMO ? '<th class="num">Avance</th><th class="num">Valor real</th>' : '')
    + '<th class="num">Pagado</th>'
    + (isMO ? '<th class="num">Desvío</th>' : '')
    + '<th></th></tr></thead>';

  if (!rows.length) {
    t.innerHTML = head + '<tbody><tr><td class="empty-row" colspan="12">Sin partidas. Usá "+ Nueva partida".</td></tr></tbody>';
    return;
  }

  let sTotal = 0, sPagado = 0, sTeorico = 0;
  const body = rows.map(function (i) {
    sTotal += i.total; sPagado += i.pagado; sTeorico += i.teorico;
    const meta = oficioMeta(i.oficio);
    return '<tr>'
      + '<td>' + escapeHtml(i.concepto) + '</td>'
      + (isMO ? '<td><span class="pill ' + meta.cls + '">' + escapeHtml(i.oficio || '—') + '</span></td>' : '<td>' + escapeHtml(i.sector || '—') + '</td>')
      + '<td>' + escapeHtml(i.unidad || '—') + '</td>'
      + '<td class="num">' + num(i.cantidad_presupuestada) + '</td>'
      + '<td class="num">' + money(i.costo_unitario) + '</td>'
      + '<td class="num">' + money(i.total) + '</td>'
      + (isMO ? '<td class="num">' + pct(i.avancePct) + '</td><td class="num">' + money(i.teorico) + '</td>' : '')
      + '<td class="num">' + money(i.pagado) + '</td>'
      + (isMO ? '<td class="num" style="color:' + (i.desvio > 0 ? 'var(--danger)' : 'var(--success)') + '">' + money(i.desvio) + '</td>' : '')
      + '<td class="row-actions">'
      + '<button class="icon-btn" title="Editar" onclick="openPartidaModal(' + i.id + ')">✎</button>'
      + '<button class="icon-btn danger" title="Eliminar" onclick="eliminarPartida(' + i.id + ')">🗑</button>'
      + '</td></tr>';
  }).join('');

  const cols = isMO ? 10 : 7;
  const foot = '<tfoot><tr><td colspan="' + (isMO ? 5 : 5) + '">Total (' + rows.length + ')</td>'
    + '<td class="num">' + money(sTotal) + '</td>'
    + (isMO ? '<td></td><td class="num">' + money(sTeorico) + '</td>' : '')
    + '<td class="num">' + money(sPagado) + '</td>'
    + (isMO ? '<td></td>' : '') + '<td></td></tr></tfoot>';

  t.innerHTML = head + '<tbody>' + body + '</tbody>' + foot;
  void cols;
}

/* ── Modal alta/edición ── */
function openPartidaModal(id) {
  const p = id ? STATE.partidas.find(function (x) { return String(x.id) === String(id); }) : null;
  const tab = STATE.ui.partidaTab;
  const tipo = p ? p.tipo : tab;
  const isMO = tipo === 'Mano de obra';
  const oficiosOpts = STATE.catalogos.oficios.map(function (o) { return '<option' + (p && p.oficio === o ? ' selected' : '') + '>' + escapeHtml(o) + '</option>'; }).join('');
  const sectoresOpts = STATE.catalogos.sectores.map(function (s) { return '<option' + (p && p.sector === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>'; }).join('');

  openModal(
    '<h3>' + (id ? 'Editar' : 'Nueva') + ' partida — ' + escapeHtml(tipo) + '</h3>'
    + '<div class="field"><label>Concepto *</label><input id="pmConcepto" value="' + escapeHtml(p ? p.concepto : '') + '" placeholder="Ej: Pared ladrillo / Cemento x 25kg" /></div>'
    + '<div class="field-row">'
    + (isMO
        ? '<div class="field"><label>Oficio</label><select id="pmOficio">' + oficiosOpts + '</select></div>'
        : '<div class="field"><label>Sector</label><select id="pmSector">' + sectoresOpts + '</select></div>')
    + '<div class="field"><label>Unidad</label><input id="pmUnidad" value="' + escapeHtml(p ? p.unidad : '') + '" placeholder="m², ml, bolsa, global…" /></div>'
    + '</div>'
    + '<div class="field-row">'
    + '<div class="field"><label>Cantidad presupuestada *</label><input id="pmCant" type="number" step="any" value="' + (p ? n(p.cantidad_presupuestada) : '') + '" /></div>'
    + '<div class="field"><label>Costo unitario *</label><input id="pmCosto" type="number" step="any" value="' + (p ? n(p.costo_unitario) : '') + '" oninput="pmPreview()" /></div>'
    + '</div>'
    + '<div class="form-preview" id="pmPreview">Total: ' + money(p ? n(p.cantidad_presupuestada) * n(p.costo_unitario) : 0) + '</div>'
    + '<input type="hidden" id="pmTipo" value="' + escapeHtml(tipo) + '" />'
    + '<input type="hidden" id="pmId" value="' + (p ? p.id : '') + '" />'
    + '<div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancelar</button><button onclick="guardarPartida()">Guardar</button></div>'
  );
  document.getElementById('pmCant').addEventListener('input', pmPreview);
}

function pmPreview() {
  const c = n(document.getElementById('pmCant').value);
  const u = n(document.getElementById('pmCosto').value);
  document.getElementById('pmPreview').textContent = 'Total: ' + money(c * u);
}

async function guardarPartida() {
  const concepto = document.getElementById('pmConcepto').value.trim();
  const cant = n(document.getElementById('pmCant').value);
  const costo = n(document.getElementById('pmCosto').value);
  if (!concepto) { toast('⚠️', 'Ingresá un concepto', 'error'); return; }
  const tipo = document.getElementById('pmTipo').value;
  const id = document.getElementById('pmId').value;
  const payload = {
    tipo: tipo, concepto: concepto,
    oficio: tipo === 'Mano de obra' ? (document.getElementById('pmOficio') || {}).value || '' : '',
    sector: tipo === 'Material' ? (document.getElementById('pmSector') || {}).value || 'General' : (document.getElementById('pmSector') ? document.getElementById('pmSector').value : ''),
    unidad: document.getElementById('pmUnidad').value.trim(),
    cantidad_presupuestada: cant, costo_unitario: costo,
  };
  try {
    if (id) { payload.id = Number(id); await apiUpdatePartida(payload); }
    else { await apiCreatePartida(payload); }
    closeModal();
    toast('✅', 'Partida guardada', 'success');
    renderPartidasTable();
    renderAll();
  } catch (e) { toast('❌', e.message, 'error'); }
}

async function eliminarPartida(id) {
  const p = STATE.partidas.find(function (x) { return String(x.id) === String(id); });
  if (!p) return;
  if (!confirm('¿Eliminar la partida "' + p.concepto + '"? (queda cancelada, no se borra el historial)')) return;
  try { await apiDeletePartida(Number(id)); toast('🗑', 'Partida eliminada', 'success'); renderPartidasTable(); renderAll(); }
  catch (e) { toast('❌', e.message, 'error'); }
}

function exportPartidas() {
  const rows = _partidasFiltradas();
  const header = ['Tipo', 'Concepto', 'Oficio', 'Sector', 'Unidad', 'Cantidad', 'Costo unitario', 'Total', 'Ejecutado', 'Valor real', 'Pagado', 'Desvio'];
  const data = rows.map(function (i) { return [i.tipo, i.concepto, i.oficio, i.sector, i.unidad, i.cantidad_presupuestada, i.costo_unitario, i.total, i.ejec, i.teorico, i.pagado, i.desvio]; });
  downloadCSV('partidas-' + STATE.ui.partidaTab.replace(/\s+/g, '-').toLowerCase() + '.csv', [header].concat(data));
}
