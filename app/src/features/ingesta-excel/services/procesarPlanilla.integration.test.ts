/**
 * Test de integración de la ingesta contra el Excel real del ERP.
 *
 * Carga `ANALISIS DE ACIERTOS.xlsx` (en la raíz del repo) con el lector real de
 * SheetJS y verifica que las cantidades exactas (ventas y stock actual por tela,
 * unidades por moneda, totales del ERP) reproducen los números del dashboard v9.
 * Los campos de nivel tela son dato duro, así que sirven de "golden".
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';
import { LectorPlanillaXlsx } from './LectorPlanillaXlsx';
import { procesarPlanilla } from './procesarPlanilla';
import type { Catalogo, TelaAnalizada } from '@/features/catalogo/model/tipos';

const RUTA_EXCEL = fileURLToPath(
  new URL('../../../../../ANALISIS DE ACIERTOS.xlsx', import.meta.url),
);

/** Igualdad con tolerancia (acumulación de floats en sumas grandes). */
function cerca(a: number, b: number, tol = 1): void {
  expect(Math.abs(a - b), `${a} ≈ ${b}`).toBeLessThan(tol);
}

// Los Excel reales no se versionan (datos de la empresa): sin ellos, el test se saltea.
describe.skipIf(!existsSync(RUTA_EXCEL))('procesarPlanilla — Excel real', () => {
  let catalogo: Catalogo;
  const tela = (nombre: string): TelaAnalizada => {
    const t = catalogo.telas.find((x) => x.nombre === nombre);
    if (!t) throw new Error(`tela no encontrada: ${nombre}`);
    return t;
  };

  beforeAll(async () => {
    const buf = readFileSync(RUTA_EXCEL);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    catalogo = await procesarPlanilla(ab, new LectorPlanillaXlsx());
  });

  it('carga un volumen de datos coherente', () => {
    // Los grupos por diseño del ERP se unifican en telas (≈ 630 grupos → ≈ 330 telas).
    expect(catalogo.telas.length).toBeGreaterThan(250);
    expect(catalogo.articulos.length).toBeGreaterThan(3000);
    // De las 49 destacadas, en este Excel están presentes las que tuvieron
    // actividad (9 no aparecen en ninguna hoja). enLista marca solo las presentes.
    expect(catalogo.lista.length).toBeGreaterThan(35);
    expect(catalogo.lista.length).toBeLessThanOrEqual(49);
    expect(catalogo.lista.every((t) => t.enLista)).toBe(true);
    expect(catalogo.telas.find((t) => t.nombre === 'ABERCROMBIE')?.enLista).toBe(true);
  });

  it('ventas y stock actual por tela coinciden con v9 (golden)', () => {
    cerca(tela('4 WAY').ventas, 6108);
    cerca(tela('4 WAY').stockHoy, 8506);
    expect(tela('4 WAY').colores).toBe(6);

    cerca(tela('ABERCROMBIE').ventas, 21230.9);
    cerca(tela('ABERCROMBIE').stockHoy, 8305.2);
    expect(tela('ABERCROMBIE').colores).toBe(8);

    cerca(tela('BENGALINA LISA').ventas, 110388.2);
    cerca(tela('BENGALINA LISA').stockHoy, 168866);
  });

  it('las unidades por moneda cuadran (4 WAY: OFI/INTER/PESOS)', () => {
    const t = tela('4 WAY');
    cerca(t.unidadesPorMoneda[0], 0); // oficial
    cerca(t.unidadesPorMoneda[1], 5381); // intermedio
    cerca(t.unidadesPorMoneda[2], 727); // pesos
    // la suma de unidades por moneda es igual a las ventas
    cerca(t.unidadesPorMoneda[0] + t.unidadesPorMoneda[1] + t.unidadesPorMoneda[2], t.ventas);
  });

  it('los totales de unidades por moneda cuadran con el Total General del ERP', () => {
    const totalMoneda = (i: 0 | 1 | 2) =>
      catalogo.telas.reduce((s, t) => s + t.unidadesPorMoneda[i], 0);
    cerca(totalMoneda(0), 40800.4, 5); // OFI
    cerca(totalMoneda(1), 1375366.65, 5); // INTER
    cerca(totalMoneda(2), 815106.488, 5); // PESOS
  });

  it('stock inicial ahora es el dato real de la hoja 30-09 (no reconstruido)', () => {
    // v9 mostraba 4 WAY ini=14614 (reconstruido); el real es 9318 (hoja Stock 3009).
    cerca(tela('4 WAY').stockInicial, 9318);
  });

  it('el sell-through por tela es coherente (0..1)', () => {
    for (const t of catalogo.telas) {
      expect(t.sellThrough).toBeGreaterThanOrEqual(0);
      expect(t.sellThrough).toBeLessThanOrEqual(1);
    }
  });
});
