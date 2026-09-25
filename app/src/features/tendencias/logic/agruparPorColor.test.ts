/** Tests de extracción de color y agregación de colores de tendencia. */
import { describe, expect, it } from 'vitest';
import type { ArticuloAnalizado } from '@/features/catalogo/model/tipos';
import { agruparPorColor } from './agruparPorColor';
import { extraerColor } from './extraerColor';

describe('extraerColor', () => {
  it.each([
    ['RIB ONIX ROSA BB (E)', 'RIB ONIX', 'RIB ONIX', 'ROSA BB'],
    ['BRODERY PLANO dsn 6 OFF WHITE (E)', 'BRODERY PLANO dsn 6', 'BRODERY PLANO', 'OFF WHITE'],
    ['BRODERY PLANO dsn 1 NEGRO (E)', 'BRODERY PLANO', 'BRODERY PLANO', 'NEGRO'],
    ['POPLIN dsn 2311 vte 3 (E)', '', 'POPLIN DSN', ''],
    ['MORLEY EST 2525 (E)', 'MORLEY EST 2525', 'MORLEY DSN', ''],
    ['CORDERITO BIFAZ dsn 2 vte 1 (E)', '', 'CORDERITO BIFAZ DSN', ''],
    ['CEY vte 2 NEGRO (E)', 'CEY', 'CEY', 'NEGRO'],
  ])('%s → "%s"', (desc, grupo, tela, esperado) => {
    expect(extraerColor(desc, grupo, tela)).toBe(esperado);
  });
});

const art = (codigo: string, tela: string, color: string, unidad: 'KGS' | 'MTS', ventas: number, disponible: number) =>
  ({
    codigo,
    tela,
    grupoErp: tela,
    descripcion: `${tela} ${color} (E)`,
    unidad,
    subRubro: 'PUNTO',
    ventas,
    disponible,
    stockHoy: disponible - ventas,
  }) as ArticuloAnalizado;

describe('agruparPorColor', () => {
  const arts = [
    art('A1', 'RIB', 'NEGRO', 'KGS', 60, 100),
    art('A2', 'CEY', 'NEGRO', 'KGS', 20, 100),
    art('A3', 'RIB', 'ROJO', 'KGS', 20, 200),
    art('B1', 'POPLIN', 'NEGRO', 'MTS', 50, 50),
  ];
  const base = { q: '', unidad: '', subRubro: '', orden: 'ventas', alcance: 'todos' } as const;

  it('agrega por color sin mezclar unidades', () => {
    const r = agruparPorColor(arts, base);
    const negroKgs = r.find((c) => c.color === 'NEGRO' && c.unidad === 'KGS')!;
    expect(negroKgs.ventas).toBe(80);
    expect(negroKgs.telas).toBe(2);
    expect(r.find((c) => c.color === 'NEGRO' && c.unidad === 'MTS')!.ventas).toBe(50);
  });

  it('el índice compara participación en ventas vs en stock', () => {
    const r = agruparPorColor(arts, base);
    // KGS: NEGRO vende 80/100 = 0,8 y pesa 200/400 = 0,5 → índice 1,6; ROJO 0,2 / 0,5 = 0,4.
    expect(r.find((c) => c.color === 'NEGRO' && c.unidad === 'KGS')!.indice).toBeCloseTo(1.6);
    expect(r.find((c) => c.color === 'ROJO')!.indice).toBeCloseTo(0.4);
  });

  it('ordena por índice y filtra por unidad', () => {
    const r = agruparPorColor(arts, { ...base, unidad: 'KGS', orden: 'indice' });
    expect(r.map((c) => c.color)).toEqual(['NEGRO', 'ROJO']);
  });
});
