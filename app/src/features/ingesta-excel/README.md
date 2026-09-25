# feature: ingesta-excel

Convierte uno o más Excel crudos del ERP en un `Catalogo` analizado, **en el navegador**.

## Flujo

```
File[] → LectorPlanilla (SheetJS)   → hojas de todos los archivos (cada una recuerda su archivo)
       → clasificarHojas            → tipo por ENCABEZADO (ventas / compras / stock por artículo / stock por tela)
                                      + moneda y rol (inicial/actual) por nombre de hoja o de archivo
       → resolverFuentes            → elige foto inicial y actual, descarta duplicados, arma la ventana
       → construirCatalogo          → une por código, usa dato medido o deriva por identidad, indicadores
       → controlesCalidad           → avisos (identidad inicial + compras − ventas = hoy)
```

`procesarArchivos()` es la fachada (hay un atajo `procesarPlanilla()` para un solo
archivo). Recibe el `LectorPlanilla` por inyección (DIP).

## Estructura

```
model/planilla.ts               Contratos LectorPlanilla / PlanillaCruda / ArchivoEntrada
model/fuentes.ts                FuentesErp: fotos de stock (por artículo o por tela), compras, ventas
services/LectorPlanillaXlsx.ts  Única pieza que conoce SheetJS
services/parsearErp.ts          Lectura por encabezado de cada tipo de export, filtro rubro TELAS
services/clasificarHojas.ts     Qué es cada hoja (tipo, moneda, rol, fecha)
services/resolverFuentes.ts     Cuál foto es la inicial y cuál la actual + ventana
services/controlesCalidad.ts    Foto duplicada, identidad contable por tela
services/unificarTelas.ts       OCP: une los grupos por diseño del ERP en telas
services/estrategiaReparto.ts   OCP: cómo repartir el stock de una tela entre sus artículos
services/construirCatalogo.ts   Agregación + derivación
services/procesarPlanilla.ts    Fachada
config/listaDestacada.ts        "Lista de 49" (dato de negocio editable)
config/unificacionTelas.ts      Alias del ERP y fusiones de telas aprobadas
ui/ExcelDropzone.tsx            Drag & drop de uno o varios archivos + feedback
ui/AvisosDatos.tsx              Panel de salvedades de datos
```

## Formatos soportados

| Export | Cómo se reconoce | Notas |
|--------|------------------|-------|
| Ventas | encabezado `Código de Articulo` + `Cant.` + `Nombre Unidad` | moneda por nombre: OFI / INTER / PESOS / BLUE. Se filtra el rubro TELAS. |
| Compras | encabezado `Clave Artículo` + `Cant.` | sin unidad ni grupo: se cruza por código |
| Stock por artículo | `Código` + `Nombre Unidad` + `Total Cantidad` (encabezado en 1 o 2 filas) | columnas por depósito se ignoran; se usa `Total Cantidad`. El legado "Stock al 3009" viene ×1000. |
| Stock por tela | `Descripción` + `Nombre Unidad` + `Total Cantidad` | agrupa por "Grupo Artículo" |

Rol de cada foto de stock: `inicial`/`30-09` → inicial; `hoy`/`actual` → actual; si
el nombre solo trae una fecha ("Stock al 5-8") completa el lugar vacío (la más vieja
es la inicial). Si la hoja se llama genérico ("Hoja2") se usa el nombre del archivo.

## Unificación en telas

El ERP crea un "Grupo Artículo" por diseño (`BRODERY PLANO dsn 4`, `POPLIN EST 2302`,
`CORDERITO 14`, `CAMISACO A57`). `UnificarPorDiseno` quita el sufijo de diseño y agrupa:

- todos estampados → una sola tela (`BRODERY PLANO`, dsn 1 a 7);
- si la tela también tiene artículos lisos → `X` (lisos) y `X DSN` (estampados),
  como en la Lista de 49 (`MODAL SOFT` / `MODAL SOFT DSN`); si la lista usa `X DSN`, se respeta;
- `X EST nnn` → `X EST`;
- no toca números que son parte de la tela (`JERSEY TUBULAR 24-1`, `BATISTA 90/10`, `CHAUD 1RA`);
- artículos sin grupo → tela conocida más larga que prefija la descripción (con alias);
- fusiones aprobadas por el comprador en `config/unificacionTelas.ts`, por nombre o prefijo
  (`POPLIN EST` → `POPLIN DSN`, `MORLEY EST …` → `MORLEY DSN`, typo `CASMISACO` → `CAMISACO`).

Con los exports de sep-2026: ~630 grupos del ERP → ~310 telas; la lista reconoce 48 de 49.
También se descartan códigos basura (`COMPRA / Concepto`, `NO`, `USARRR`).

## Derivación de datos

Por artículo se usa el dato **medido** si existe; si no, se deriva:

| Campo | Medido | Si falta |
|-------|--------|----------|
| `stockHoy` | foto actual por artículo | reparto del stock de la tela (`EstrategiaReparto`) |
| `compras` | export de compras | `max(0, hoy + ventas − inicial)` |
| `stockInicial` | foto inicial por artículo | `max(0, hoy + ventas − compras)` |

La tela usa su foto por tela cuando la hay (dato exacto) y si no, la suma de sus
artículos. Lo estimado queda en `Articulo.camposEstimados` y se muestra en la tabla.

## Controles de calidad

- **Foto inicial duplicada**: si la foto "inicial" por artículo tiene las mismas
  cantidades que la actual (pasó en sep-2026: el ERP ignoró la fecha), se descarta
  y se avisa. Si hay otra foto fechada (p. ej. "Stock al 5-8.xlsx") pasa a ser la inicial.
- **Identidad por tela**: con inicial y compras medidos, se informa cuántas telas no
  cierran `inicial + compras − ventas = hoy` y la diferencia neta por unidad.

## Notas de robustez

- Algunas hojas del ERP arrancan en la columna B (`!ref=B1:…`); el lector fuerza
  la lectura desde la columna A, y el parser igual ubica las columnas por encabezado.
- La "Lista de 49" no es derivable del Excel: es una lista curada en `config/`.
