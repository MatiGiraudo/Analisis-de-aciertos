/**
 * Tipos del dominio "catálogo de telas".
 *
 * Modela las entidades (Tela, Artículo) y los indicadores derivados
 * (sell-through, cobertura, recomendación, rotación, puntajes). Es el corazón
 * del negocio: no depende de React, SheetJS ni de ninguna feature de UI, por lo
 * que es 100% testeable de forma aislada (DIP + Screaming Architecture).
 *
 * Nomenclatura mapeada 1:1 desde `Aciertos_de_compra_9.html`:
 *   ini→stockInicial, com→compras, ven→ventas, hoy→stockHoy,
 *   disp→disponible, st→sellThrough, cob→cobertura, rec→recomendacion, rot→rotacion.
 */
import type { PorMoneda } from '@/shared/tipos/moneda';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';

/** Categorías de recomendación de compra (orden = índice, igual que en el HTML). */
export const enum Recomendacion {
  Aumentar = 0,
  Mantener = 1,
  Reducir = 2,
  Liquidar = 3,
  Revisar = 4,
}

/** Nivel de rotación derivado del sell-through. */
export type Rotacion = 'A' | 'M' | 'B' | 'N';

/**
 * Cantidades base de un ítem, todas en su `Unidad` (KGS o MTS).
 * `pc`/`pn` son las unidades facturadas y el neto por cada `Moneda`.
 */
export interface Metricas {
  readonly stockInicial: number; // ini — stock al inicio de la ventana (nunca negativo)
  readonly compras: number; // com — todo lo que entró durante la ventana
  readonly ventas: number; // ven
  readonly stockHoy: number; // hoy
  readonly unidadesPorMoneda: PorMoneda; // pc
  readonly netoPorMoneda: PorMoneda; // pn
}

/** Una tela (grupo de artículos/colores). Nivel de dato exacto del ERP. */
export interface Tela extends Metricas {
  readonly clase: 'tela';
  readonly nombre: string;
  readonly subRubro: SubRubro;
  readonly unidad: Unidad;
  readonly colores: number; // n — cantidad de artículos/colores
  readonly enLista: boolean; // inl — pertenece a la "Lista de 49"
}

/** Cantidades de un artículo que pueden venir estimadas en vez de medidas. */
export type CampoEstimado = 'stockInicial' | 'compras' | 'stockHoy';

/**
 * Un artículo (color individual).
 * OJO: según qué exports haya, algunas cantidades a este nivel son estimadas
 * (reparto o identidad contable) — ver `camposEstimados` y el README de ingesta.
 */
export interface Articulo extends Metricas {
  readonly clase: 'articulo';
  readonly codigo: string;
  readonly descripcion: string;
  readonly tela: string; // tela unificada a la que pertenece
  readonly grupoErp: string; // "Grupo Artículo" original del ERP ('' si no trae), p. ej. "BRODERY PLANO dsn 4"
  readonly subRubro: SubRubro;
  readonly unidad: Unidad;
  readonly enLista: boolean;
  /** Cantidades estimadas (no medidas) de este artículo; vacío si todo es dato real. */
  readonly camposEstimados: readonly CampoEstimado[];
}

/** Indicadores derivados que se calculan sobre cualquier `Metricas`. */
export interface Indicadores {
  readonly disponible: number; // disp = stockInicial + compras
  readonly sellThrough: number; // st ∈ [0,1] = ventas / disponible
  readonly cobertura: number; // cob = stockHoy / ventas (temporadas para agotar)
  readonly recomendacion: Recomendacion;
  readonly rotacion: Rotacion;
}

/** Puntajes de ranking (0–100), calculados por percentil dentro de cada unidad. */
export interface Puntajes {
  readonly puntajeReponer: number; // sRepo
  readonly puntajePlataParada: number; // sDead
}

/** Tela con indicadores + puntajes de ranking (percentil entre telas de su unidad). */
export type TelaAnalizada = Tela & Indicadores & Puntajes;

/** Artículo con indicadores + puntajes de ranking. */
export type ArticuloAnalizado = Articulo & Indicadores & Puntajes;

/** Conjunto de datos ya analizado, listo para las vistas. */
export interface Catalogo {
  readonly telas: readonly TelaAnalizada[];
  readonly lista: readonly TelaAnalizada[]; // subconjunto enLista
  readonly articulos: readonly ArticuloAnalizado[];
  readonly ventana: { readonly desde: string; readonly hasta: string };
  /** Salvedades de datos detectadas en la ingesta (se muestran al usuario). */
  readonly avisos: readonly string[];
}
