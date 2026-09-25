/**
 * Filtrado y ordenamiento de filas de aciertos (función pura, reutilizable).
 *
 * Un solo lugar aplica todos los filtros compartidos (búsqueda, unidad, sub
 * rubro, rotación, recomendación) y el orden elegido, tanto para telas como para
 * artículos (DRY). Portado de `rows()` del HTML. No toca el DOM ni el store.
 */
import type { ArticuloAnalizado, Indicadores, TelaAnalizada } from '@/features/catalogo/model/tipos';
import type { OrdenTabla } from '@/features/catalogo/store/useFiltrosStore';
import type { Recomendacion, Rotacion } from '@/features/catalogo/model/tipos';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';

/** Cualquier fila mostrable (tela o artículo ya analizado). */
export type FilaAciertos = TelaAnalizada | ArticuloAnalizado;

export interface CriteriosFiltro {
  readonly q: string;
  readonly unidad: Unidad | '';
  readonly subRubro: SubRubro | '';
  readonly rotacion: Rotacion | '';
  readonly recomendacion: Recomendacion | null;
  readonly orden: OrdenTabla;
}

/** Texto buscable de una fila (nombre/código + descripción + tela). */
function textoBuscable(f: FilaAciertos): string {
  if (f.clase === 'tela') return `${f.nombre} ${f.subRubro}`.toLowerCase();
  return `${f.codigo} ${f.descripcion} ${f.tela}`.toLowerCase();
}

/** Comparadores de orden, indexados por clave (portados del HTML). */
const COMPARADORES: Record<OrdenTabla, (a: FilaAciertos & Indicadores, b: FilaAciertos & Indicadores) => number> = {
  ven: (a, b) => b.ventas - a.ventas,
  hoy: (a, b) => b.stockHoy - a.stockHoy,
  com: (a, b) => b.compras - a.compras,
  ini: (a, b) => b.stockInicial - a.stockInicial,
  disp: (a, b) => b.disponible - a.disponible,
  st: (a, b) => b.sellThrough - a.sellThrough,
  st_asc: (a, b) => a.sellThrough - b.sellThrough,
  cob: (a, b) => b.cobertura - a.cobertura,
  n: (a, b) => colores(b) - colores(a),
  rec: (a, b) => a.recomendacion - b.recomendacion || b.ventas - a.ventas,
  name: (a, b) => nombre(a).localeCompare(nombre(b), 'es'),
};

function colores(f: FilaAciertos): number {
  return f.clase === 'tela' ? f.colores : 1;
}
function nombre(f: FilaAciertos): string {
  return f.clase === 'tela' ? f.nombre : f.codigo;
}

/** Aplica filtros y orden a una lista de filas. Devuelve una copia nueva. */
export function filtrarOrdenar<T extends FilaAciertos>(filas: readonly T[], criterios: CriteriosFiltro): T[] {
  let r: readonly T[] = filas;

  if (criterios.unidad) r = r.filter((a) => a.unidad === criterios.unidad);
  if (criterios.subRubro) r = r.filter((a) => a.subRubro === criterios.subRubro);
  if (criterios.rotacion) r = r.filter((a) => a.rotacion === criterios.rotacion);
  if (criterios.recomendacion !== null) {
    r = r.filter((a) => a.recomendacion === criterios.recomendacion);
  }
  const q = criterios.q.trim().toLowerCase();
  if (q) r = r.filter((a) => textoBuscable(a).includes(q));

  return r.slice().sort(COMPARADORES[criterios.orden] ?? COMPARADORES.ven);
}
