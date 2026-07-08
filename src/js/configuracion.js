/* ============================================================
   Sección CONFIGURACIÓN — datos del proyecto, catálogos, conexión.
   ============================================================ */
'use strict';

function renderConfiguracion() {
  const cfg = STATE.config || {};
  const c = document.getElementById('configContent');
  c.innerHTML =
    /* Proyecto */
    '<div class="form-card"><div class="panel-title">Datos del proyecto</div>'
    + '<div class="field"><label>Nombre</label><input id="cfNombre" value="' + escapeHtml(cfg.nombre || '') + '" /></div>'
    + '<div class="field"><label>Descripción</label><textarea id="cfDesc">' + escapeHtml(cfg.descripcion || '') + '</textarea></div>'
    + '<div class="field-row-3">'
    + '<div class="field"><label>Fondos asignados</label><input type="number" step="any" id="cfFondos" value="' + n(cfg.fondos_asignados) + '" /></div>'
    + '<div class="field"><label>Moneda</label><input id="cfMoneda" value="' + escapeHtml(cfg.moneda || 'ARS') + '" maxlength="3" /></div>'
    + '<div class="field"><label>Imprevistos (%)</label><input type="number" step="any" id="cfImprev" value="' + n(cfg.imprevistos_pct) + '" /></div>'
    + '</div>'
    + '<button onclick="guardarProyecto()">Guardar proyecto</button></div>'

    /* Catálogos */
    + '<div class="form-card"><div class="panel-title">Catálogos (uno por línea)</div>'
    + '<div class="field-row-3">'
    + '<div class="field"><label>Oficios</label><textarea id="cfOficios" style="min-height:120px">' + escapeHtml(STATE.catalogos.oficios.join('\n')) + '</textarea></div>'
    + '<div class="field"><label>Medios de pago</label><textarea id="cfMedios" style="min-height:120px">' + escapeHtml(STATE.catalogos.medios_pago.join('\n')) + '</textarea></div>'
    + '<div class="field"><label>Sectores</label><textarea id="cfSectores" style="min-height:120px">' + escapeHtml(STATE.catalogos.sectores.join('\n')) + '</textarea></div>'
    + '</div>'
    + '<button class="secondary" onclick="guardarCatalogos()">Guardar catálogos</button>'
    + '<span class="hint" style="margin-left:10px">En modo demo los catálogos viven en memoria durante la sesión.</span></div>'

    /* Conexión */
    + '<div class="form-card"><div class="panel-title">Conexión con Google Sheets</div>'
    + '<div id="configMode" style="margin-bottom:12px"></div>'
    + '<div class="field"><label>URL del Web App (Apps Script)</label><input id="cfUrl" value="' + escapeHtml(CFG.apiUrl) + '" placeholder="https://script.google.com/macros/s/.../exec" /><span class="hint">Pegá la URL del deploy. Vacío = modo demo con datos locales.</span></div>'
    + '<div class="modal-actions" style="justify-content:flex-start">'
    + '<button onclick="guardarConexion()">Guardar y recargar</button>'
    + '<button class="secondary" onclick="usarDemo()">Usar modo demo</button>'
    + (CFG.isMock() ? '' : '<button class="ghost" onclick="correrMigracion()">Migrar datos del Excel</button>')
    + '</div></div>'

    /* Apariencia */
    + '<div class="form-card"><div class="panel-title">Apariencia</div>'
    + '<button class="secondary" onclick="toggleTheme()"><span class="th-icon">☾</span>&nbsp; Cambiar tema (claro / oscuro)</button></div>';

  const mode = document.getElementById('configMode');
  mode.className = 'status-bar ' + (CFG.isMock() ? 'warning' : 'success');
  mode.textContent = CFG.isMock()
    ? 'Modo demo: los cambios no se guardan al recargar. Configurá la URL del Web App para persistir en Google Sheets.'
    : 'Conectado a Google Sheets. Los cambios se guardan en la planilla.';
  _updateThemeToggles();
}

async function guardarProyecto() {
  const payload = {
    nombre: document.getElementById('cfNombre').value.trim(),
    descripcion: document.getElementById('cfDesc').value.trim(),
    fondos_asignados: n(document.getElementById('cfFondos').value),
    moneda: (document.getElementById('cfMoneda').value.trim() || 'ARS').toUpperCase(),
    imprevistos_pct: n(document.getElementById('cfImprev').value),
  };
  try {
    await apiUpdateConfig(payload);
    CFG.moneda = payload.moneda;
    toast('✅', 'Proyecto guardado', 'success');
    renderAll();
  } catch (e) { toast('❌', e.message, 'error'); }
}

function guardarCatalogos() {
  const parse = function (id) { return document.getElementById(id).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  STATE.catalogos.oficios = parse('cfOficios');
  STATE.catalogos.medios_pago = parse('cfMedios');
  STATE.catalogos.sectores = parse('cfSectores');
  toast('✅', 'Catálogos actualizados', 'success');
  renderAll();
}

function guardarConexion() {
  const url = document.getElementById('cfUrl').value.trim();
  CFG.apiUrl = url;
  localStorage.removeItem('obra_demo');
  location.reload();
}

function usarDemo() {
  localStorage.setItem('obra_demo', '1');
  location.reload();
}

async function correrMigracion() {
  if (!confirm('Esto importará las partidas y movimientos semilla a la planilla. ¿Continuar?')) return;
  try {
    const r = await callApi('runMigracion', {});
    toast('✅', 'Migración ejecutada', 'success');
    await loadInitialData();
    renderAll();
    void r;
  } catch (e) { toast('❌', e.message, 'error'); }
}
