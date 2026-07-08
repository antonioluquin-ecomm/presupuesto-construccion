# Workflow del proyecto

## Qué es

Herramienta personal (sin login) para el presupuesto y la contabilidad de la construcción de una
casa. Migración del Excel + `index.html` monolítico original al estándar del ecosistema
(`../project-standards/`). El HTML viejo quedó archivado en [`legacy/`](legacy/index-legacy.html)
como referencia.

## Estructura

Ver [`README.md`](../README.md). SPA (`index.html`) + `config.js` + `app.js` + `src/css/main.css` +
módulos `src/js/` (uno por sección). Backend en `apps-script/`. Base de datos: ver
[`db_structure.md`](db_structure.md). Setup del backend: ver [`gas-setup.md`](gas-setup.md).

## Cómo correr

- **Local (demo):** `py -m http.server 8811` (o el server de preview `obra-static` de
  `.claude/launch.json`) → `http://localhost:8811`. Usa `src/data/demo.json`.
- **Real:** configurar la URL del Web App (ver `gas-setup.md`).

## Zonas sensibles (no tocar sin consultar)

- **Paleta / identidad terracota** en `src/css/main.css` (`:root`). No cambiar colores fuera de las
  variables CSS.
- **Contrato de columnas** (`apps-script/Config.gs` `*_COLS` ↔ hojas). Solo agregar columnas al final.
- **Cálculo de dominio** (`app.js`: `enrichPartida`, `calcResumen`). Es el corazón del "valor real vs
  pagado".

## Convención de datos

- `src/data/demo.json` es la fuente del modo demo **y** del seed de migración
  (`apps-script/Seed.gs` se genera desde ahí con `scratchpad/gen_seed.py`). Si cambia el demo,
  regenerar `Seed.gs`.

## Aprendizajes

- El modelo original (ítems + movimientos con tipos Pago/Avance) ya resolvía bien el problema; se
  conservó tal cual y solo se reestructuró y se le agregó backend real.

## Versionado

`config.js` → `VERSION` + `CHANGELOG`. Bump antes de cada commit funcional.
