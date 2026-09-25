/**
 * Lógica pura del ranking por TELA, con sus colores.
 *
 * Portada de `renderRank()` del HTML y llevada a nivel tela: rankea telas por su
 * puntaje (percentil entre telas de la misma unidad) y adjunta sus colores
 * ordenados por el puntaje de cada artículo. Aplica los filtros compartidos. No
 * pagina ni toca el DOM.
 */
import type { ArticuloAnalizado, Puntajes, Rotacion, TelaAnalizada } from '@/features/catalogo/model/tipos';
import type { AlcanceRanking, ModoRanking } from '@/features/catalogo/store/useFiltrosStore';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';

export interface CriteriosRanking {
  readonly modo: ModoRanking;
  readonly alcance: AlcanceRanking;
  readonly q: string;
  readonly unidad: Unidad | '';
  readonly subRubro: SubRubro | '';
  readonly rotacion: Rotacion | '';
}

/** Una tela rankeada con sus colores (todos, ordenados por puntaje desc). */
export interface TelaRankeada {
  readonly tela: TelaAnalizada;
  readonly puntaje: number;
  readonly colores: readonly ArticuloAnalizado[];
}

/** Devuelve el puntaje de una tela o artículo según el modo activo. */
export function puntajeDe(item: Puntajes, modo: ModoRanking): number {
  return modo === 'repo' ? item.puntajeReponer : item.puntajePlataParada;
}

export function rankearTelas(
  telas: readonly TelaAnalizada[],
  articulos: readonly ArticuloAnalizado[],
  c: CriteriosRanking,
): TelaRankeada[] {
  const coloresPorTela = new Map<string, ArticuloAnalizado[]>();
  for (const a of articulos) {
    const arr = coloresPorTela.get(a.tela);
    if (arr) arr.push(a);
    else coloresPorTela.set(a.tela, [a]);
  }

  const q = c.q.trim().toLowerCase();
  const coincide = (t: TelaAnalizada, colores: readonly ArticuloAnalizado[]) =>
    !q ||
    t.nombre.toLowerCase().includes(q) ||
    colores.some((a) => `${a.codigo} ${a.descripcion}`.toLowerCase().includes(q));

  let r = telas.filter((t) => puntajeDe(t, c.modo) > 0);
  if (c.alcance === 'list') r = r.filter((t) => t.enLista);
  if (c.unidad) r = r.filter((t) => t.unidad === c.unidad);
  if (c.subRubro) r = r.filter((t) => t.subRubro === c.subRubro);
  if (c.rotacion) r = r.filter((t) => t.rotacion === c.rotacion);

  return r
    .map((tela) => {
      const colores = (coloresPorTela.get(tela.nombre) ?? [])
        .slice()
        .sort((a, b) => puntajeDe(b, c.modo) - puntajeDe(a, c.modo));
      return { tela, puntaje: puntajeDe(tela, c.modo), colores };
    })
    .filter((x) => coincide(x.tela, x.colores))
    .sort((a, b) => b.puntaje - a.puntaje);
}

/** Texto explicativo de cada modo (mismo copy del HTML, a nivel tela). */
export const EXPLICACION_RANKING: Record<ModoRanking, string> = {
  repo:
    'Reponer ya. Ordena por peso de la venta dentro de su unidad (45%), sell-through (35%) y qué ' +
    'tan cerca está de agotarse (20%). Arriba quedan las telas que se vendieron bien y están ' +
    'por quedarse sin stock. Abrí una tela para ver qué colores reponer primero.',
  dead:
    'Plata parada. Ordena por volumen de stock remanente (45%), lo que no se vendió (30%) y ' +
    'cuántas temporadas de cobertura sobran (25%). Arriba queda el capital más inmovilizado. ' +
    'Abrí una tela para ver qué colores la frenan.',
};
