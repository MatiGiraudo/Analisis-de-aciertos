import { describe, expect, it } from 'vitest';
import type { TelaAnalizada } from '@/features/catalogo/model/tipos';
import { filasTemporadas } from './filasTemporadas';
import { resolverTemporadas } from './resolverTemporadas';
import { resumirPorTemporada } from './resumirPorTemporada';

const tela = (nombre: string, unidad: 'KGS' | 'MTS', ventas: number, stockHoy: number) =>
  ({ nombre, unidad, stockInicial: ventas + stockHoy, compras: 0, ventas, stockHoy }) as unknown as TelaAnalizada;

const TELAS = [tela('A', 'KGS', 10, 90), tela('B', 'KGS', 50, 50), tela('C', 'MTS', 30, 10), tela('D', 'KGS', 5, 5)];
const RES = resolverTemporadas(
  TELAS.map((t) => t.nombre),
  [
    { nombre: 'A', temporada: 'INVIERNO' },
    { nombre: 'B', temporada: 'VERANO' },
    { nombre: 'C', temporada: 'VERANO' },
  ],
  {},
  { A: 'ATEMPORAL' },
);

describe('filasTemporadas', () => {
  it('agrupa Verano → Invierno → Atemporal → sin asignar, conservando el orden dentro del grupo', () => {
    expect(filasTemporadas(TELAS, RES, '', '').map((f) => f.tela.nombre)).toEqual(['B', 'C', 'A', 'D']);
  });

  it('filtra por temporada y por origen', () => {
    expect(filasTemporadas(TELAS, RES, 'SIN', '').map((f) => f.tela.nombre)).toEqual(['D']);
    expect(filasTemporadas(TELAS, RES, 'VERANO', '').map((f) => f.tela.nombre)).toEqual(['B', 'C']);
    expect(filasTemporadas(TELAS, RES, '', 'manual').map((f) => f.tela.nombre)).toEqual(['A']);
  });
});

describe('resumirPorTemporada', () => {
  it('suma por temporada sin mezclar KGS y MTS', () => {
    const r = resumirPorTemporada(TELAS, (t) => RES.porTela.get(t)?.temporada ?? null);
    const verano = r.find((x) => x.clave === 'VERANO')!;
    expect(verano.telas).toBe(2);
    expect(verano.porUnidad.map((u) => [u.unidad, u.ventas, u.stockHoy])).toEqual([
      ['KGS', 50, 50],
      ['MTS', 30, 10],
    ]);
    expect(verano.porUnidad[0].sellThrough).toBeCloseTo(0.5);
    expect(r.find((x) => x.clave === 'SIN')!.telas).toBe(1);
  });
});
