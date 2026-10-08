/**
 * Asigna una temporada a cada tela del catálogo (función pura).
 *
 * Prioridad (gana la primera que aplica):
 *  1. `manual`: corrección hecha por el usuario desde la vista Temporadas;
 *  2. `lista`: la lista de temporadas trae la tela con su nombre exacto
 *     (comparado normalizado: mayúsculas y espacios);
 *  3. `alias`: un nombre de la lista apunta a la tela vía `ALIAS_TEMPORADAS`;
 *  4. si nada aplica, la tela queda sin asignar (`temporada: null`).
 *
 * Además informa los nombres de la lista que no cruzaron con ninguna tela y los
 * conflictos (dos entradas de la lista que dan temporadas distintas a la misma tela;
 * gana la coincidencia exacta y, entre alias, la primera).
 */
import { normalizarNombreTela } from '@/features/ingesta-excel/config/listaDestacada';
import type { Temporada } from '@/shared/tipos/temporada';
import type { EntradaTemporada } from '../config/temporadasBase';

export type OrigenTemporada = 'manual' | 'lista' | 'alias' | 'ninguno';

export interface AsignacionTemporada {
  readonly temporada: Temporada | null;
  readonly origen: OrigenTemporada;
  /** Temporada que diría la lista (sin la corrección manual); `null` si no figura. */
  readonly temporadaLista: Temporada | null;
  /** Nombre en la lista que dio la temporada (si vino de la lista o de un alias). */
  readonly nombreLista?: string;
}

export interface ResolucionTemporadas {
  /** tela (nombre de la app) → asignación. Incluye todas las telas recibidas. */
  readonly porTela: ReadonlyMap<string, AsignacionTemporada>;
  /** Entradas de la lista que no corresponden a ninguna tela del catálogo. */
  readonly sinCruce: readonly EntradaTemporada[];
  /** Mensajes de conflicto entre entradas de la lista. */
  readonly conflictos: readonly string[];
}

/** Correcciones manuales: tela → temporada elegida por el usuario. */
export type CorreccionesTemporada = Readonly<Record<string, Temporada>>;

interface Candidato {
  readonly temporada: Temporada;
  readonly nombreLista: string;
  readonly exacto: boolean;
}

export function resolverTemporadas(
  telas: readonly string[],
  lista: readonly EntradaTemporada[],
  alias: Readonly<Record<string, readonly string[]>>,
  manuales: CorreccionesTemporada = {},
): ResolucionTemporadas {
  const telaPorClave = new Map(telas.map((t) => [normalizarNombreTela(t), t]));
  const aliasPorClave = new Map(Object.entries(alias).map(([k, v]) => [normalizarNombreTela(k), v]));

  const candidatos = new Map<string, Candidato>();
  const conflictos: string[] = [];
  const sinCruce: EntradaTemporada[] = [];

  const proponer = (tela: string, c: Candidato) => {
    const previo = candidatos.get(tela);
    if (!previo) {
      candidatos.set(tela, c);
      return;
    }
    if (previo.temporada !== c.temporada) {
      const gana = !previo.exacto && c.exacto ? c : previo;
      conflictos.push(
        `${tela}: "${previo.nombreLista}" dice ${previo.temporada} y "${c.nombreLista}" dice ${c.temporada} — se usa ${gana.temporada}.`,
      );
      if (gana === c) candidatos.set(tela, c);
    }
  };

  for (const e of lista) {
    const clave = normalizarNombreTela(e.nombre);
    let cruzo = false;
    const exacta = telaPorClave.get(clave);
    if (exacta) {
      proponer(exacta, { temporada: e.temporada, nombreLista: e.nombre, exacto: true });
      cruzo = true;
    }
    for (const destino of aliasPorClave.get(clave) ?? []) {
      const tela = telaPorClave.get(normalizarNombreTela(destino));
      if (!tela) continue;
      proponer(tela, { temporada: e.temporada, nombreLista: e.nombre, exacto: false });
      cruzo = true;
    }
    if (!cruzo) sinCruce.push(e);
  }

  const porTela = new Map<string, AsignacionTemporada>();
  for (const tela of telas) {
    const c = candidatos.get(tela);
    const temporadaLista = c?.temporada ?? null;
    const manual = manuales[tela];
    if (manual) {
      porTela.set(tela, { temporada: manual, origen: 'manual', temporadaLista, nombreLista: c?.nombreLista });
    } else if (c) {
      porTela.set(tela, {
        temporada: c.temporada,
        origen: c.exacto ? 'lista' : 'alias',
        temporadaLista,
        nombreLista: c.nombreLista,
      });
    } else {
      porTela.set(tela, { temporada: null, origen: 'ninguno', temporadaLista: null });
    }
  }

  return { porTela, sinCruce, conflictos };
}
