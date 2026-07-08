// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Dashboard.gs
// Lectura consolidada para el frontend + updateConfig.
// El cálculo de agregados (teórico, desvío) se hace en el frontend
// (app.js: calcResumen) para no duplicar lógica.
// ============================================================

function getInitialData_() {
  return {
    config: getConfigMap_(),
    partidas: getPartidas_(),
    movimientos: getMovimientos_(),
    catalogos: {
      oficios: getCatValues_(SHEETS.CAT_OFICIOS, DEFAULT_OFICIOS),
      medios_pago: getCatValues_(SHEETS.CAT_MEDIOS, DEFAULT_MEDIOS),
      sectores: getCatValues_(SHEETS.CAT_SECTORES, DEFAULT_SECTORES),
    },
  };
}

function updateConfig_(p, user) {
  var allowed = ['nombre', 'descripcion', 'fondos_asignados', 'moneda', 'imprevistos_pct'];
  allowed.forEach(function (k) {
    if (p[k] !== undefined) {
      var val = p[k];
      if (k === 'fondos_asignados' || k === 'imprevistos_pct') val = validateNumber_(val, k, { min: 0 });
      setConfigValue_(k, val);
    }
  });
  writeLog_('updateConfig', JSON.stringify(p), user);
  return getConfigMap_();
}
