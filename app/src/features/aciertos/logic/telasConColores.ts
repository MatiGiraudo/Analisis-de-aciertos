/**
 * Telas filtradas y ordenadas, cada una con sus colores (para el acordeón).
 *
 * Función pura. Reutiliza `filtrarOrdenar` (DRY): los filtros de unidad, sub
 * rubro, rotación y recomendación se aplican a la TELA; la búsqueda encuentra la
 * tela por su nombre o por el código/descripción de alguno de sus colores. Si la
 * encontró por un color, el acordeón muestra solo los colores que coinciden.
 * Los colores se ordenan con el mismo criterio elegido para la tabla.
 */
import type { ArticuloAnalizado, TelaAnalizada } from '@/features/catalogo/model/tipos';
import type { CriteriosFiltro } from './filtrarOrdenar';
import { filtrarOrdenar } from './filtrarOrdenar';

export interface TelaConColores {
  readonly tela: TelaAnalizada;
  /** Colores a mostrar en el acordeón (todos, o solo los que coinciden con la búsqueda). */
  readonly colores: readonly ArticuloAnalizado[];
  /** `true` si la tela apareció por un color y no por su nombre (se abre sola). */
  readonly porColor: boolean;
}

/** Agrupa los artículos por tela (una sola pasada, reutilizable entre renders). */
export function indexarColores(articulos: readonly ArticuloAnalizado[]): Map<string, ArticuloAnalizado[]> {
  const mapa = new Map<string, ArticuloAnalizado[]>();
  for (const a of articulos) {
    const arr = mapa.get(a.tela);
    if (arr) arr.push(a);
    else mapa.set(a.tela, [a]);
  }
  return mapa;
}

export function telasConColores(
  telas: readonly TelaAnalizada[],
  coloresPorTela: ReadonlyMap<string, readonly ArticuloAnalizado[]>,
  criterios: CriteriosFiltro,
): TelaConColores[] {
  const q = criterios.q.trim().toLowerCase();
  const ordenarColores = (arts: readonly ArticuloAnalizado[]) =>
    filtrarOrdenar(arts, { ...criterios, q: '', unidad: '', subRubro: '', rotacion: '', recomendacion: null });

  const r: TelaConColores[] = [];
  for (const tela of filtrarOrdenar(telas, { ...criterios, q: '' })) {
    const todos = coloresPorTela.get(tela.nombre) ?? [];
    if (!q || `${tela.nombre} ${tela.subRubro}`.toLowerCase().includes(q)) {
      r.push({ tela, colores: ordenarColores(todos), porColor: false });
      continue;
    }
    const coinciden = todos.filter((a) => `${a.codigo} ${a.descripcion}`.toLowerCase().includes(q));
    if (coinciden.length > 0) r.push({ tela, colores: ordenarColores(coinciden), porColor: true });
  }
  return r;
}
