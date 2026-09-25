/** Tests del ranking por tela con sus colores. */
import { describe, expect, it } from 'vitest';
import type { ArticuloAnalizado, TelaAnalizada } from '@/features/catalogo/model/tipos';
import { rankearTelas } from './rankear';

const tela = (nombre: string, repo: number, extra: Partial<TelaAnalizada> = {}) =>
  ({ nombre, unidad: 'KGS', subRubro: 'PUNTO', enLista: false, rotacion: 'A', puntajeReponer: repo, puntajePlataParada: 0, ...extra }) as TelaAnalizada;
const color = (codigo: string, t: string, repo: number, descripcion = codigo) =>
  ({ codigo, descripcion, tela: t, puntajeReponer: repo, puntajePlataParada: 0 }) as ArticuloAnalizado;

const base = { modo: 'repo', alcance: 'all', q: '', unidad: '', subRubro: '', rotacion: '' } as const;

describe('rankearTelas', () => {
  const telas = [tela('A', 40), tela('B', 90), tela('C', 0), tela('D', 60, { enLista: true })];
  const arts = [color('A1', 'A', 10), color('A2', 'A', 70), color('B1', 'B', 0, 'B ROJO'), color('B2', 'B', 50)];

  it('ordena telas por puntaje y excluye las de puntaje 0', () => {
    expect(rankearTelas(telas, arts, base).map((x) => x.tela.nombre)).toEqual(['B', 'D', 'A']);
  });

  it('adjunta los colores de cada tela ordenados por su puntaje', () => {
    const a = rankearTelas(telas, arts, base).find((x) => x.tela.nombre === 'A')!;
    expect(a.colores.map((c) => c.codigo)).toEqual(['A2', 'A1']);
  });

  it('la búsqueda encuentra la tela por un color', () => {
    expect(rankearTelas(telas, arts, { ...base, q: 'rojo' }).map((x) => x.tela.nombre)).toEqual(['B']);
  });

  it('respeta el alcance Lista de 49', () => {
    expect(rankearTelas(telas, arts, { ...base, alcance: 'list' }).map((x) => x.tela.nombre)).toEqual(['D']);
  });
});
