/**
 * Totales por temporada para las tarjetas de la vista Temporadas (función pura).
 *
 * KGS y MTS nunca se suman: cada temporada trae un bloque por unidad. Los
 * indicadores del bloque (sell-through, cobertura, recomendación) salen del mismo
 * `calcularIndicadores` que usan telas y artículos (DRY), aplicado a la suma de
 * las cantidades de sus telas.
 */
import { calcularIndicadores } from '@/features/catalogo/logic/derivar';
import type { Indicadores, TelaAnalizada } from '@/features/catalogo/model/tipos';
import { porMonedaVacio } from '@/shared/tipos/moneda';
import type { Temporada } from '@/shared/tipos/temporada';
import type { Unidad } from '@/shared/tipos/unidad';

export type ClaveTemporada = Temporada | 'SIN';

export interface TotalesUnidad extends Indicadores {
  readonly unidad: Unidad;
  readonly telas: number;
  readonly ventas: number;
  readonly stockHoy: number;
}

export interface ResumenTemporada {
  readonly clave: ClaveTemporada;
  readonly telas: number;
  readonly porUnidad: readonly TotalesUnidad[];
}

export const CLAVES_TEMPORADA: readonly ClaveTemporada[] = ['VERANO', 'INVIERNO', 'ATEMPORAL', 'SIN'];
const UNIDADES: readonly Unidad[] = ['KGS', 'MTS'];

export function resumirPorTemporada(
  telas: readonly TelaAnalizada[],
  temporadaDe: (tela: string) => Temporada | null,
): ResumenTemporada[] {
  return CLAVES_TEMPORADA.map((clave) => {
    const grupo = telas.filter((t) => (temporadaDe(t.nombre) ?? 'SIN') === clave);
    const porUnidad = UNIDADES.flatMap((unidad): TotalesUnidad[] => {
      const us = grupo.filter((t) => t.unidad === unidad);
      if (us.length === 0) return [];
      const suma = (f: (t: TelaAnalizada) => number) => us.reduce((s, t) => s + f(t), 0);
      const metricas = {
        stockInicial: suma((t) => t.stockInicial),
        compras: suma((t) => t.compras),
        ventas: suma((t) => t.ventas),
        stockHoy: suma((t) => t.stockHoy),
        unidadesPorMoneda: porMonedaVacio(),
        netoPorMoneda: porMonedaVacio(),
      };
      return [
        { unidad, telas: us.length, ventas: metricas.ventas, stockHoy: metricas.stockHoy, ...calcularIndicadores(metricas) },
      ];
    });
    return { clave, telas: grupo.length, porUnidad };
  });
}
