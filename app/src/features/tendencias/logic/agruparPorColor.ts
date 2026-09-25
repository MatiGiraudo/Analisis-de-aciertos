/**
 * Colores de tendencia: agrega los artículos por COLOR, a través de todas las telas.
 *
 * Función pura. Regla de negocio central: KGS y MTS nunca se suman, así que cada
 * color se agrega POR UNIDAD ("NEGRO · KGS" y "NEGRO · MTS" son filas distintas).
 *
 * Indicadores por color:
 *  - participación en ventas = ventas del color / ventas de su unidad;
 *  - participación en stock  = disponible del color / disponible de su unidad;
 *  - índice de tendencia     = part. ventas / part. stock. > 1: el color se vende
 *    más de lo que pesa en el depósito (tira); < 1: pesa más de lo que vende (frena).
 */
import type { ArticuloAnalizado } from '@/features/catalogo/model/tipos';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';
import { extraerColor } from './extraerColor';

export interface ColorTendencia {
  readonly color: string;
  readonly unidad: Unidad;
  /** Artículos (color × tela) ordenados por ventas desc. */
  readonly articulos: readonly ArticuloAnalizado[];
  readonly telas: number;
  readonly ventas: number;
  readonly disponible: number;
  readonly stockHoy: number;
  readonly sellThrough: number;
  readonly participacionVentas: number;
  readonly participacionStock: number;
  /** null cuando el color no tiene disponible (no hay contra qué comparar). */
  readonly indice: number | null;
}

export type OrdenTendencia = 'ventas' | 'indice' | 'st' | 'stock';

/**
 * Qué colores mostrar. "relevantes" evita que colores con ventas ínfimas encabecen
 * el índice (5 kg vendidos sobre 1 kg de stock dan un índice enorme pero no son tendencia).
 */
export type AlcanceTendencia = 'relevantes' | 'conVentas' | 'todos';

/** Participación mínima en las ventas de su unidad para ser "relevante". */
export const PARTICIPACION_RELEVANTE = 0.005;

export interface CriteriosTendencia {
  readonly q: string;
  readonly unidad: Unidad | '';
  readonly subRubro: SubRubro | '';
  readonly orden: OrdenTendencia;
  readonly alcance: AlcanceTendencia;
}

/** Agrega por color × unidad. Los artículos sin color (estampados) se ignoran. */
export function agruparPorColor(articulos: readonly ArticuloAnalizado[], c: CriteriosTendencia): ColorTendencia[] {
  let base = articulos;
  if (c.unidad) base = base.filter((a) => a.unidad === c.unidad);
  if (c.subRubro) base = base.filter((a) => a.subRubro === c.subRubro);

  const totales = new Map<Unidad, { ventas: number; disponible: number }>();
  const grupos = new Map<string, { color: string; unidad: Unidad; arts: ArticuloAnalizado[] }>();
  for (const a of base) {
    const t = totales.get(a.unidad) ?? { ventas: 0, disponible: 0 };
    t.ventas += Math.max(0, a.ventas);
    t.disponible += a.disponible;
    totales.set(a.unidad, t);

    const color = extraerColor(a.descripcion, a.grupoErp, a.tela);
    if (!color) continue;
    const clave = `${color}|${a.unidad}`;
    const g = grupos.get(clave);
    if (g) g.arts.push(a);
    else grupos.set(clave, { color, unidad: a.unidad, arts: [a] });
  }

  const q = c.q.trim().toLowerCase();
  const r: ColorTendencia[] = [];
  for (const { color, unidad, arts } of grupos.values()) {
    const ventas = arts.reduce((s, a) => s + Math.max(0, a.ventas), 0);
    if (q && !color.toLowerCase().includes(q) && !arts.some((a) => a.tela.toLowerCase().includes(q))) continue;

    const disponible = arts.reduce((s, a) => s + a.disponible, 0);
    const tot = totales.get(unidad)!;
    const participacionVentas = tot.ventas > 0 ? ventas / tot.ventas : 0;
    if (c.alcance === 'conVentas' && ventas <= 0) continue;
    if (c.alcance === 'relevantes' && participacionVentas < PARTICIPACION_RELEVANTE) continue;
    const participacionStock = tot.disponible > 0 ? disponible / tot.disponible : 0;
    r.push({
      color,
      unidad,
      articulos: arts.slice().sort((a, b) => b.ventas - a.ventas),
      telas: new Set(arts.map((a) => a.tela)).size,
      ventas,
      disponible,
      stockHoy: arts.reduce((s, a) => s + a.stockHoy, 0),
      sellThrough: disponible > 0 ? Math.min(1, ventas / disponible) : 0,
      participacionVentas,
      participacionStock,
      indice: participacionStock > 0 ? participacionVentas / participacionStock : null,
    });
  }

  return r.sort(COMPARADORES[c.orden]);
}

const COMPARADORES: Record<OrdenTendencia, (a: ColorTendencia, b: ColorTendencia) => number> = {
  ventas: (a, b) => b.ventas - a.ventas,
  indice: (a, b) => (b.indice ?? -1) - (a.indice ?? -1) || b.ventas - a.ventas,
  st: (a, b) => b.sellThrough - a.sellThrough || b.ventas - a.ventas,
  stock: (a, b) => b.stockHoy - a.stockHoy,
};
