import { describe, expect, it } from 'vitest';
import type { ArticuloAnalizado, TelaAnalizada } from '@/features/catalogo/model/tipos';
import { detallarDescuadres } from './detallarDescuadres';
import { hojaDescuadres } from './exportarDescuadres';

type M = { stockInicial: number; compras: number; ventas: number; stockHoy: number };
const tela = (nombre: string, m: M) => ({ clase: 'tela', nombre, unidad: 'KGS', subRubro: 'PUNTO', ...m }) as unknown as TelaAnalizada;
const art = (codigo: string, t: string, m: M) =>
  ({ clase: 'articulo', codigo, descripcion: `${t} ${codigo}`, tela: t, unidad: 'KGS', ...m }) as unknown as ArticuloAnalizado;

const ARTS = [
  art('A1', 'A', { stockInicial: 100, compras: 0, ventas: 30, stockHoy: 50 }), // falta 20
  art('A2', 'A', { stockInicial: 0, compras: 0, ventas: 10, stockHoy: 0 }), // vendió sin stock: hoy 0 en vez de −10 → +10
  art('A3', 'A', { stockInicial: 50, compras: 0, ventas: 10, stockHoy: 40 }), // cierra
  art('B1', 'B', { stockInicial: 0, compras: 0, ventas: 0, stockHoy: 5 }), // apareció: sobra 5
];
const TELAS = [
  tela('A', { stockInicial: 150, compras: 0, ventas: 50, stockHoy: 90 }), // −10 en la tela
  tela('B', { stockInicial: 0, compras: 0, ventas: 0, stockHoy: 5 }),
  tela('C', { stockInicial: 10, compras: 0, ventas: 5, stockHoy: 5 }), // cierra
];

describe('detallarDescuadres', () => {
  it('lista solo las telas que no cierran, con sus artículos y causa probable', () => {
    const r = detallarDescuadres(TELAS, ARTS);
    expect(r.map((x) => [x.tela.nombre, x.diferencia])).toEqual([
      ['A', -10],
      ['B', 5],
    ]);
    const a = r[0];
    expect(a.articulos.map((x) => [x.articulo.codigo, x.diferencia, x.causa.clave])).toEqual([
      ['A1', -20, 'falta'],
      ['A2', 10, 'venta-sin-stock'],
    ]);
    expect(a.restoSinArticulo).toBe(0); // −20 + 10 = −10: los artículos explican toda la tela
    expect(r[1].articulos[0].causa.clave).toBe('aparecio');
  });

  it('filtra por sentido y por búsqueda de código', () => {
    expect(detallarDescuadres(TELAS, ARTS, { q: '', sentido: 'sobra' }).map((x) => x.tela.nombre)).toEqual(['B']);
    expect(detallarDescuadres(TELAS, ARTS, { q: 'a2', sentido: '' }).map((x) => x.tela.nombre)).toEqual(['A']);
  });

  it('exporta una fila por tela y una por artículo que no cierra', () => {
    const hoja = hojaDescuadres(detallarDescuadres(TELAS, ARTS));
    expect(hoja.filas.map((f) => f[2])).toEqual(['CODIGO', '', 'A1', 'A2', '', 'B1']);
  });
});
