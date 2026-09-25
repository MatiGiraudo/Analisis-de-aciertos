/** Tests de los controles de calidad y de la lectura de fechas en nombres de hoja. */
import { describe, expect, it } from 'vitest';
import { detectarFechaEn } from './clasificarHojas';
import { sonMismaFoto } from './controlesCalidad';
import type { FilaStockArticulo } from './parsearErp';

const fila = (codigo: string, cantidad: number): FilaStockArticulo => ({
  codigo,
  descripcion: '',
  grupo: '',
  unidad: 'MTS',
  subRubro: '',
  cantidad,
});

describe('sonMismaFoto', () => {
  it('detecta dos fotos idénticas aunque una tenga códigos extra', () => {
    expect(sonMismaFoto([fila('A', 10), fila('B', 5)], [fila('A', 10), fila('B', 5), fila('C', 3)])).toBe(true);
  });
  it('no confunde fotos que reflejan movimientos', () => {
    expect(sonMismaFoto([fila('A', 10), fila('B', 5)], [fila('A', 7), fila('B', 5)])).toBe(false);
  });
});

describe('detectarFechaEn', () => {
  it.each([
    ['stock al 5-8', { dia: 5, mes: 8 }],
    ['stock al 3009', { dia: 30, mes: 9 }],
    ['stock al 05/09 (inicial)', { dia: 5, mes: 9 }],
    ['hoja2', undefined],
  ])('%s', (texto, esperado) => {
    expect(detectarFechaEn(texto)).toEqual(esperado);
  });
});
