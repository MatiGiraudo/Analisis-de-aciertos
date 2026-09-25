# feature: tendencias

**Colores de tendencia**: qué colores se venden más a través de todas las telas y si
tiran o frenan respecto de su peso en el stock.

## Estructura

```
logic/extraerColor.ts     Saca el color de la descripción del ERP (quita grupo, "dsn N", "vte N")
logic/agruparPorColor.ts  Agrega por color × unidad, participaciones e índice de tendencia
ui/TablaColores.tsx       Tabla de colores con acordeón de artículos (color × tela)
ui/IndiceTendencia.tsx    Índice con ▲ tira / ▼ frena
pages/TendenciasPage.tsx  Orden, alcance y filtros compartidos (búsqueda, unidad, sub rubro)
```

## Reglas

- **KGS y MTS nunca se suman**: "NEGRO · KGS" y "NEGRO · MTS" son filas distintas.
- **Índice de tendencia** = (ventas del color ÷ ventas de su unidad) ÷ (disponible del
  color ÷ disponible de su unidad). ≥ 1,2 tira (se vende más de lo que pesa en el
  stock); ≤ 0,8 frena.
- Por defecto se muestran los colores **relevantes** (≥ 0,5% de las ventas de su
  unidad) para que colores con ventas ínfimas no encabecen el índice.
- Los artículos sin color (estampados identificados solo por código de diseño) no se
  cuentan. El color se toma tal como lo escribe el ERP: "COFFE" y "COFFE CLARO" son
  colores distintos.
