# Estructura de la base de datos (Google Sheets)

Una planilla, una hoja por tabla. El **orden de las columnas es el contrato** con los mapas
`*_COLS` de [`apps-script/Config.gs`](../apps-script/Config.gs): solo se pueden **agregar** columnas
al final, nunca reordenar ni renombrar. `id` autoincremental en la columna A.

## PARTIDAS

Ítems presupuestados (lo que se planifica gastar). El `costo_unitario` es el precio que pasa el
albañil (mano de obra) o el corralón (material).

| col | campo | notas |
|-----|-------|-------|
| A | id | autoincremental |
| B | tipo | `Material` \| `Mano de obra` |
| C | oficio | solo mano de obra (Albañilería, Plomería, …) |
| D | concepto | descripción del ítem |
| E | sector | General, Frente, Portones… |
| F | responsable | corralón / cuadrilla |
| G | unidad | m², ml, bolsa, global… |
| H | cantidad_presupuestada | número |
| I | costo_unitario | precio por unidad |
| J | estado | `Activa` \| `Cancelada` (soft delete) |
| K–N | fecha_creacion, fecha_modificacion, creado_por, modificado_por | auditoría |

`total = cantidad_presupuestada × costo_unitario` (calculado, no almacenado).

## MOVIMIENTOS

Hechos contables: pagos, avances y ajustes.

| col | campo | notas |
|-----|-------|-------|
| A | id | autoincremental |
| B | fecha | ISO `yyyy-mm-dd` |
| C | id_partida | FK a PARTIDAS. **Vacío** = pago global de mano de obra por oficio |
| D | tipo_movimiento | `Pago` \| `Avance` \| `Ajuste` |
| E | cantidad_ejecutada | usado por `Avance` (cuánto se hizo) |
| F | importe_pagado | usado por `Pago` (cuánto se pagó) |
| G | oficio | para pagos globales de mano de obra |
| H | responsable | |
| I | sector | |
| J | medio_pago | Efectivo, Transferencia… |
| K | observacion | |
| L | estado | `Activo` \| `Cancelado` |
| M–P | auditoría | |

### Cálculos derivados (en el frontend, `app.js`)

- Por partida: `ejecutado = Σ cantidad_ejecutada` (avances), `pagado = Σ importe_pagado`.
- `valor real (teórico) = ejecutado × costo_unitario` → lo que "vale" lo hecho.
- `desvío = pagado − teórico` → positivo = pagado de más; negativo = a favor.

## CONFIG

Clave/valor. Claves: `nombre`, `descripcion`, `fondos_asignados`, `moneda`, `imprevistos_pct`,
`migrado` (bandera interna de la migración).

## Catálogos

`CAT_OFICIOS`, `CAT_MEDIOS_PAGO`, `CAT_SECTORES` — una columna con header. Editables desde
**Configuración** en la UI (en modo demo viven en memoria).

## Sistema

`LOGS` (fecha, usuario, action, detalle) y `ERRORS` (fecha, usuario, action, mensaje, stack).
