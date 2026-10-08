/**
 * Hooks de lectura de temporadas para cualquier vista.
 *
 * - `useResolucionTemporadas`: temporada de cada tela del catálogo cargado
 *   (catálogo + lista + equivalencias + correcciones → `resolverTemporadas`).
 * - `useCatalogoPorTemporada`: el catálogo recortado por el filtro global de
 *   temporada (telas, lista y artículos de esas telas). Las vistas lo usan en
 *   lugar del catálogo crudo para que el filtro aplique en todas por igual (DRY).
 *
 * La resolución se memoiza a nivel módulo: la consultan muchas filas por render
 * y solo cambia cuando cambia alguna de sus entradas.
 */
import { useMemo } from 'react';
import type { Catalogo } from '@/features/catalogo/model/tipos';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { pasaFiltroTemporada } from '@/shared/tipos/temporada';
import type { Temporada } from '@/shared/tipos/temporada';
import { ALIAS_TEMPORADAS } from '../config/aliasTemporadas';
import { TEMPORADAS_BASE } from '../config/temporadasBase';
import { resolverTemporadas } from '../logic/resolverTemporadas';
import type { ResolucionTemporadas } from '../logic/resolverTemporadas';
import { useTemporadasStore } from '../store/useTemporadasStore';

let cache:
  | { telas: Catalogo['telas']; lista: unknown; manuales: unknown; resultado: ResolucionTemporadas }
  | undefined;

const VACIA: ResolucionTemporadas = { porTela: new Map(), sinCruce: [], conflictos: [] };

export function useResolucionTemporadas(): ResolucionTemporadas {
  const telas = useCatalogoStore((s) => s.catalogo?.telas);
  const lista = useTemporadasStore((s) => s.lista);
  const manuales = useTemporadasStore((s) => s.manuales);
  if (!telas) return VACIA;
  if (!cache || cache.telas !== telas || cache.lista !== lista || cache.manuales !== manuales) {
    cache = {
      telas,
      lista,
      manuales,
      resultado: resolverTemporadas(
        telas.map((t) => t.nombre),
        lista ?? TEMPORADAS_BASE,
        ALIAS_TEMPORADAS,
        manuales,
      ),
    };
  }
  return cache.resultado;
}

/** Temporada de una tela (`null` = sin asignar). */
export function useTemporadaDe(): (tela: string) => Temporada | null {
  const r = useResolucionTemporadas();
  return (tela) => r.porTela.get(tela)?.temporada ?? null;
}

export function useCatalogoPorTemporada(): Catalogo | null {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const filtro = useFiltrosStore((s) => s.temporada);
  const resolucion = useResolucionTemporadas();

  return useMemo(() => {
    if (!catalogo || !filtro) return catalogo;
    const pasa = (tela: string) => pasaFiltroTemporada(resolucion.porTela.get(tela)?.temporada ?? null, filtro);
    return {
      ...catalogo,
      telas: catalogo.telas.filter((t) => pasa(t.nombre)),
      lista: catalogo.lista.filter((t) => pasa(t.nombre)),
      articulos: catalogo.articulos.filter((a) => pasa(a.tela)),
    };
  }, [catalogo, filtro, resolucion]);
}
