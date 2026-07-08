# Presupuesto & Contabilidad de Obra

Aplicación personal para llevar el **presupuesto** y la **contabilidad** de la construcción de una
casa: qué se presupuestó, cuánto se pagó realmente y cuál es el **desvío** (valor real vs pagado).

Sigue la metodología del ecosistema (ver `../project-standards/`): Vanilla HTML/CSS/JS + Google
Apps Script + Google Sheets como base de datos + GitHub Pages. **Color de marca: terracota.**

## Qué resuelve

- **Gastos de material** — cada compra queda registrada como un movimiento de pago sobre una partida.
- **Pagos de mano de obra** — lo que se le va pagando al albañil (semanal, por oficio).
- **Costo real de mano de obra** — el albañil pasa el costo unitario de cada trabajo; con los avances
  cargados se calcula el **valor teórico ejecutado** y se compara contra lo pagado → **desvío**.

## Estructura

```
index.html            SPA: shell + secciones (Resumen / Partidas / Pagos / Configuración)
config.js             versión, enums, CFG (URL API / modo demo), tema
app.js                callApi + utilidades UI + helpers de cálculo (nunca fetch() directo)
src/css/main.css      único stylesheet (paleta terracota + dark mode)
src/js/               lógica por sección: resumen · partidas · pagos · configuracion
src/data/demo.json    datos semilla (modo demo, sin backend)
apps-script/          backend GAS (pegar cada .gs en el editor)
docs/                 db_structure · gas-setup · project_workflow
```

## Uso

- **Modo demo (sin backend):** abrir con el server de preview
  (`py -m http.server 8811`) y navegar `http://localhost:8811`. Carga `src/data/demo.json`.
- **Con backend real:** seguir [`docs/gas-setup.md`](docs/gas-setup.md), desplegar el Web App y pegar
  su URL en **Configuración → URL del Web App**. Los datos pasan a persistir en Google Sheets.

## Modelo de datos

Ver [`docs/db_structure.md`](docs/db_structure.md). Hojas principales: `PARTIDAS`, `MOVIMIENTOS`,
`CONFIG`, catálogos `CAT_*`, `LOGS`, `ERRORS`.

## Versionado

La versión vive en `config.js` (`VERSION` + `CHANGELOG`). Cada cambio funcional bumpea la versión
antes del commit. Sin login (herramienta de un solo usuario).
