# feature: aciertos

Dos vistas de tabla por tela: **Lista de 49** y **Telas y colores**. Cada tela se
despliega (acordeón) y muestra sus colores con las mismas columnas. Reemplaza a la
antigua pestaña **Artículos** y al drill-down tela → artículos (`/articulos`
redirige a `/telas`). Una sola página (`VistaAciertos`) parametrizada por `fuente` (DRY).

## Estructura

```
logic/filtrarOrdenar.ts   Función pura: filtros compartidos + orden (telas o artículos)
logic/telasConColores.ts  Telas filtradas/ordenadas, cada una con sus colores para el acordeón
ui/HeroRollos.tsx         Los dos "rollos" con el % vendido global por unidad
ui/ChipsRecomendacion.tsx Fichas que cuentan y filtran por recomendación
ui/BarraFiltros.tsx       Búsqueda + unidad + sub rubro + rotación + orden (reutilizada en otras features)
ui/TablaAciertos.tsx      Tabla ordenable por tela con sub-filas de colores
pages/VistaAciertos.tsx   Orquesta dataset + filtros + paginación + estado del acordeón
```

## Comportamiento

- Click en una tela → despliega sus colores, ordenados con el mismo criterio de la tabla.
- La búsqueda encuentra una tela por su nombre (muestra todos sus colores) o por el
  código/descripción de un color (muestra solo los que coinciden y la abre sola).
- Los filtros de unidad, sub rubro, rotación y recomendación se aplican a la tela.
- Los chips ocultan las categorías sin filas y togglean el filtro de recomendación.
- La columna *Compras* muestra `*` cuando hay unidades compradas que no ingresaron
  al stock (`disponible − ventas − stockHoy > 0`).
- Paginación (50 telas por página) con el componente compartido `shared/ui/Paginacion`;
  cambiar un filtro u orden vuelve a la página 1.
