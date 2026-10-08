import { describe, expect, it } from 'vitest';
import { parsearTemporada } from '@/shared/tipos/temporada';
import { resolverTemporadas } from '../logic/resolverTemporadas';
import { filasExportacion, leerFilas } from './planillaTemporadas';

describe('parsearTemporada', () => {
  it.each([
    ['VERANO', 'VERANO'],
    ['Primavera-Verano', 'VERANO'],
    ['oi', 'INVIERNO'],
    ['Otoño invierno', 'INVIERNO'],
    ['atemporal', 'ATEMPORAL'],
    ['Todo el año', 'ATEMPORAL'],
    ['', null],
    ['???', null],
  ])('%s → %s', (texto, esperado) => expect(parsearTemporada(texto)).toBe(esperado));
});

describe('leerFilas', () => {
  it('encuentra el encabezado ARTICULO/TEMP aunque no esté en la primera fila', () => {
    const r = leerFilas([
      ['Temporadas 2026'],
      ['ARTICULO', 'TEMP'],
      ['CEY  LINO', 'VERANO'],
      ['RIB ONIX', 'atemporal'],
      ['cey lino', 'INVIERNO'], // duplicado: gana la primera
      ['SIN DATO', ''],
      [null, 'VERANO'],
    ]);
    expect(r?.entradas).toEqual([
      { nombre: 'CEY LINO', temporada: 'VERANO' },
      { nombre: 'RIB ONIX', temporada: 'ATEMPORAL' },
    ]);
    expect(r?.descartadas).toEqual(['SIN DATO']);
  });

  it('acepta TELA / TEMPORADA y devuelve undefined si no hay encabezado', () => {
    expect(leerFilas([['Tela', 'Temporada'], ['X', 'Verano']])?.entradas).toHaveLength(1);
    expect(leerFilas([['Código', 'Cant.']])).toBeUndefined();
  });

  it('lo exportado se vuelve a leer igual (ida y vuelta)', () => {
    const telas = [
      { nombre: 'CEY', unidad: 'MTS' as const },
      { nombre: 'RIB ONIX', unidad: 'KGS' as const },
      { nombre: 'BATISTA', unidad: 'MTS' as const },
    ];
    const res = resolverTemporadas(
      telas.map((t) => t.nombre),
      [
        { nombre: 'CEY', temporada: 'VERANO' },
        { nombre: 'VIEJA', temporada: 'INVIERNO' },
      ],
      {},
      { 'RIB ONIX': 'ATEMPORAL' },
    );
    const leida = leerFilas(filasExportacion(telas, res).filas.map((f) => [...f]));
    expect(leida?.entradas).toEqual([
      { nombre: 'CEY', temporada: 'VERANO' },
      { nombre: 'RIB ONIX', temporada: 'ATEMPORAL' },
      { nombre: 'VIEJA', temporada: 'INVIERNO' },
    ]);
    expect(leida?.descartadas).toEqual(['BATISTA']);
  });
});
