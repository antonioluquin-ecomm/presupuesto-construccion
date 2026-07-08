// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Partidas.gs
// CRUD de partidas presupuestadas (Material / Mano de obra).
// Soft delete: estado = 'Cancelada'.
// ============================================================

function getPartidas_() {
  return getAllRows_(SHEETS.PARTIDAS, PARTIDAS_COLS);
}

function createPartida_(p, user) {
  var sheet = getSheet_(SHEETS.PARTIDAS);
  var tipo = validateEnum_(p.tipo, 'tipo', TIPOS_PARTIDA);
  var obj = {
    id: getNextId_(sheet),
    tipo: tipo,
    oficio: validateString_(p.oficio, 'oficio', { max: 60 }),
    concepto: validateString_(p.concepto, 'concepto', { required: true, max: 200 }),
    sector: validateString_(p.sector, 'sector', { max: 60 }),
    responsable: validateString_(p.responsable, 'responsable', { max: 100 }),
    unidad: validateString_(p.unidad, 'unidad', { max: 30 }),
    cantidad_presupuestada: validateNumber_(p.cantidad_presupuestada, 'cantidad_presupuestada', { min: 0 }),
    costo_unitario: validateNumber_(p.costo_unitario, 'costo_unitario', { min: 0 }),
    estado: 'Activa',
    fecha_creacion: new Date(),
    fecha_modificacion: new Date(),
    creado_por: user,
    modificado_por: user,
  };
  sheet.appendRow(rowFromObj_(obj, PARTIDAS_COLS, PARTIDAS_HEADERS));
  writeLog_('createPartida', 'id=' + obj.id + ' ' + obj.concepto, user);
  return rowToObj_(rowFromObj_(obj, PARTIDAS_COLS, PARTIDAS_HEADERS), PARTIDAS_COLS);
}

function updatePartida_(p, user) {
  var id = validateId_(p.id, 'partida');
  var sheet = getSheet_(SHEETS.PARTIDAS);
  var rowNum = findRowNumber_(sheet, id);
  if (!rowNum) fail_('Partida no encontrada: ' + id, 404);

  var updates = {};
  if (p.tipo !== undefined)      updates.tipo = validateEnum_(p.tipo, 'tipo', TIPOS_PARTIDA);
  if (p.oficio !== undefined)    updates.oficio = validateString_(p.oficio, 'oficio', { max: 60 });
  if (p.concepto !== undefined)  updates.concepto = validateString_(p.concepto, 'concepto', { required: true, max: 200 });
  if (p.sector !== undefined)    updates.sector = validateString_(p.sector, 'sector', { max: 60 });
  if (p.responsable !== undefined) updates.responsable = validateString_(p.responsable, 'responsable', { max: 100 });
  if (p.unidad !== undefined)    updates.unidad = validateString_(p.unidad, 'unidad', { max: 30 });
  if (p.cantidad_presupuestada !== undefined) updates.cantidad_presupuestada = validateNumber_(p.cantidad_presupuestada, 'cantidad_presupuestada', { min: 0 });
  if (p.costo_unitario !== undefined) updates.costo_unitario = validateNumber_(p.costo_unitario, 'costo_unitario', { min: 0 });

  updateFields_(SHEETS.PARTIDAS, rowNum, PARTIDAS_COLS, updates, user);
  writeLog_('updatePartida', 'id=' + id, user);
  return rowToObj_(sheet.getRange(rowNum, 1, 1, PARTIDAS_HEADERS.length).getValues()[0], PARTIDAS_COLS);
}

function deletePartida_(p, user) {
  var id = validateId_(p.id, 'partida');
  var sheet = getSheet_(SHEETS.PARTIDAS);
  var rowNum = findRowNumber_(sheet, id);
  if (!rowNum) fail_('Partida no encontrada: ' + id, 404);
  updateFields_(SHEETS.PARTIDAS, rowNum, PARTIDAS_COLS, { estado: 'Cancelada' }, user);
  writeLog_('deletePartida', 'id=' + id, user);
  return { id: id, estado: 'Cancelada' };
}
