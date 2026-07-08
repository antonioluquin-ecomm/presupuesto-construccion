/* ============================================================
   Sección RESUMEN — dashboard: KPIs, materiales, MO por oficio, desvío.
   ============================================================ */
'use strict';

function renderResumen() {
  const cfg = STATE.config || {};
  document.getElementById('resProyectoNombre').textContent = cfg.nombre || 'Resumen';
  document.getElementById('resProyectoDesc').textContent = cfg.descripcion || '';

  const g = calcResumen();

  /* ── KPIs ── */
  const kpis = [
    { label: 'Fondos asignados', value: money(g.fondos), cls: 'neutral' },
    { label: 'Presupuesto cargado', value: money(g.totalPresup), cls: 'neutral', sub: 'material + mano de obra' },
    { label: 'Gasto real (pagado)', value: money(g.totalPagado), cls: '', sub: pct(g.ejecPct) + ' de los fondos' },
    { label: 'Fondos restantes', value: money(g.restante), cls: g.restante < 0 ? 'danger' : 'success' },
    { label: 'Valor real MO ejecutado', value: money(g.moTeorico), cls: 'neutral', sub: 'lo que "vale" lo hecho' },
    { label: 'Desvío MO (pagado − real)', value: money(g.moPagado - g.moTeorico), cls: (g.moPagado - g.moTeorico) > 0 ? 'danger' : 'success', sub: (g.moPagado - g.moTeorico) > 0 ? 'pagado de más' : 'pagado de menos' },
  ];
  document.getElementById('resKpis').innerHTML = kpis.map(function (k) {
    return '<div class="kpi-card ' + (k.cls || '') + '">'
      + '<div class="kpi-label">' + escapeHtml(k.label) + '</div>'
      + '<div class="kpi-value">' + escapeHtml(k.value) + '</div>'
      + (k.sub ? '<div class="kpi-sub">' + escapeHtml(k.sub) + '</div>' : '')
      + '</div>';
  }).join('');

  /* ── Materiales: presupuestado vs pagado ── */
  const matPct = g.matPresup > 0 ? Math.min(g.matPagado / g.matPresup * 100, 100) : 0;
  document.getElementById('resMateriales').innerHTML =
    '<div class="legend"><span><span class="sw" style="background:var(--primary-mid)"></span>Presupuestado</span>'
    + '<span><span class="sw" style="background:var(--primary)"></span>Pagado</span></div>'
    + '<div class="bar-list">'
    + barRow('Presupuestado', g.matPresup, g.matPresup, 'presup')
    + barRow('Pagado', g.matPagado, g.matPresup, 'pagado')
    + '</div>'
    + '<div style="margin-top:12px;font-size:12.5px;color:var(--muted)">Ejecutado: <b class="mono" style="color:var(--text)">' + pct(matPct) + '</b> · Pendiente de compra: <b class="mono" style="color:var(--text)">' + money(Math.max(g.matPresup - g.matPagado, 0)) + '</b></div>';

  /* ── Mano de obra por oficio ── */
  const oficios = Object.keys(g.oficios).sort();
  document.getElementById('resOficios').innerHTML = oficios.length ? oficios.map(function (o) {
    const b = g.oficios[o];
    const meta = oficioMeta(o);
    const avance = b.presup > 0 ? Math.min(b.teorico / b.presup * 100, 100) : 0;
    const desvio = b.pagado - b.teorico;
    return '<div class="oficio-block" style="--oc:var(' + meta.varc + ')">'
      + '<div class="oficio-hd"><span class="oficio-name">' + meta.icon + ' ' + escapeHtml(o) + '</span>'
      + '<span class="oficio-pct">' + pct(avance) + ' avance</span></div>'
      + '<div class="progress-track"><div class="progress-bar" style="width:' + avance + '%;background:var(' + meta.varc + ')"></div></div>'
      + '<div class="oficio-nums">'
      + oficioNum('Presupuestado', money(b.presup))
      + oficioNum('Valor real', money(b.teorico))
      + oficioNum('Pagado', money(b.pagado))
      + '</div>'
      + '<div style="font-size:12px;color:var(--muted)">Desvío: <b class="oficio-num-val ' + (desvio > 0 ? 'desvio-neg' : 'desvio-pos') + '">' + money(desvio) + '</b> ' + (desvio > 0 ? '(pagado de más)' : '(a favor)') + '</div>'
      + '</div>';
  }).join('') : '<div class="panel text-muted">Todavía no hay mano de obra cargada.</div>';

  /* ── Tabla de desvío por partida (MO) ── */
  const moRows = g.mo.slice().sort(function (a, b) { return Math.abs(b.desvio) - Math.abs(a.desvio); });
  const t = document.getElementById('resDesvioTable');
  if (!moRows.length) {
    t.innerHTML = '<tbody><tr><td class="empty-row">Sin partidas de mano de obra.</td></tr></tbody>';
  } else {
    t.innerHTML =
      '<thead><tr><th>Concepto</th><th>Oficio</th><th class="num">Presup.</th><th class="num">Avance</th><th class="num">Valor real</th><th class="num">Pagado</th><th class="num">Desvío</th></tr></thead>'
      + '<tbody>' + moRows.map(function (i) {
        const meta = oficioMeta(i.oficio);
        return '<tr>'
          + '<td>' + escapeHtml(i.concepto) + '</td>'
          + '<td><span class="pill ' + meta.cls + '">' + escapeHtml(i.oficio || '—') + '</span></td>'
          + '<td class="num">' + money(i.total) + '</td>'
          + '<td class="num">' + pct(i.avancePct) + '</td>'
          + '<td class="num">' + money(i.teorico) + '</td>'
          + '<td class="num">' + money(i.pagado) + '</td>'
          + '<td class="num" style="color:' + (i.desvio > 0 ? 'var(--danger)' : 'var(--success)') + '">' + money(i.desvio) + '</td>'
          + '</tr>';
      }).join('') + '</tbody>';
  }
}

function barRow(label, val, max, cls) {
  const w = max > 0 ? Math.min(val / max * 100, 100) : 0;
  return '<div class="bar-row"><div class="bar-label">' + escapeHtml(label) + '</div>'
    + '<div class="bar-track"><div class="bar-fill ' + cls + '" style="width:' + w + '%"></div></div>'
    + '<div class="bar-val">' + money(val) + '</div></div>';
}
function oficioNum(label, val) {
  return '<div><div class="oficio-num-label">' + escapeHtml(label) + '</div><div class="oficio-num-val">' + escapeHtml(val) + '</div></div>';
}
