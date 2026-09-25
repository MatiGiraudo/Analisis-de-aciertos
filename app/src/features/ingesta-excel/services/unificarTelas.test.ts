/** Tests de la unificación de grupos del ERP en telas. */
import { describe, expect, it } from 'vitest';
import { UnificarPorDiseno } from './unificarTelas';

const unificador = new UnificarPorDiseno(new Set(['MORLEY BRUSH DSN']), {
  'SCUBA SUEDE C CORDERITO': 'SCUBA SUEDE CON CORDERITO',
});
const art = (codigo: string, grupo: string, descripcion = `${grupo} NEGRO (E)`) => ({ codigo, grupo, descripcion });

describe('UnificarPorDiseno', () => {
  const r = unificador.unificar([
    art('B1', 'BRODERY PLANO', 'BRODERY PLANO dsn 1 NEGRO (E)'),
    art('B4', 'BRODERY PLANO dsn 4'),
    art('M0', 'MODAL SOFT'),
    art('M1', 'MODAL SOFT dsn 0093'),
    art('P1', 'POPLIN EST 2302'),
    art('C1', 'CORDERITO 14'),
    art('C2', 'CAMISACO A57'),
    art('J1', 'JERSEY TUBULAR 24-1'),
    art('K1', 'CHAUD 1RA'),
    art('W1', '4 WAY'),
    art('MB', 'MORLEY BRUSH dsn 2545'),
    art('S1', '', 'SCUBA SUEDE C CORDERITO BEIGE (E)'),
    art('X1', 'SCUBA SUEDE CON CORDERITO'),
  ]);
  const tela = (c: string) => r.porCodigo.get(c);

  it('une todos los diseños de una tela sin versión lisa', () => {
    expect(tela('B1')).toBe('BRODERY PLANO');
    expect(tela('B4')).toBe('BRODERY PLANO');
  });
  it('separa estampados de lisos cuando existen ambos', () => {
    expect(tela('M0')).toBe('MODAL SOFT');
    expect(tela('M1')).toBe('MODAL SOFT DSN');
  });
  it('respeta el nombre "X DSN" de la lista de referencia', () => {
    expect(tela('MB')).toBe('MORLEY BRUSH DSN');
  });
  it('quita códigos de diseño cortos y alfanuméricos', () => {
    expect(tela('P1')).toBe('POPLIN EST');
    expect(tela('C1')).toBe('CORDERITO');
    expect(tela('C2')).toBe('CAMISACO');
  });
  it('no toca números que son parte del nombre de la tela', () => {
    expect(tela('J1')).toBe('JERSEY TUBULAR 24-1');
    expect(tela('K1')).toBe('CHAUD 1RA');
    expect(tela('W1')).toBe('4 WAY');
  });
  it('asigna artículos sin grupo por alias + prefijo', () => {
    expect(tela('S1')).toBe('SCUBA SUEDE CON CORDERITO');
  });
  it('aplica fusiones aprobadas', () => {
    const f = new UnificarPorDiseno(new Set(), {}, { 'POPLIN EST': 'POPLIN DSN' }).unificar([
      art('P0', 'POPLIN'),
      art('P1', 'POPLIN EST 2302'),
      art('P2', 'POPLIN dsn 4002'),
    ]);
    expect(f.porCodigo.get('P1')).toBe('POPLIN DSN');
    expect(f.porCodigo.get('P2')).toBe('POPLIN DSN');
    expect(f.telaDeGrupo('POPLIN EST 2399')).toBe('POPLIN DSN');
  });

  it('las fusiones aplican por prefijo y gana la clave más larga', () => {
    const f = new UnificarPorDiseno(new Set(), {}, {
      'MORLEY EST': 'MORLEY DSN',
      'POLYSPOON EST DSN': 'POLYSPOON EST',
    }).unificar([art('M1', 'MORLEY EST ZIGGY'), art('M2', 'MORLEY EST 2518'), art('P1', 'POLYSPOON EST dsn 1')]);
    expect(f.porCodigo.get('M1')).toBe('MORLEY DSN');
    expect(f.porCodigo.get('M2')).toBe('MORLEY DSN');
  });

  it('resuelve grupos de una foto por tela', () => {
    expect(r.telaDeGrupo('BRODERY PLANO dsn 5')).toBe('BRODERY PLANO');
  });
});
