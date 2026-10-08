import { describe, expect, it } from 'vitest';
import { resolverTemporadas } from './resolverTemporadas';

const TELAS = ['CEY', 'RIB ONIX', 'FLANEL LUMINOSO', 'FLANEL LUMINOSO DSN', 'BATISTA 90/10'];

describe('resolverTemporadas', () => {
  it('cruza por nombre exacto (normalizado) y por equivalencia', () => {
    const r = resolverTemporadas(
      TELAS,
      [
        { nombre: ' cey ', temporada: 'VERANO' },
        { nombre: 'RIBB ONIX', temporada: 'ATEMPORAL' },
        { nombre: 'FLANNEL LUMINOSO', temporada: 'INVIERNO' },
      ],
      { 'RIBB ONIX': ['RIB ONIX'], 'FLANNEL LUMINOSO': ['FLANEL LUMINOSO', 'FLANEL LUMINOSO DSN'] },
    );
    expect(r.porTela.get('CEY')).toMatchObject({ temporada: 'VERANO', origen: 'lista' });
    expect(r.porTela.get('RIB ONIX')).toMatchObject({ temporada: 'ATEMPORAL', origen: 'alias', nombreLista: 'RIBB ONIX' });
    expect(r.porTela.get('FLANEL LUMINOSO DSN')?.temporada).toBe('INVIERNO');
    expect(r.porTela.get('BATISTA 90/10')).toMatchObject({ temporada: null, origen: 'ninguno' });
    expect(r.sinCruce).toEqual([]);
  });

  it('la corrección manual pisa a la lista y conserva lo que decía la lista', () => {
    const r = resolverTemporadas(
      TELAS,
      [{ nombre: 'CEY', temporada: 'VERANO' }],
      {},
      { CEY: 'ATEMPORAL', 'BATISTA 90/10': 'VERANO' },
    );
    expect(r.porTela.get('CEY')).toMatchObject({ temporada: 'ATEMPORAL', origen: 'manual', temporadaLista: 'VERANO' });
    expect(r.porTela.get('BATISTA 90/10')).toMatchObject({ temporada: 'VERANO', origen: 'manual', temporadaLista: null });
  });

  it('informa nombres sin cruce y conflictos (gana el exacto)', () => {
    const r = resolverTemporadas(
      TELAS,
      [
        { nombre: 'RIB ONIX', temporada: 'INVIERNO' },
        { nombre: 'RIBB ONIX', temporada: 'ATEMPORAL' },
        { nombre: 'TELA INEXISTENTE', temporada: 'VERANO' },
      ],
      { 'RIBB ONIX': ['RIB ONIX'] },
    );
    expect(r.porTela.get('RIB ONIX')?.temporada).toBe('INVIERNO');
    expect(r.conflictos).toHaveLength(1);
    expect(r.sinCruce.map((e) => e.nombre)).toEqual(['TELA INEXISTENTE']);
  });
});
