// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Code.gs
// Entry points y router. Sin lógica de negocio.
// Sin login (herramienta personal): no hay validación de sesión.
// Contrato de respuesta: { ok:true, data } / { ok:false, error, code }
// ============================================================

// ── doGet — lecturas (getInitialData) + health ────────────────
function doGet(e) {
  var action = (e && e.parameter) ? e.parameter.action : '';
  try {
    if (action === 'health')          return okResponse_({ status: 'running', timestamp: new Date().toISOString() });
    if (action === 'getInitialData')  return okResponse_(getInitialData_());
    return errorResponse_('Acción GET no permitida: ' + action, 400);
  } catch (err) {
    writeError_('doGet:' + action, err.message, err.stack, '');
    return errorResponse_(err.expected ? err.message : 'Error interno', err.code || 500);
  }
}

// ── doPost — escrituras ───────────────────────────────────────
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return errorResponse_('JSON inválido', 400); }

  var action = body.action;
  var params = body.params || {};
  var user = currentUser_();

  try {
    var result = routePost_(action, params, user);
    return okResponse_(result);
  } catch (err) {
    if (err && err.expected) return errorResponse_(err.message, err.code || 400);
    writeError_(action || 'doPost', err.message, err.stack, user);
    return errorResponse_('Error interno del servidor', 500);
  }
}

// ── Router ────────────────────────────────────────────────────
function routePost_(action, params, user) {
  switch (action) {
    // Lecturas (también disponibles por POST).
    case 'getInitialData':  return getInitialData_();

    // Partidas.
    case 'createPartida':   return createPartida_(params, user);
    case 'updatePartida':   return updatePartida_(params, user);
    case 'deletePartida':   return deletePartida_(params, user);

    // Movimientos.
    case 'createMovimiento': return createMovimiento_(params, user);
    case 'updateMovimiento': return updateMovimiento_(params, user);
    case 'deleteMovimiento': return deleteMovimiento_(params, user);

    // Config y mantenimiento.
    case 'updateConfig':    return updateConfig_(params, user);
    case 'runMigracion':    return migrar_();

    default:
      var e = new Error('Acción desconocida: ' + action); e.expected = true; e.code = 400; throw e;
  }
}

// ── Test manual desde el editor ───────────────────────────────
function _testDoGet() {
  var fake = { parameter: { action: 'getInitialData' } };
  Logger.log(doGet(fake).getContent());
}
