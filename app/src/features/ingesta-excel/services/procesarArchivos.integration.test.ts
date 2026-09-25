/**
 * Test de integración con el formato de exports de septiembre 2026:
 * `Datos para reporte final.xlsx` (stock por artículo y depósito, compras reales,
 * ventas OFI/INTER/PESOS/BLUE con todos los rubros) + `Stock al 5-8.xlsx`
 * (foto por tela del inicio de la ventana).
 *
 * Verifica que la hoja "stock inicial" —que el ERP exportó con el stock de hoy—
 * se descarta, que la foto del 5-8 pasa a ser el inicial, y que las cantidades
 * medidas cuadran con los totales del ERP.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Catalogo, TelaAnalizada } from '@/features/catalogo/model/tipos';
import { LectorPlanillaXlsx } from './LectorPlanillaXlsx';
import { procesarArchivos } from './procesarPlanilla';

const ruta = (nombre: string) => fileURLToPath(new URL(`../../../../../${nombre}`, import.meta.url));
const HAY_DATOS = ['Datos para reporte final.xlsx', 'Stock al 5-8.xlsx'].every((n) => existsSync(ruta(n)));

function archivo(nombre: string) {
  const buf = readFileSync(ruta(nombre));
  return { nombre, datos: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) };
}

function cerca(a: number, b: number, tol = 1): void {
  expect(Math.abs(a - b), `${a} ≈ ${b}`).toBeLessThan(tol);
}

// Los Excel reales no se versionan (datos de la empresa): sin ellos, el test se saltea.
describe.skipIf(!HAY_DATOS)('procesarArchivos — exports sep-2026 + Stock al 5-8', () => {
  let catalogo: Catalogo;
  const tela = (nombre: string): TelaAnalizada => {
    const t = catalogo.telas.find((x) => x.nombre === nombre);
    if (!t) throw new Error(`tela no encontrada: ${nombre}`);
    return t;
  };
  const totalPorUnidad = (f: (t: TelaAnalizada) => number, unidad: string) =>
    catalogo.telas.filter((t) => t.unidad === unidad).reduce((s, t) => s + f(t), 0);

  beforeAll(async () => {
    catalogo = await procesarArchivos(
      [archivo('Datos para reporte final.xlsx'), archivo('Stock al 5-8.xlsx')],
      new LectorPlanillaXlsx(),
      { hoy: new Date(2026, 8, 24) },
    );
  });

  it('descarta el "stock inicial" duplicado y usa la foto del 5-8', () => {
    expect(catalogo.avisos.some((a) => a.includes('stock inicial') && a.includes('descartó'))).toBe(true);
    expect(catalogo.ventana).toEqual({ desde: '05-08', hasta: '24-09' });
    const t = tela('4 WAY');
    cerca(t.stockInicial, 8506);
    cerca(t.compras, 0);
    cerca(t.ventas, 1504);
    cerca(t.stockHoy, 7814);
  });

  it('solo toma el rubro TELAS de las ventas', () => {
    expect(catalogo.articulos.some((a) => a.codigo === 'HILNIM15048')).toBe(false);
    cerca(totalPorUnidad((t) => t.ventas, 'MTS'), 220873.3, 5);
    cerca(totalPorUnidad((t) => t.ventas, 'KGS'), 182415.452, 5);
  });

  it('compras y stock hoy son reales por artículo y cuadran con el ERP', () => {
    cerca(catalogo.telas.reduce((s, t) => s + t.compras, 0), 156124, 1);
    // Total General del ERP (3.880.522,42) menos la fila basura "COMPRA / Concepto" (17.501,02).
    cerca(catalogo.telas.reduce((s, t) => s + t.stockHoy, 0), 3880522.42 - 17501.02, 1);
    expect(catalogo.articulos.some((x) => x.codigo === 'COMPRA')).toBe(false);
    const art = catalogo.articulos.find((a) => a.codigo === 'WAY01001');
    cerca(art!.stockHoy, 931);
    expect(art!.camposEstimados).toEqual(['stockInicial']);
  });

  it('la tela con compras reales refleja lo comprado (LINO PANTALONERO SPANDEX)', () => {
    const t = tela('LINO PANTALONERO SPANDEX');
    cerca(t.stockInicial, 42237.1);
    cerca(t.compras, 9832.1);
  });

  it('unifica los grupos por diseño en una sola tela (BRODERY PLANO)', () => {
    const t = tela('BRODERY PLANO');
    expect(t.colores).toBe(18); // dsn 1 a 7, todos sus colores
    expect(catalogo.telas.some((x) => /BRODERY PLANO DSN/i.test(x.nombre))).toBe(false);
    cerca(t.stockHoy, catalogo.articulos.filter((x) => x.tela === 'BRODERY PLANO').reduce((s, x) => s + x.stockHoy, 0));
  });

  it('separa lisos de estampados cuando la tela tiene ambos (MODAL SOFT / MODAL SOFT DSN)', () => {
    expect(tela('MODAL SOFT').enLista).toBe(true);
    expect(tela('MODAL SOFT DSN').enLista).toBe(true);
    expect(tela('MODAL SOFT DSN').colores).toBeGreaterThan(10);
  });

  it('aplica las fusiones aprobadas por el comprador', () => {
    const nombres = new Set(catalogo.telas.map((t) => t.nombre));
    for (const n of ['POPLIN EST', 'MODAL SOFT EST', 'MORLEY EST', 'MORLEY EST ZIGGY', 'CASMISACO', 'TIMBERLAND ESTAMPADO']) {
      expect(nombres.has(n), n).toBe(false);
    }
    expect(tela('POPLIN DSN').colores).toBeGreaterThan(200);
  });

  it('la lista de 49 apunta a FLANEL LUMINOSO DSN (donde está el stock)', () => {
    expect(tela('FLANEL LUMINOSO DSN').enLista).toBe(true);
    expect(tela('FLANEL LUMINOSO').enLista).toBe(false);
  });

  it('asigna artículos sin grupo por prefijo de descripción', () => {
    expect(catalogo.articulos.find((x) => x.codigo === 'CPS01043')?.tela).toBe('COTTON POPLIN SPANDEX');
    expect(catalogo.articulos.find((x) => x.codigo === 'SCSC01004')?.tela).toBe('SCUBA SUEDE CON CORDERITO');
  });

  it('la hoja BLUE vacía no aporta ventas', () => {
    expect(catalogo.telas.every((t) => t.unidadesPorMoneda[3] === 0)).toBe(true);
  });
});
