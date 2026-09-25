/**
 * Puntajes de ranking (0–100), para artículos o telas.
 *
 * Portado de la IIFE `scores()` del HTML. Dos puntajes:
 *  - `puntajeReponer` (sRepo): prioriza lo que se vendió bien y está por agotarse.
 *  - `puntajePlataParada` (sDead): prioriza capital inmovilizado que no rota.
 *
 * El percentil de ventas y de stock se calcula **dentro de cada unidad** (KGS y
 * MTS por separado), porque las magnitudes no son comparables entre unidades.
 *
 * Función pura y genérica (DRY): la misma fórmula puntúa artículos (percentil
 * entre artículos) y telas (percentil entre telas). Devuelve copias con puntajes.
 */
import type { Indicadores, Metricas, Puntajes } from '../model/tipos';
import type { Unidad } from '@/shared/tipos/unidad';

/** Lo mínimo que necesita un ítem para ser puntuado. */
type Puntuable = Metricas & Indicadores & { readonly unidad: Unidad };

/** Pesos de cada componente del puntaje (documentan la fórmula del negocio). */
const PESOS_REPONER = { percentilVentas: 0.45, sellThrough: 0.35, urgencia: 0.2 } as const;
const PESOS_PLATA_PARADA = { percentilStock: 0.45, noVendido: 0.3, exceso: 0.25 } as const;

export function calcularPuntajes<T extends Puntuable>(items: readonly T[]): (T & Puntajes)[] {
  const porUnidad = agruparPor(items, (a) => a.unidad);
  const resultado: (T & Puntajes)[] = [];

  for (const grupo of porUnidad.values()) {
    const percentilVentas = percentiles(grupo, (a) => a.ventas);
    const percentilStock = percentiles(grupo, (a) => a.stockHoy);

    grupo.forEach((a, i) => {
      const urgencia = 1 - Math.min(a.cobertura, 2) / 2; // se agota rápido → cerca de 1
      const exceso = Math.min(a.cobertura, 6) / 6; // sobra para rato → cerca de 1

      const puntajeReponer =
        a.ventas <= 0
          ? 0
          : 100 *
            (PESOS_REPONER.percentilVentas * percentilVentas[i] +
              PESOS_REPONER.sellThrough * a.sellThrough +
              PESOS_REPONER.urgencia * urgencia);

      const puntajePlataParada =
        a.stockHoy <= 0
          ? 0
          : 100 *
            (PESOS_PLATA_PARADA.percentilStock * percentilStock[i] +
              PESOS_PLATA_PARADA.noVendido * (1 - a.sellThrough) +
              PESOS_PLATA_PARADA.exceso * exceso);

      resultado.push({ ...a, puntajeReponer, puntajePlataParada });
    });
  }

  return resultado;
}

/**
 * Devuelve, para cada elemento (en el orden original), su percentil ∈ [0,1]
 * según `valor`. Con un solo elemento, el percentil es 0 (igual que el HTML).
 */
function percentiles<T>(items: readonly T[], valor: (t: T) => number): number[] {
  const n = items.length;
  const orden = items
    .map((item, i) => ({ i, v: valor(item) }))
    .sort((a, b) => a.v - b.v);
  const p = new Array<number>(n);
  orden.forEach((o, rango) => {
    p[o.i] = n > 1 ? rango / (n - 1) : 0;
  });
  return p;
}

/** Agrupa preservando el orden de aparición dentro de cada grupo. */
function agruparPor<T, K>(items: readonly T[], clave: (t: T) => K): Map<K, T[]> {
  const mapa = new Map<K, T[]>();
  for (const item of items) {
    const k = clave(item);
    const arr = mapa.get(k);
    if (arr) arr.push(item);
    else mapa.set(k, [item]);
  }
  return mapa;
}
