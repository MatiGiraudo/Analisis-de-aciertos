# feature: ranking

Ordena **telas** por dos criterios de acción y, dentro de cada tela (acordeón), sus colores:

- **Reponer ya** (`puntajeReponer`): se vendió bien y está por agotarse.
- **Plata parada** (`puntajePlataParada`): capital inmovilizado que no rota.

## Estructura

```
logic/rankear.ts           Función pura: filtra telas por puntaje>0 + filtros compartidos, ordena desc
                           y adjunta los colores de cada tela ordenados por su propio puntaje
ui/FilaRankingTela.tsx     Fila de tela + acordeón de colores
ui/BarraPuntaje.tsx        Puntaje 0–100 con barra por recomendación (tela y color)
pages/RankingPage.tsx      Segmentos (modo / alcance), estado del acordeón y lista rankeada
```

Los puntajes se calculan en el dominio (`catalogo/logic/puntajes.ts`) con la misma
fórmula para telas y artículos, por percentil **dentro de cada unidad** (telas contra
telas, colores contra colores). El alcance permite limitar a la Lista de 49.
La búsqueda encuentra una tela por su nombre o por el código/descripción de un color;
en ese caso la tela se abre sola. Los colores sin puntaje en el modo activo se
muestran atenuados al final del acordeón.
