/**
 * Cálculo de indicadores derivados sobre las cantidades base de un ítem.
 *
 * Función pura, sin estado ni dependencias externas (SRP). Reutilizada por telas
 * y artículos por igual (DRY): recibe cualquier `Metricas` y devuelve los
 * `Indicadores`. Portado 1:1 de `derive(o)` del HTML original.
 *
 * Fórmulas:
 *   disponible  = stockInicial + compras
 *   sellThrough = clamp(ventas / disponible, 0, 1)   (0 si no hay disponible)
 *   cobertura   = stockHoy / ventas                  (999 si hay stock sin ventas)
 */
import type { Indicadores, Metricas } from '../model/tipos';
import { evaluarRecomendacion } from './recomendacion';
import { clasificarRotacion } from './rotacion';

/** Cobertura tope cuando queda stock pero no hubo ventas (evita división por cero). */
const COBERTURA_SIN_VENTAS = 999;

export function calcularIndicadores(m: Metricas): Indicadores {
  const disponible = m.stockInicial + m.compras;

  const sellThrough = disponible > 0 ? clamp(m.ventas / disponible, 0, 1) : 0;

  const cobertura =
    m.ventas > 0 ? Math.max(0, m.stockHoy) / m.ventas : m.stockHoy > 0 ? COBERTURA_SIN_VENTAS : 0;

  const recomendacion = evaluarRecomendacion({
    ventas: m.ventas,
    stockHoy: m.stockHoy,
    sellThrough,
    cobertura,
  });

  const rotacion = clasificarRotacion(m.ventas, sellThrough);

  return { disponible, sellThrough, cobertura, recomendacion, rotacion };
}

/**
 * Combina una entidad con sus indicadores derivados en un solo objeto.
 * Genérico para no repetir el patrón en telas y artículos (DRY).
 */
export function analizar<T extends Metricas>(item: T): T & Indicadores {
  return { ...item, ...calcularIndicadores(item) };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
