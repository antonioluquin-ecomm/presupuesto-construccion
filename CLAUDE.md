# CLAUDE.md — Presupuesto & Contabilidad de Obra

Instrucciones para Claude Code / Codex en este proyecto. Hereda las reglas compartidas de
`../project-standards/` (`ai_rules.md`, `style_guide.md`, `apps_script_standards.md`,
`google_sheets_standards.md`). Esto NO las reemplaza, las especializa.

## Qué es

Herramienta **personal** (un solo usuario, **sin login**) para el presupuesto y la contabilidad de la
construcción de una casa. Stack canónico: Vanilla JS + Apps Script + Sheets + GitHub Pages.
Color de marca: **terracota** (`--primary: #c2410c`).

## Stack y arquitectura

- Frontend HTML/CSS/Vanilla JS, sin frameworks ni dependencias externas.
- SPA (Tipo B): un `index.html` con secciones conmutadas por JS; lógica por sección en `src/js/`.
- Backend GAS: un `doPost` + router en `Code.gs`; `doGet` solo para `getInitialData`.
- Respuesta siempre `{ ok:true, data }` / `{ ok:false, error }`.
- Base de datos en Google Sheets — mapa de columnas en `apps-script/Config.gs` (contrato Sheet↔código),
  documentado en `docs/db_structure.md`.
- Modo demo: `src/data/demo.json` cuando no hay URL de API (`CFG.isMock()`).

## Dominio

- **PARTIDAS** — ítems presupuestados. `tipo` ∈ {Material, Mano de obra}, con `costo_unitario` y
  `cantidad_presupuestada`.
- **MOVIMIENTOS** — `tipo_movimiento` ∈ {Pago, Avance, Ajuste}. `Pago` mueve `importe_pagado`;
  `Avance` mueve `cantidad_ejecutada` (genera valor teórico = ejecutado × costo_unitario).
  `id_partida` vacío = pago global de mano de obra por oficio.
- **Cálculo clave**: por partida `teorico = ejec × costo_unitario`, `desvio = pagado − teorico`.

## Convenciones locales

- `action` (no `accion`) como clave de operación en el body POST.
- Handlers de dominio: `verbo + Entidad_` con sufijo `_` (ej. `createPartida_`). Helpers genéricos
  también con `_`. Solo `doGet/doPost/setup*/migrar*/_test*` son públicas.
- Soft delete siempre: `estado = Cancelada`, nunca borrar filas.
- Todo `update*`/`delete*` registra en `LOGS`.
- Sin `fetch()` directo en `src/js/`: usar los helpers de `app.js`.
- `escapeHtml()` en todo dato externo antes de `innerHTML`.
- Colores solo vía variables CSS (nunca hardcodeados) para no romper dark mode.

## Versionado obligatorio

Actualizar `config.js` → `VERSION` (y su nota) y prepender `CHANGELOG` **antes del commit** de cada
cambio funcional. Minor = feature; Patch = fix/UX/estilo; Major = breaking; Docs = sin bump.

## Reglas de trabajo

- No hacer push sin confirmación explícita.
- No reescribir layout, estilos ni paleta sin consultar.
- Verificar visualmente con el preview antes de reportar una tarea como completa.

## Documentación estándar compartida

- [`../project-standards/ai_rules.md`](../project-standards/ai_rules.md)
- [`../project-standards/style_guide.md`](../project-standards/style_guide.md)
- [`../project-standards/apps_script_standards.md`](../project-standards/apps_script_standards.md)
- [`../project-standards/google_sheets_standards.md`](../project-standards/google_sheets_standards.md)
- [`../project-standards/application_shell.md`](../project-standards/application_shell.md)
