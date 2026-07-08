// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Logger.gs
// Log de escrituras (LOGS) y errores (ERRORS).
// ============================================================

function writeLog_(action, detalle, usuario) {
  try {
    var sheet = getSpreadsheet_().getSheetByName(SHEETS.LOGS);
    if (!sheet) return;
    sheet.appendRow([new Date(), usuario || currentUser_(), action || '', detalle || '']);
  } catch (e) { /* nunca romper por logging */ }
}

function writeError_(action, mensaje, stack, usuario) {
  try {
    var sheet = getSpreadsheet_().getSheetByName(SHEETS.ERRORS);
    if (!sheet) return;
    sheet.appendRow([new Date(), usuario || currentUser_(), action || '', mensaje || '', stack || '']);
  } catch (e) { /* idem */ }
}
