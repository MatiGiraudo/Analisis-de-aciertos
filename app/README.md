# Aciertos de compra · Telas

Dashboard dinámico para evaluar qué tan bien se compró cada tela, alimentado por
el Excel del ERP. Reescritura de `Aciertos_de_compra_9.html` como app React.

## Stack

React 19 · TypeScript · Vite · Zustand · React Router · Tailwind v4 · Lucide ·
React-Toastify · SheetJS (xlsx). Tests con Vitest.

## Cómo correr

```bash
cd app
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm test           # tests de dominio + integración
npm run build      # bundle de producción
npm run typecheck  # solo chequeo de tipos
```

Al abrir la app, arrastrá los Excel del ERP (se pueden soltar varios juntos, p. ej.
`Datos para reporte final.xlsx` + `Stock al 5-8.xlsx`). Todo el cálculo ocurre en el
navegador; no se sube nada a ningún servidor.

## Datos

Los Excel con datos reales de la empresa **no se versionan** (ver `.gitignore` en la
raíz). Los tests de integración que los usan esperan encontrarlos en la raíz del repo
(un nivel arriba de `app/`) y se saltean si no están.

## Deploy (Vercel)

- **Root Directory:** `app`
- **Framework:** Vite (build `npm run build`, output `dist`), detectado automáticamente.
- `vercel.json` redirige todas las rutas a `index.html` para que React Router
  funcione al recargar (`/telas`, `/ranking`…).

## Arquitectura (SCREAM · SOLID · DRY)

La estructura **grita el negocio**, no el framework: cada carpeta de `features/`
es un caso de uso vertical.

```
src/
  app/            Composición: router, layout, providers
  features/
    ingesta-excel/  Subir y parsear el Excel del ERP → Catalogo
    catalogo/       Dominio: entidades + reglas (derivar, recomendar, puntajes) + stores
    aciertos/       Vistas Lista / Todas las telas / Artículos
    ranking/        Reponer ya / Plata parada
    precios/        Precios ponderados por moneda
    tendencias/     Colores de tendencia (color × unidad)
    temporadas/     Telas por temporada (verano / invierno / atemporal), filtro global y correcciones
  shared/         Transversal: formato numérico, tipos base, UI reutilizable
```

**Regla de dependencias:** `features/*` y `app/` importan de `shared/` y de
`catalogo/`; nunca al revés. `catalogo/` no depende de UI ni de SheetJS, así que
el dominio es testeable en aislamiento.

- **SOLID** — SRP por servicio (leer ≠ parsear ≠ agregar ≠ derivar); OCP en las
  reglas de recomendación (tabla de estrategias) y en el reparto de stock
  (interfaz `EstrategiaReparto`); DIP vía `LectorPlanilla` / `EscritorPlanilla` (abstraen SheetJS) y
  los stores.
- **DRY** — una sola fuente de formato (`shared/formato`), un único pipeline
  `derivar`/`puntajes` reutilizado por todas las vistas.

## Modelo de datos

Ver [`features/catalogo/README.md`](src/features/catalogo/README.md) y
[`features/ingesta-excel/README.md`](src/features/ingesta-excel/README.md) para
las fórmulas y la derivación desde el Excel (incluida la salvedad de que el stock
por artículo es estimado).
