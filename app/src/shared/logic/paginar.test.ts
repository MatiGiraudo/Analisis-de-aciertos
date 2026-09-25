/** Tests de la paginación compartida. */
import { describe, expect, it } from 'vitest';
import { paginar, rangoPaginas } from './paginar';

const items = Array.from({ length: 23 }, (_, i) => i + 1);

describe('paginar', () => {
  it('corta la página pedida e informa el rango', () => {
    const p = paginar(items, 2, 10);
    expect(p.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(p).toMatchObject({ pagina: 2, totalPaginas: 3, total: 23, desde: 11, hasta: 20 });
  });

  it('la última página puede venir incompleta', () => {
    expect(paginar(items, 3, 10)).toMatchObject({ desde: 21, hasta: 23 });
  });

  it('acota una página fuera de rango a la última', () => {
    expect(paginar(items, 9, 10).pagina).toBe(3);
    expect(paginar(items, 0, 10).pagina).toBe(1);
  });

  it('lista vacía: una página, sin ítems', () => {
    expect(paginar([], 1, 10)).toMatchObject({ pagina: 1, totalPaginas: 1, total: 0, desde: 0, hasta: 0 });
  });
});

describe('rangoPaginas', () => {
  it('muestra todas cuando son pocas', () => {
    expect(rangoPaginas(2, 4)).toEqual([1, 2, 3, 4]);
  });
  it('colapsa los huecos con "…"', () => {
    expect(rangoPaginas(6, 20)).toEqual([1, '…', 5, 6, 7, '…', 20]);
    expect(rangoPaginas(1, 20)).toEqual([1, 2, '…', 20]);
    expect(rangoPaginas(20, 20)).toEqual([1, '…', 19, 20]);
  });
});
