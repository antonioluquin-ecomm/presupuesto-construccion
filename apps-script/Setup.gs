// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Setup.gs
// Bootstrap de hojas, headers, catálogos y CONFIG.
// Ejecutar setup() UNA vez desde el editor de Apps Script (con SPREADSHEET_ID cargado).
// Idempotente: no pisa datos existentes.
// ============================================================

function setup() {
  var ss = getSpreadsheet_();
  ensureSheetWithHeaders_(ss, SHEETS.PARTIDAS, PARTIDAS_HEADERS);
  ensureSheetWithHeaders_(ss, SHEETS.MOVIMIENTOS, MOVIMIENTOS_HEADERS);
  ensureSheetWithHeaders_(ss, SHEETS.LOGS, ['fecha', 'usuario', 'action', 'detalle']);
  ensureSheetWithHeaders_(ss, SHEETS.ERRORS, ['fecha', 'usuario', 'action', 'mensaje', 'stack']);

  // CONFIG (clave/valor).
  var cfg = ensureSheetWithHeaders_(ss, SHEETS.CONFIG, ['clave', 'valor']);
  if (cfg.getLastRow() < 2) {
    Object.keys(DEFAULT_CONFIG).forEach(function (k) { cfg.appendRow([k, DEFAULT_CONFIG[k]]); });
  }

  // Catálogos.
  ensureCatalog_(ss, SHEETS.CAT_OFICIOS, 'oficio', DEFAULT_OFICIOS);
  ensureCatalog_(ss, SHEETS.CAT_MEDIOS, 'medio_pago', DEFAULT_MEDIOS);
  ensureCatalog_(ss, SHEETS.CAT_SECTORES, 'sector', DEFAULT_SECTORES);

  // Limpieza de la hoja por defecto vacía.
  var def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) { try { ss.deleteSheet(def); } catch (e) {} }

  return 'Setup OK — hojas creadas/verificadas.';
}

function ensureSheetWithHeaders_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ensureCatalog_(ss, name, header, values) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([header]);
    values.forEach(function (v) { sheet.appendRow([v]); });
    sheet.setFrozenRows(1);
  }
  return sheet;
}
