# feature: precios

Precios ponderados por moneda. Cada venta se factura en una de tres monedas
(US$ oficial, US$ intermedio, $ pesos); acá se ve, para la moneda elegida, cuánto
volumen y neto movió cada ítem y su precio ponderado (`neto / unidades`).

## Estructura

```
logic/analizarPrecios.ts  Función pura: filtra por moneda + filtros, calcula participación,
                          precio ponderado y agregados (neto total, precio global)
pages/PreciosPage.tsx     Selector de moneda + alcance (Lista/Telas/Artículos) + tabla
```

Alcances: **Lista de 49**, **Todas las telas** o **Por artículo**. El aviso del
oficial recuerda que representa una fracción mínima de las unidades, así que sus
promedios se apoyan en poco volumen.
