import { describe, expect, it } from 'vitest';
import type { HojaCruda } from '../model/planilla';
import { detectarTipoHoja, parsearStockArticulo } from './parsearErp';

/** Formato oct-2026: "Total Existencias" arriba, "Cantidad / Valorizado" debajo, tabla de Excel ("Columna1"). */
const STOCK_TOTAL_EXISTENCIAS: HojaCruda = {
  nombre: 'Stock a hoy',
  filas: [
    ['Rubro', 'Sub Rubro', 'Código', 'Artículo', 'Grupo Artículo', 'Nombre Unidad', 'MEXICO 3233', 'Columna1', 'Total Existencias', 'Columna2'],
    ['', '', '', '', '', '', 'Cantidad', 'Valorizado', 'Cantidad', 'Valorizado'],
    ['', 'Total General', null, null, '', '', 900, null, 1000, 5000],
    ['TELAS', 'PLANO', 'WAY01001', '4 WAY NEGRO (E)', '4 WAY', 'MTS', 700, null, 931, null],
    [null, null, 'WAY01005', '4 WAY GRIS MELANGE (E)', '4 WAY', 'MTS', 200, null, 462, null],
  ],
};

describe('parsearStockArticulo', () => {
  it('reconoce el total "Total Existencias / Cantidad" y la descripción en "Artículo"', () => {
    expect(detectarTipoHoja(STOCK_TOTAL_EXISTENCIAS)).toBe('stock-articulo');
    expect(parsearStockArticulo(STOCK_TOTAL_EXISTENCIAS)).toEqual([
      { codigo: 'WAY01001', descripcion: '4 WAY NEGRO (E)', grupo: '4 WAY', unidad: 'MTS', subRubro: 'PLANO', cantidad: 931 },
      { codigo: 'WAY01005', descripcion: '4 WAY GRIS MELANGE (E)', grupo: '4 WAY', unidad: 'MTS', subRubro: 'PLANO', cantidad: 462 },
    ]);
  });
});
