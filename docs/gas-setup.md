# Setup del backend (Google Apps Script + Sheets)

Pasos para pasar del **modo demo** (datos locales) a **datos reales** persistidos en Google Sheets.

## 1. Crear la planilla

1. Creá una Google Sheet nueva (Drive → Nuevo → Hoja de cálculo). No hace falta crear hojas a mano;
   `setup()` las genera.
2. Copiá el **ID** de la URL: `https://docs.google.com/spreadsheets/d/`**`<ESTE_ID>`**`/edit`.

## 2. Crear el proyecto de Apps Script

1. Andá a [script.google.com](https://script.google.com) → **Nuevo proyecto**.
2. Creá una pestaña (archivo) por cada `.gs` de [`apps-script/`](../apps-script/) y pegá su contenido.
   Archivos: `Code`, `Config`, `Helpers`, `Validators`, `Partidas`, `Movimientos`, `Dashboard`,
   `Logger`, `Setup`, `Migracion`, `Seed`.
3. **Configuración del proyecto → Propiedades de la secuencia de comandos** → agregá:
   - `SPREADSHEET_ID` = el ID del paso 1.

## 3. Inicializar

1. En el editor, seleccioná la función **`setup`** y ejecutala (▶). Autorizá los permisos que pida.
   Crea las hojas `PARTIDAS`, `MOVIMIENTOS`, `CONFIG`, `LOGS`, `ERRORS` y los `CAT_*`.
2. (Opcional) Para importar los datos del Excel original, ejecutá **`migrar`**. Es idempotente:
   marca `CONFIG.migrado = SI` y no vuelve a duplicar.

## 4. Desplegar como Web App

1. **Implementar → Nueva implementación → Tipo: Aplicación web**.
2. Configuración:
   - **Ejecutar como:** yo.
   - **Quién tiene acceso:** Cualquier persona.
3. Copiá la **URL del Web App** (`…/exec`).

## 5. Conectar el frontend

- Opción A (recomendada): pegá la URL en **Configuración → URL del Web App** dentro de la app y
  guardá. Queda en `localStorage` (`obra_api_url`).
- Opción B: hardcodeá la URL en `config.js` → `APPS_SCRIPT_URL` para que funcione out-of-the-box.

Con la URL cargada, la app deja el modo demo y lee/escribe en la planilla. Verificalo: creá un
movimiento en la UI y confirmá que aparece en la hoja `MOVIMIENTOS` y persiste al recargar.

## Notas

- El backend **no usa login** (herramienta personal). Cualquiera con la URL puede escribir: no
  compartas la URL del Web App públicamente.
- Reglas de despliegue: cada cambio en un `.gs` requiere **Implementar → Gestionar implementaciones →
  editar → Nueva versión** para que tome efecto en la URL existente.
- Salud del servicio: `…/exec?action=health`.
