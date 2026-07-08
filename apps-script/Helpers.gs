// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Helpers.gs
// Utilidades genéricas de Sheets. No conocen entidades de negocio.
// ============================================================

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID no configurado en Script Properties');
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name + '. Corré setup() primero.');
  return sheet;
}

// ── Serialización / respuesta ─────────────────────────────────
function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function okResponse_(data)  { return jsonResponse_(data !== undefined ? { ok: true, data: data } : { ok: true }); }
function errorResponse_(msg, code) { var o = { ok: false, error: msg }; if (code) o.code = code; return jsonResponse_(o); }

// ── Fila ↔ objeto ─────────────────────────────────────────────
function rowToObj_(row, colMap) {
  var obj = {};
  Object.keys(colMap).forEach(function (key) {
    var val = row[colMap[key] - 1];
    obj[key] = (val instanceof Date) ? Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : (val === '' ? null : val);
  });
  return obj;
}

function getAllRows_(sheetName, colMap) {
  var data = getSheet_(sheetName).getDataRange().getValues();
  data.shift();
  return data
    .filter(function (r) { return r[0] !== '' && r[0] !== null; })
    .map(function (r) { return rowToObj_(r, colMap); });
}

// ── Búsqueda e IDs ────────────────────────────────────────────
function findRowNumber_(sheet, id) {
  var ids = sheet.getRange('A:A').getValues();
  for (var i = 1; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 1;
  }
  return null;
}

function getNextId_(sheet) {
  var ids = sheet.getRange('A:A').getValues().map(function (v) { return parseInt(v[0], 10); })
    .filter(function (v) { return !isNaN(v) && v > 0; });
  return ids.length ? Math.max.apply(null, ids) + 1 : 1;
}

// Escribe una fila completa a partir de un objeto y su colMap.
function rowFromObj_(obj, colMap, headers) {
  return headers.map(function (h) {
    var v = obj[h];
    return (v === undefined || v === null) ? '' : v;
  });
}

// Actualiza campos puntuales. Toca fecha_modificacion / modificado_por si existen.
function updateFields_(sheetName, rowNum, colMap, updates, userEmail) {
  var sheet = getSheet_(sheetName);
  Object.keys(updates).forEach(function (field) {
    var col = colMap[field];
    if (!col) throw new Error('Campo desconocido: ' + field);
    sheet.getRange(rowNum, col).setValue(updates[field]);
  });
  if (colMap.fecha_modificacion) sheet.getRange(rowNum, colMap.fecha_modificacion).setValue(new Date());
  if (colMap.modificado_por && userEmail) sheet.getRange(rowNum, colMap.modificado_por).setValue(userEmail);
}

// ── Usuario actual (sin login: email de Google o 'app') ───────
function currentUser_() {
  try { return Session.getActiveUser().getEmail() || 'app'; } catch (e) { return 'app'; }
}

// ── CONFIG (clave/valor) ──────────────────────────────────────
function getConfigMap_() {
  var sheet = getSpreadsheet_().getSheetByName(SHEETS.CONFIG);
  var config = {};
  if (!sheet) return config;
  var data = sheet.getDataRange().getValues();
  data.forEach(function (row, i) { if (i > 0 && row[0]) config[row[0]] = (row[1] === '' ? null : row[1]); });
  return config;
}

function setConfigValue_(key, value) {
  var sheet = getSheet_(SHEETS.CONFIG);
  var data = sheet.getRange('A:A').getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) { sheet.getRange(i + 1, 2).setValue(value); return; }
  }
  sheet.appendRow([key, value]);
}

// ── Catálogo (columna A, con header) ──────────────────────────
function getCatValues_(sheetName, fallback) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) return (fallback || []);
  var vals = sheet.getRange('A:A').getValues().flat()
    .filter(function (v, i) { return i > 0 && v !== '' && v !== null; });
  return vals.length ? vals : (fallback || []);
}
