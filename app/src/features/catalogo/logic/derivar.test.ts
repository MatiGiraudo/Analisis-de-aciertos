/**
 * Tests del cálculo de indicadores.
 *
 * Los casos "golden" usan cantidades reales tomadas de `Aciertos_de_compra_9.html`
 * (constante DATA) para garantizar que el port reproduce exactamente los números
 * del dashboard original. Los casos de borde cubren cada rama de recomendación.
 */
import { describe, it, expect } from 'vitest';
import { calcularIndicadores } from './derivar';
import { Recomendacion } from '../model/tipos';
import type { Metricas } from '../model/tipos';

/** Helper: arma un `Metricas` con precios en cero (no afectan los indicadores). */
function metricas(p: Partial<Metricas>): Metricas {
  return {
    stockInicial: 0,
    compras: 0,
    ventas: 0,
    stockHoy: 0,
    unidadesPorMoneda: [0, 0, 0, 0],
    netoPorMoneda: [0, 0, 0, 0],
    ...p,
  };
}

describe('calcularIndicadores — casos reales (golden)', () => {
  it('ALGODON RUSTICO → Mantener, rotación media', () => {
    const r = calcularIndicadores(
      metricas({ stockInicial: 12025.2, compras: 0, ventas: 5287.3, stockHoy: 6737.9 }),
    );
    expect(r.disponible).toBeCloseTo(12025.2, 4);
    expect(r.sellThrough).toBeCloseTo(0.43968, 4);
    expect(r.cobertura).toBeCloseTo(1.27436, 4);
    expect(r.recomendacion).toBe(Recomendacion.Mantener);
    expect(r.rotacion).toBe('M');
  });

  it('ABERCROMBIE → Aumentar, rotación alta', () => {
    const r = calcularIndicadores(
      metricas({ stockInicial: 0, compras: 29536.1, ventas: 21230.9, stockHoy: 8305.2 }),
    );
    expect(r.disponible).toBeCloseTo(29536.1, 4);
    expect(r.sellThrough).toBeCloseTo(0.71882, 4);
    expect(r.cobertura).toBeCloseTo(0.39118, 4);
    expect(r.recomendacion).toBe(Recomendacion.Aumentar);
    expect(r.rotacion).toBe('A');
  });

  it('BENGALINA LISA → Mantener, rotación media', () => {
    const r = calcularIndicadores(
      metricas({ stockInicial: 230278.1, compras: 49060.4, ventas: 110388.2, stockHoy: 168866 }),
    );
    expect(r.disponible).toBeCloseTo(279338.5, 4);
    expect(r.sellThrough).toBeCloseTo(0.39517, 4);
    expect(r.cobertura).toBeCloseTo(1.52975, 4);
    expect(r.recomendacion).toBe(Recomendacion.Mantener);
  });
});

describe('calcularIndicadores — ramas de recomendación', () => {
  it('Liquidar: sin ventas pero con stock', () => {
    const r = calcularIndicadores(metricas({ stockInicial: 100, ventas: 0, stockHoy: 100 }));
    expect(r.recomendacion).toBe(Recomendacion.Liquidar);
    expect(r.cobertura).toBe(999);
    expect(r.rotacion).toBe('N');
  });

  it('Reducir por exceso de cobertura (cob > 2)', () => {
    const r = calcularIndicadores(metricas({ stockInicial: 100, ventas: 40, stockHoy: 100 }));
    expect(r.sellThrough).toBeCloseTo(0.4, 4);
    expect(r.cobertura).toBeCloseTo(2.5, 4);
    expect(r.recomendacion).toBe(Recomendacion.Reducir);
  });

  it('Reducir por sell-through bajo (st < .30)', () => {
    const r = calcularIndicadores(metricas({ stockInicial: 100, ventas: 20, stockHoy: 10 }));
    expect(r.recomendacion).toBe(Recomendacion.Reducir);
    expect(r.rotacion).toBe('B');
  });

  it('sell-through se satura en 1 cuando ventas > disponible', () => {
    const r = calcularIndicadores(metricas({ stockInicial: 0, compras: 10, ventas: 15, stockHoy: 0 }));
    expect(r.sellThrough).toBe(1);
    expect(r.recomendacion).toBe(Recomendacion.Aumentar);
    expect(r.rotacion).toBe('A');
  });

  it('disponible 0 → sell-through 0', () => {
    const r = calcularIndicadores(metricas({}));
    expect(r.sellThrough).toBe(0);
    expect(r.cobertura).toBe(0);
  });
});
