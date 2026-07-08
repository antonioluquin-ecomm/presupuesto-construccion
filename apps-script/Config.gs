// ============================================================
// PRESUPUESTO & CONTABILIDAD DE OBRA — Config.gs
// Constantes: nombres de hojas, mapas de columnas, enums.
// Es el contrato Sheet ↔ código: solo AGREGAR columnas al final, nunca reordenar.
// ============================================================

var SHEETS = {
  PARTIDAS:     'PARTIDAS',
  MOVIMIENTOS:  'MOVIMIENTOS',
  CONFIG:       'CONFIG',
  CAT_OFICIOS:  'CAT_OFICIOS',
  CAT_MEDIOS:   'CAT_MEDIOS_PAGO',
  CAT_SECTORES: 'CAT_SECTORES',
  LOGS:         'LOGS',
  ERRORS:       'ERRORS',
};

// Mapa de columnas (1-indexed). Audit columns al final.
var PARTIDAS_COLS = {
  id: 1, tipo: 2, oficio: 3, concepto: 4, sector: 5, responsable: 6,
  unidad: 7, cantidad_presupuestada: 8, costo_unitario: 9, estado: 10,
  fecha_creacion: 11, fecha_modificacion: 12, creado_por: 13, modificado_por: 14,
};

var MOVIMIENTOS_COLS = {
  id: 1, fecha: 2, id_partida: 3, tipo_movimiento: 4, cantidad_ejecutada: 5,
  importe_pagado: 6, oficio: 7, responsable: 8, sector: 9, medio_pago: 10,
  observacion: 11, estado: 12,
  fecha_creacion: 13, fecha_modificacion: 14, creado_por: 15, modificado_por: 16,
};

// Headers en el orden de las columnas (para Setup.gs).
var PARTIDAS_HEADERS = ['id', 'tipo', 'oficio', 'concepto', 'sector', 'responsable', 'unidad', 'cantidad_presupuestada', 'costo_unitario', 'estado', 'fecha_creacion', 'fecha_modificacion', 'creado_por', 'modificado_por'];
var MOVIMIENTOS_HEADERS = ['id', 'fecha', 'id_partida', 'tipo_movimiento', 'cantidad_ejecutada', 'importe_pagado', 'oficio', 'responsable', 'sector', 'medio_pago', 'observacion', 'estado', 'fecha_creacion', 'fecha_modificacion', 'creado_por', 'modificado_por'];

// Enums (espejo de config.js en el frontend).
var TIPOS_PARTIDA    = ['Material', 'Mano de obra'];
var TIPOS_MOVIMIENTO = ['Pago', 'Avance', 'Ajuste'];

// Catálogos por defecto (se crean en Setup si las hojas están vacías).
var DEFAULT_OFICIOS  = ['Albañilería', 'Plomería', 'Electricidad', 'Herrería', 'Pintura', 'Otro'];
var DEFAULT_MEDIOS   = ['Efectivo', 'Transferencia', 'Débito', 'Crédito', 'Cheque', 'Otro'];
var DEFAULT_SECTORES = ['General', 'Frente', 'Portones', 'Estructura', 'Instalaciones', 'Imprevistos'];

// Config por defecto (clave → valor) para la hoja CONFIG.
var DEFAULT_CONFIG = {
  nombre: 'Obra',
  descripcion: '',
  fondos_asignados: 0,
  moneda: 'ARS',
  imprevistos_pct: 10,
};
