// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Movimientos.gs
// CRUD de movimientos (Pago / Avance / Ajuste).
// id_partida vacío = pago global de mano de obra por oficio.
// ============================================================

function getMovimientos_() {
  return getAllRows_(SHEETS.MOVIMIENTOS, MOVIMIENTOS_COLS);
}

function createMovimiento_(p, user) {
  var sheet = getSheet_(SHEETS.MOVIMIENTOS);
  var tipo = validateEnum_(p.tipo_movimiento, 'tipo_movimiento', TIPOS_MOVIMIENTO);
  var idPartida = '';
  if (p.id_partida !== undefined && p.id_partida !== null && p.id_partida !== '') {
    idPartida = validateId_(p.id_partida, 'id_partida');
    if (!findRowNumber_(getSheet_(SHEETS.PARTIDAS), idPartida)) fail_('La partida ' + idPartida + ' no existe', 404);
  }
  var obj = {
    id: getNextId_(sheet),
    fecha: validateDate_(p.fecha),
    id_partida: idPartida,
    tipo_movimiento: tipo,
    cantidad_ejecutada: validateNumber_(p.cantidad_ejecutada, 'cantidad_ejecutada', { min: 0 }),
    importe_pagado: validateNumber_(p.importe_pagado, 'importe_pagado', { min: 0 }),
    oficio: validateString_(p.oficio, 'oficio', { max: 60 }),
    responsable: validateString_(p.responsable, 'responsable', { max: 100 }),
    sector: validateString_(p.sector, 'sector', { max: 60 }),
    medio_pago: validateString_(p.medio_pago, 'medio_pago', { max: 40 }),
    observacion: validateString_(p.observacion, 'observacion', { max: 300 }),
    estado: 'Activo',
    fecha_creacion: new Date(),
    fecha_modificacion: new Date(),
    creado_por: user,
    modificado_por: user,
  };
  sheet.appendRow(rowFromObj_(obj, MOVIMIENTOS_COLS, MOVIMIENTOS_HEADERS));
  writeLog_('createMovimiento', 'id=' + obj.id + ' ' + tipo + ' $' + obj.importe_pagado, user);
  return rowToObj_(rowFromObj_(obj, MOVIMIENTOS_COLS, MOVIMIENTOS_HEADERS), MOVIMIENTOS_COLS);
}

function updateMovimiento_(p, user) {
  var id = validateId_(p.id, 'movimiento');
  var sheet = getSheet_(SHEETS.MOVIMIENTOS);
  var rowNum = findRowNumber_(sheet, id);
  if (!rowNum) fail_('Movimiento no encontrado: ' + id, 404);

  var updates = {};
  if (p.fecha !== undefined)            updates.fecha = validateDate_(p.fecha);
  if (p.tipo_movimiento !== undefined)  updates.tipo_movimiento = validateEnum_(p.tipo_movimiento, 'tipo_movimiento', TIPOS_MOVIMIENTO);
  if (p.cantidad_ejecutada !== undefined) updates.cantidad_ejecutada = validateNumber_(p.cantidad_ejecutada, 'cantidad_ejecutada', { min: 0 });
  if (p.importe_pagado !== undefined)   updates.importe_pagado = validateNumber_(p.importe_pagado, 'importe_pagado', { min: 0 });
  if (p.oficio !== undefined)           updates.oficio = validateString_(p.oficio, 'oficio', { max: 60 });
  if (p.responsable !== undefined)      updates.responsable = validateString_(p.responsable, 'responsable', { max: 100 });
  if (p.sector !== undefined)           updates.sector = validateString_(p.sector, 'sector', { max: 60 });
  if (p.medio_pago !== undefined)       updates.medio_pago = validateString_(p.medio_pago, 'medio_pago', { max: 40 });
  if (p.observacion !== undefined)      updates.observacion = validateString_(p.observacion, 'observacion', { max: 300 });

  updateFields_(SHEETS.MOVIMIENTOS, rowNum, MOVIMIENTOS_COLS, updates, user);
  writeLog_('updateMovimiento', 'id=' + id, user);
  return rowToObj_(sheet.getRange(rowNum, 1, 1, MOVIMIENTOS_HEADERS.length).getValues()[0], MOVIMIENTOS_COLS);
}

// Delete físico: los movimientos son registros contables individuales;
// borrarlos es la acción esperada (equivale a "deshacer" un asiento).
function deleteMovimiento_(p, user) {
  var id = validateId_(p.id, 'movimiento');
  var sheet = getSheet_(SHEETS.MOVIMIENTOS);
  var rowNum = findRowNumber_(sheet, id);
  if (!rowNum) fail_('Movimiento no encontrado: ' + id, 404);
  sheet.deleteRow(rowNum);
  writeLog_('deleteMovimiento', 'id=' + id, user);
  return { id: id };
}
