# feature: temporadas

Agrupa las telas por **temporada** (Verano / Invierno / Atemporal), permite filtrar
todas las vistas por temporada y corregir la temporada de cualquier tela.

## Estructura

```
config/temporadasBase.ts      Lista base (sembrada desde TEMPORADAS DE ARTICULOS.xlsx, 191 telas)
config/aliasTemporadas.ts     Equivalencias nombre del comprador → tela(s) de la app
logic/resolverTemporadas.ts   Temporada de cada tela: manual > lista exacta > equivalencia > sin asignar
logic/resumirPorTemporada.ts  Totales por temporada y unidad (reusa calcularIndicadores)
logic/filasTemporadas.ts      Filas de la vista: filtro de temporada/origen + agrupado
services/planillaTemporadas.ts Leer una lista .xlsx (ARTICULO/TELA + TEMP/TEMPORADA) y armar la exportación
store/useTemporadasStore.ts   Lista cargada + correcciones manuales (persistidas en localStorage)
hooks/useTemporadas.ts        useResolucionTemporadas, useTemporadaDe, useCatalogoPorTemporada
ui/EtiquetaTemporada.tsx      Etiqueta ícono + texto (también la usa la tabla de aciertos)
ui/TarjetasTemporada.tsx      Resumen por temporada; tocar una tarjeta filtra
ui/TablaTemporadas.tsx        Tabla agrupada con selector de temporada por fila y selección múltiple
ui/AccionesLista.tsx          Exportar Excel / Cargar lista / Restablecer
ui/PendientesLista.tsx        Nombres de la lista sin tela y conflictos
pages/TemporadasPage.tsx      Página /temporadas
```

## Reglas

- **De dónde sale la temporada** (gana la primera): corrección manual → la lista trae
  la tela con el mismo nombre (normalizado) → una equivalencia de `aliasTemporadas.ts`
  → sin asignar. Un nombre de la lista puede cubrir varias telas (`FLANNEL LUMINOSO` →
  liso y DSN).
- **Filtro global**: `useFiltrosStore.temporada` ('' todas, `'SIN'` sin asignar). Las
  vistas usan `useCatalogoPorTemporada()` en vez del catálogo crudo, así el filtro
  aplica igual en Lista, Telas, Tendencias, Ranking y Precios. En Tendencias el
  índice se calcula dentro de la temporada elegida (participación en las ventas y el
  stock de esa temporada). El hero de rollos sigue mostrando el total.
- **Correcciones**: se guardan en el navegador (localStorage, clave
  `aciertos.temporadas`). No hay backend: para pasarlas a otra PC se exporta el Excel
  y se carga allá. Elegir la misma temporada que dice la lista borra la corrección.
- **Exportar** genera una fila por tela de la app con su temporada vigente + las
  entradas de la lista que no cruzaron, con las columnas `ARTICULO` y `TEMP` que la
  carga vuelve a leer (ida y vuelta sin pérdida). **Cargar lista** reemplaza la lista
  base y descarta las correcciones (pide confirmación).
- KGS y MTS nunca se suman: las tarjetas muestran un bloque por unidad.

Con los exports de sep-2026: 185 de 278 telas asignadas = 93% de las unidades
vendidas; 11 nombres de la lista quedan sin cruce (ver `aliasTemporadas.ts`).
