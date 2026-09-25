/**
 * Paginación (funciones puras, DRY): la usan todas las vistas con listas.
 *
 * `paginar` corta la página pedida y la acota al rango válido (si un filtro deja
 * menos páginas, se queda en la última en vez de mostrar una página vacía).
 * `rangoPaginas` arma los números a mostrar con "…" para listas largas.
 */

export interface Pagina<T> {
  readonly items: readonly T[];
  /** Página efectiva (1-based), ya acotada a [1, totalPaginas]. */
  readonly pagina: number;
  readonly totalPaginas: number;
  readonly total: number;
  /** Posición (1-based) del primer y último ítem de la página; 0 si no hay ítems. */
  readonly desde: number;
  readonly hasta: number;
}

export function paginar<T>(items: readonly T[], pagina: number, tamano: number): Pagina<T> {
  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  const p = Math.min(Math.max(1, Math.floor(pagina)), totalPaginas);
  const inicio = (p - 1) * tamano;
  const slice = items.slice(inicio, inicio + tamano);
  return {
    items: slice,
    pagina: p,
    totalPaginas,
    total,
    desde: total === 0 ? 0 : inicio + 1,
    hasta: inicio + slice.length,
  };
}

/**
 * Números de página a mostrar: siempre la primera, la última y `vecinas` a cada lado
 * de la actual; los huecos se marcan con '…'. Ej. (6, 20) → [1, '…', 5, 6, 7, '…', 20].
 */
export function rangoPaginas(actual: number, total: number, vecinas = 1): (number | '…')[] {
  const r: (number | '…')[] = [];
  for (let p = 1; p <= total; p++) {
    const visible = p === 1 || p === total || Math.abs(p - actual) <= vecinas;
    if (visible) r.push(p);
    else if (r[r.length - 1] !== '…') r.push('…');
  }
  return r;
}
