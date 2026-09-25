# feature: catalogo (dominio)

El corazón del negocio. Define las **entidades** (Tela, Artículo) y las **reglas**
que derivan los indicadores. No depende de React, SheetJS ni de otras features, y
está cubierto por tests.

## Estructura

```
model/tipos.ts        Tela, Articulo, Indicadores, Puntajes, Catalogo, Recomendacion, Rotacion
logic/derivar.ts      calcularIndicadores(): disponible, sell-through, cobertura, recomendación, rotación
logic/recomendacion.ts Motor OCP: REGLAS_RECOMENDACION (tabla) + evaluarRecomendacion()
logic/rotacion.ts     clasificarRotacion()
logic/puntajes.ts     calcularPuntajes(): sRepo/sDead por percentil dentro de cada unidad
store/useCatalogoStore.ts  Catálogo cargado + acción cargarDesdeArchivo
store/useFiltrosStore.ts   Filtros/orden/paginación de todas las vistas
```

## Fórmulas (portadas 1:1 del HTML original)

- `disponible = stockInicial + compras`
- `sellThrough = clamp(ventas / disponible, 0, 1)`
- `cobertura   = stockHoy / ventas` (999 si hay stock sin ventas)
- **Recomendación**: Liquidar (sin ventas y con stock) · Aumentar (st≥.70 y cob≤.50)
  · Mantener (st≥.30 y cob≤2) · Reducir (cob>2 o st<.30) · Revisar (resto).
- **Rotación**: N (sin ventas) · A (st≥.70) · M (st≥.30) · B (resto).
- **Puntajes de ranking**: percentil de ventas/stock **por unidad** (KGS y MTS por
  separado), combinado con sell-through y urgencia/exceso de cobertura.

Clave: los indicadores dependen solo de `disponible`, `ventas` y `stockHoy` — no
de cómo se reparte `disponible` entre stock inicial y compras.
