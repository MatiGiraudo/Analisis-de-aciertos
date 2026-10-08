/**
 * Filas de la vista Temporadas (función pura): une cada tela con su asignación,
 * aplica los filtros propios de la vista (temporada y origen) y agrupa por
 * temporada —Verano, Invierno, Atemporal y al final las sin asignar— respetando,
 * dentro de cada grupo, el orden que ya traían las telas.
 */
import type { TelaAnalizada } from '@/features/catalogo/model/tipos';
import type { FiltroTemporada } from '@/shared/tipos/temporada';
import { pasaFiltroTemporada, TEMPORADAS } from '@/shared/tipos/temporada';
import type { AsignacionTemporada, OrigenTemporada, ResolucionTemporadas } from './resolverTemporadas';

export type FiltroOrigen = '' | Extract<OrigenTemporada, 'manual' | 'alias'>;

export interface FilaTemporada {
  readonly tela: TelaAnalizada;
  readonly asignacion: AsignacionTemporada;
}

const SIN_ASIGNAR: AsignacionTemporada = { temporada: null, origen: 'ninguno', temporadaLista: null };

export function filasTemporadas(
  telas: readonly TelaAnalizada[],
  resolucion: ResolucionTemporadas,
  temporada: FiltroTemporada,
  origen: FiltroOrigen,
): FilaTemporada[] {
  const rango = (f: FilaTemporada) => {
    const i = f.asignacion.temporada ? TEMPORADAS.indexOf(f.asignacion.temporada) : -1;
    return i < 0 ? TEMPORADAS.length : i;
  };
  return telas
    .map((tela) => ({ tela, asignacion: resolucion.porTela.get(tela.nombre) ?? SIN_ASIGNAR }))
    .filter(({ asignacion: a }) => pasaFiltroTemporada(a.temporada, temporada) && (!origen || a.origen === origen))
    .sort((a, b) => rango(a) - rango(b)); // sort estable: conserva el orden dentro del grupo
}
