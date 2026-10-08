/**
 * Temporada comercial de una tela.
 *
 * Una tela es de VERANO, de INVIERNO o ATEMPORAL (se vende todo el año). Las telas
 * que todavía no tienen temporada asignada se representan con `null` (en filtros,
 * con la clave `'SIN'`).
 */
export type Temporada = 'VERANO' | 'INVIERNO' | 'ATEMPORAL';

/** Orden de presentación (también el de las secciones de la vista Temporadas). */
export const TEMPORADAS: readonly Temporada[] = ['VERANO', 'INVIERNO', 'ATEMPORAL'];

/** Valor del filtro de temporada: '' = todas, 'SIN' = sin asignar. */
export type FiltroTemporada = Temporada | 'SIN' | '';

export const ETIQUETA_TEMPORADA: Record<Temporada | 'SIN', string> = {
  VERANO: 'Verano',
  INVIERNO: 'Invierno',
  ATEMPORAL: 'Atemporal',
  SIN: 'Sin asignar',
};

/**
 * Interpreta un texto libre como temporada ("VERANO", "Primavera-verano", "OI",
 * "todo el año"…). Devuelve `null` si no lo reconoce.
 */
export function parsearTemporada(texto: unknown): Temporada | null {
  const t = String(texto ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!t) return null;
  if (/^ATEMP|TODO EL ANO|CONTINU|PERMANENTE/.test(t)) return 'ATEMPORAL';
  if (/VERANO|^PV$|^SS$|^PRIMAVERA/.test(t)) return 'VERANO';
  if (/INVIERNO|^OI$|^AW$|^OTONO/.test(t)) return 'INVIERNO';
  return null;
}

/** ¿Una tela con esta temporada (`null` = sin asignar) pasa el filtro? */
export function pasaFiltroTemporada(temporada: Temporada | null, filtro: FiltroTemporada): boolean {
  if (!filtro) return true;
  return filtro === 'SIN' ? temporada === null : temporada === filtro;
}
