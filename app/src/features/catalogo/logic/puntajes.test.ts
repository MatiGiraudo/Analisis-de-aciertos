/**
 * Tests de los puntajes de ranking.
 *
 * Verifican el cálculo de percentiles por unidad y la fórmula ponderada de
 * `puntajeReponer` / `puntajePlataParada`, con valores hechos a mano.
 */
import { describe, it, expect } from 'vitest';
import { calcularPuntajes } from './puntajes';
import { analizar } from './derivar';
import type { Articulo, Indicadores } from '../model/tipos';
import type { Unidad } from '@/shared/tipos/unidad';

/** Construye un artículo analizado (con indicadores) para los tests. */
function articulo(
  codigo: string,
  unidad: Unidad,
  m: { stockInicial?: number; compras?: number; ventas: number; stockHoy: number },
): Articulo & Indicadores {
  const base: Articulo = {
    clase: 'articulo',
    codigo,
    descripcion: codigo,
    tela: 'TELA',
    grupoErp: 'TELA',
    subRubro: '',
    unidad,
    enLista: false,
    camposEstimados: [],
    stockInicial: m.stockInicial ?? 0,
    compras: m.compras ?? 0,
    ventas: m.ventas,
    stockHoy: m.stockHoy,
    unidadesPorMoneda: [0, 0, 0, 0],
    netoPorMoneda: [0, 0, 0, 0],
  };
  return analizar(base);
}

describe('calcularPuntajes', () => {
  it('percentil + fórmula del artículo top (KGS)', () => {
    const arts = [
      articulo('A', 'KGS', { compras: 20, ventas: 10, stockHoy: 5 }),
      articulo('B', 'KGS', { compras: 40, ventas: 20, stockHoy: 10 }),
      articulo('C', 'KGS', { compras: 60, ventas: 30, stockHoy: 15 }), // top en ventas y stock
    ];
    const [c] = calcularPuntajes(arts).filter((a) => a.codigo === 'C');
    // C: st=0.5, cob=0.5, percentilVentas=1, urgencia=0.75 → 100*(0.45+0.175+0.15)
    expect(c.puntajeReponer).toBeCloseTo(77.5, 4);
    // C: percentilStock=1, (1-st)=0.5, exceso=0.5/6 → 100*(0.45+0.15+0.020833)
    expect(c.puntajePlataParada).toBeCloseTo(62.0833, 3);
  });

  it('sin ventas → puntajeReponer 0; sin stock → puntajePlataParada 0', () => {
    const arts = [articulo('Z', 'MTS', { ventas: 0, stockHoy: 0 })];
    const [z] = calcularPuntajes(arts);
    expect(z.puntajeReponer).toBe(0);
    expect(z.puntajePlataParada).toBe(0);
  });

  it('los percentiles se calculan por unidad de forma independiente', () => {
    const arts = [
      articulo('K', 'KGS', { compras: 100, ventas: 50, stockHoy: 10 }),
      articulo('M', 'MTS', { compras: 100, ventas: 50, stockHoy: 10 }),
    ];
    const res = calcularPuntajes(arts);
    // Cada uno es único en su unidad → percentil 0 (n=1)
    expect(res).toHaveLength(2);
    for (const a of res) {
      // con percentil 0, puntajeReponer = 100*(0.35*st + 0.20*urgencia)
      expect(a.puntajeReponer).toBeGreaterThan(0);
    }
  });
});
