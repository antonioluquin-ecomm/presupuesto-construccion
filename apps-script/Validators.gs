// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Validators.gs
// Validación de campos y reglas de negocio. Lanza Error con .expected.
// ============================================================

function fail_(msg, code) { var e = new Error(msg); e.expected = true; e.code = code || 400; throw e; }

function validateString_(v, campo, opts) {
  opts = opts || {};
  var s = (v === undefined || v === null) ? '' : String(v).trim();
  if (!s && opts.required) fail_('El campo "' + campo + '" es obligatorio');
  if (opts.max && s.length > opts.max) fail_('El campo "' + campo + '" excede ' + opts.max + ' caracteres');
  return s;
}

function validateNumber_(v, campo, opts) {
  opts = opts || {};
  if ((v === undefined || v === null || v === '') && !opts.required) return 0;
  var num = Number(v);
  if (isNaN(num)) fail_('El campo "' + campo + '" debe ser numérico');
  if (opts.min !== undefined && num < opts.min) fail_('El campo "' + campo + '" no puede ser menor a ' + opts.min);
  return num;
}

function validateEnum_(v, campo, allowed) {
  var s = String(v || '').trim();
  if (allowed.indexOf(s) === -1) fail_('Valor inválido para "' + campo + '": ' + s);
  return s;
}

function validateId_(v, campo) {
  var id = parseInt(v, 10);
  if (isNaN(id) || id <= 0) fail_('El id de "' + campo + '" es inválido');
  return id;
}

// Fecha ISO (yyyy-mm-dd). Vacío permitido → hoy.
function validateDate_(v) {
  var s = String(v || '').slice(0, 10);
  if (!s) return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) fail_('Fecha inválida: ' + v);
  return s;
}
