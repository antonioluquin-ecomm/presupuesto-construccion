// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Migracion.gs
// Importa los datos semilla (Seed.gs) a las hojas.
// Se puede correr desde el editor (migrar) o vía acción 'runMigracion'.
// Idempotente por bandera CONFIG.migrado = SI (no duplica).
// ============================================================

function migrar_() {
  setup(); // asegura estructura

  var cfg = getConfigMap_();
  if (String(cfg.migrado) === 'SI') {
    return { migrado: false, motivo: 'Ya se migró antes (CONFIG.migrado = SI).' };
  }

  var ss = getSpreadsheet_();
  var pSheet = ss.getSheetByName(SHEETS.PARTIDAS);
  var mSheet = ss.getSheetByName(SHEETS.MOVIMIENTOS);
  var now = new Date();
  var user = currentUser_();

  // Partidas.
  var pRows = SEED_PARTIDAS.map(function (r) {
    // r = [id, tipo, oficio, concepto, sector, responsable, unidad, cant, costo, estado]
    return r.concat([now, now, user, user]);
  });
  if (pRows.length) pSheet.getRange(pSheet.getLastRow() + 1, 1, pRows.length, PARTIDAS_HEADERS.length).setValues(pRows);

  // Movimientos.
  var mRows = SEED_MOVIMIENTOS.map(function (r) {
    // r = [id, fecha, id_partida, tipo, cant_ejec, importe, oficio, responsable, sector, medio, obs, estado]
    return r.concat([now, now, user, user]);
  });
  if (mRows.length) mSheet.getRange(mSheet.getLastRow() + 1, 1, mRows.length, MOVIMIENTOS_HEADERS.length).setValues(mRows);

  // Config del proyecto.
  Object.keys(SEED_CONFIG).forEach(function (k) { setConfigValue_(k, SEED_CONFIG[k]); });
  setConfigValue_('migrado', 'SI');

  writeLog_('runMigracion', pRows.length + ' partidas, ' + mRows.length + ' movimientos', user);
  return { migrado: true, partidas: pRows.length, movimientos: mRows.length };
}

// Alias para correr desde el editor de Apps Script.
function migrar() { return migrar_(); }
