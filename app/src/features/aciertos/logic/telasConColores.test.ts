/** Tests de la vista unificada tela + colores. */
import { describe, expect, it } from 'vitest';
import type { ArticuloAnalizado, TelaAnalizada } from '@/features/catalogo/model/tipos';
import { indexarColores, telasConColores } from './telasConColores';

const tela = (nombre: string, ventas: number) =>
  ({ clase: 'tela', nombre, subRubro: 'PUNTO', unidad: 'KGS', ventas, recomendacion: 1 }) as TelaAnalizada;
const color = (codigo: string, t: string, descripcion: string, ventas: number) =>
  ({ clase: 'articulo', codigo, tela: t, descripcion, ventas, unidad: 'KGS', subRubro: 'PUNTO' }) as ArticuloAnalizado;

const telas = [tela('RIB ONIX', 100), tela('CEY', 300)];
const idx = indexarColores([
  color('R1', 'RIB ONIX', 'RIB ONIX NEGRO', 10),
  color('R2', 'RIB ONIX', 'RIB ONIX ROSA BB', 90),
  color('C1', 'CEY', 'CEY NEGRO', 300),
]);
const base = { q: '', unidad: '', subRubro: '', rotacion: '', recomendacion: null, orden: 'ven' } as const;

describe('telasConColores', () => {
  it('ordena telas y colores con el mismo criterio', () => {
    const r = telasConColores(telas, idx, base);
    expect(r.map((x) => x.tela.nombre)).toEqual(['CEY', 'RIB ONIX']);
    expect(r[1].colores.map((c) => c.codigo)).toEqual(['R2', 'R1']);
  });

  it('por nombre de tela muestra todos sus colores', () => {
    const r = telasConColores(telas, idx, { ...base, q: 'rib' });
    expect(r).toHaveLength(1);
    expect(r[0].porColor).toBe(false);
    expect(r[0].colores).toHaveLength(2);
  });

  it('por color muestra solo los colores que coinciden y abre la tela', () => {
    const r = telasConColores(telas, idx, { ...base, q: 'negro' });
    expect(r.map((x) => x.tela.nombre)).toEqual(['CEY', 'RIB ONIX']);
    expect(r.every((x) => x.porColor)).toBe(true);
    expect(r[1].colores.map((c) => c.codigo)).toEqual(['R1']);
  });
});
