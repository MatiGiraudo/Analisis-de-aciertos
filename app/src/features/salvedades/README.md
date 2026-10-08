# feature: salvedades

Detalle de las **salvedades de datos** de la ingesta. Hoy detalla la más frecuente:
telas donde `inicial + compras − ventas ≠ stock hoy`, con los artículos que lo explican.

## Estructura

```
logic/detallarDescuadres.ts  Telas que no cierran + artículos descuadrados + causa probable (tabla CAUSAS, OCP)
logic/exportarDescuadres.ts  Planilla de exportación (una fila por tela y por artículo)
ui/TablaDescuadres.tsx       Tabla con acordeón tela → artículos
pages/SalvedadesPage.tsx     Pestaña /salvedades (solo visible si hay avisos)
```

## Reglas

- Diferencia = `stock hoy − (inicial + compras − ventas)`, la misma función
  (`diferenciaIdentidad`) que usa el aviso de la ingesta. Tolerancia: 1 unidad.
  **Negativa** = falta stock (salió algo que no figura como venta); **positiva** =
  sobra stock (entró algo que no figura como compra).
- Causa probable por artículo, primera regla que aplica: vendió sin inicial ni
  compras → apareció stock sin inicial ni compra → ventas netas negativas
  (devoluciones) → sobra → falta. Es una pista para revisar en el ERP, no un dato.
- "Diferencia que no se ve en ningún artículo": cuando el stock de la tela viene de
  una foto por tela, parte del descuadre no se puede atribuir a un artículo.
- Respeta los filtros compartidos (unidad, sub rubro, temporada, búsqueda por tela,
  color o código). Exportar Excel baja exactamente lo filtrado.
