/**
 * Cruce de la lista base de temporadas + equivalencias contra las telas reales
 * (exports sep-2026). Se saltea si los Excel no están (no se versionan).
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LectorPlanillaXlsx } from '@/features/ingesta-excel/services/LectorPlanillaXlsx';
import { procesarArchivos } from '@/features/ingesta-excel/services/procesarPlanilla';
import { resolverTemporadas } from '../logic/resolverTemporadas';
import { ALIAS_TEMPORADAS } from './aliasTemporadas';
import { TEMPORADAS_BASE } from './temporadasBase';

const ruta = (nombre: string) => fileURLToPath(new URL(`../../../../../${nombre}`, import.meta.url));
const ARCHIVOS = ['Datos para reporte final.xlsx', 'Stock al 5-8.xlsx'];
const HAY_DATOS = ARCHIVOS.every((n) => existsSync(ruta(n)));

describe.skipIf(!HAY_DATOS)('temporadas base contra las telas reales', () => {
  it('las equivalencias apuntan a telas que existen y casi toda la venta queda asignada', async () => {
    const entradas = ARCHIVOS.map((nombre) => {
      const b = readFileSync(ruta(nombre));
      return { nombre, datos: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
    });
    const catalogo = await procesarArchivos(entradas, new LectorPlanillaXlsx(), { hoy: new Date(2026, 8, 24) });
    const nombres = new Set(catalogo.telas.map((t) => t.nombre));

    const destinosInexistentes = Object.values(ALIAS_TEMPORADAS)
      .flat()
      .filter((d) => !nombres.has(d));
    expect(destinosInexistentes).toEqual([]);

    const r = resolverTemporadas([...nombres], TEMPORADAS_BASE, ALIAS_TEMPORADAS);
    expect(r.conflictos).toEqual([]);
    const ventas = (pred: (nombre: string) => boolean) =>
      catalogo.telas.filter((t) => pred(t.nombre)).reduce((s, t) => s + Math.max(0, t.ventas), 0);
    const asignada = ventas((n) => r.porTela.get(n)?.temporada != null) / ventas(() => true);
    console.info(
      `temporadas: ${[...r.porTela.values()].filter((a) => a.temporada).length}/${nombres.size} telas asignadas, ` +
        `${(asignada * 100).toFixed(1)}% de las unidades vendidas; ${r.sinCruce.length} nombres de la lista sin cruce`,
    );
    expect(asignada).toBeGreaterThan(0.8);
  }, 60_000);
});
