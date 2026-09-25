/**
 * Clasificación de rotación a partir de ventas y sell-through.
 *
 * Portado de `rotOf(o)` del HTML:
 *   sin ventas → N (nula); st ≥ .70 → A (alta); st ≥ .30 → M (media); resto → B (baja).
 */
import type { Rotacion } from '../model/tipos';

/** Etiquetas legibles para cada nivel de rotación (usadas en filtros/leyendas). */
export const ETIQUETA_ROTACION: Record<Rotacion, string> = {
  A: 'Rotación alta',
  M: 'Rotación media',
  B: 'Rotación baja',
  N: 'Sin rotación',
};

/**
 * @param ventas cantidad vendida en la ventana
 * @param sellThrough sell-through ya calculado (∈ [0,1])
 */
export function clasificarRotacion(ventas: number, sellThrough: number): Rotacion {
  if (ventas <= 0) return 'N';
  if (sellThrough >= 0.7) return 'A';
  if (sellThrough >= 0.3) return 'M';
  return 'B';
}
