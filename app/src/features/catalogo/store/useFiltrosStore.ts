/**
 * Store de filtros y estado de las vistas (Zustand).
 *
 * Reemplaza al objeto `state` mutable global del HTML original. Centraliza lo que
 * el usuario elige (búsqueda, unidad, orden, recomendación, moneda, etc.) para
 * que cualquier vista lo consuma sin prop-drilling. Cada setter que cambia el
 * conjunto de filas vuelve las vistas afectadas a la página 1.
 */
import { create } from 'zustand';
import type { Recomendacion, Rotacion } from '../model/tipos';
import type { Moneda } from '@/shared/tipos/moneda';
import type { FiltroTemporada } from '@/shared/tipos/temporada';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';

/** Claves de orden de las tablas de aciertos. */
export type OrdenTabla =
  | 'ven' | 'hoy' | 'com' | 'ini' | 'st' | 'st_asc' | 'cob' | 'disp' | 'n' | 'rec' | 'name';

export type ModoRanking = 'repo' | 'dead';
export type AlcanceRanking = 'all' | 'list';
export type AlcancePrecios = 'lista' | 'tela' | 'art';
export type OrdenPrecios = 'un' | 'sh' | 'net' | 'pr' | 'name';

interface FiltrosState {
  // --- filtros compartidos ---
  q: string;
  unidad: Unidad | '';
  subRubro: SubRubro | '';
  rotacion: Rotacion | '';
  temporada: FiltroTemporada;
  recomendacion: Recomendacion | null;
  // --- tablas de aciertos ---
  orden: OrdenTabla;
  paginaTabla: number;
  // --- ranking ---
  modoRanking: ModoRanking;
  alcanceRanking: AlcanceRanking;
  paginaRanking: number;
  // --- precios ---
  moneda: Moneda;
  alcancePrecios: AlcancePrecios;
  ordenPrecios: OrdenPrecios;
  volumenMin: number;
  paginaPrecios: number;
  // --- colores de tendencia ---
  paginaTendencias: number;
  // --- temporadas ---
  paginaTemporadas: number;

  setQ: (q: string) => void;
  setUnidad: (u: Unidad | '') => void;
  setSubRubro: (s: SubRubro | '') => void;
  setRotacion: (r: Rotacion | '') => void;
  setTemporada: (t: FiltroTemporada) => void;
  toggleRecomendacion: (r: Recomendacion) => void;
  setOrden: (o: OrdenTabla) => void;
  setPaginaTabla: (p: number) => void;
  setModoRanking: (m: ModoRanking) => void;
  setAlcanceRanking: (a: AlcanceRanking) => void;
  setPaginaRanking: (p: number) => void;
  setMoneda: (m: Moneda) => void;
  setAlcancePrecios: (a: AlcancePrecios) => void;
  setOrdenPrecios: (o: OrdenPrecios) => void;
  setVolumenMin: (v: number) => void;
  setPaginaPrecios: (p: number) => void;
  setPaginaTendencias: (p: number) => void;
  setPaginaTemporadas: (p: number) => void;
}

/** Al cambiar un filtro compartido, todas las vistas vuelven a la página 1. */
const RESET_PAGINAS = {
  paginaTabla: 1,
  paginaRanking: 1,
  paginaPrecios: 1,
  paginaTendencias: 1,
  paginaTemporadas: 1,
};

export const useFiltrosStore = create<FiltrosState>((set) => ({
  q: '',
  unidad: '',
  subRubro: '',
  rotacion: '',
  temporada: '',
  recomendacion: null,
  orden: 'ven',
  modoRanking: 'repo',
  alcanceRanking: 'all',
  moneda: 1,
  alcancePrecios: 'lista',
  ordenPrecios: 'un',
  volumenMin: 0,
  ...RESET_PAGINAS,

  setQ: (q) => set({ q, ...RESET_PAGINAS }),
  setUnidad: (unidad) => set({ unidad, ...RESET_PAGINAS }),
  setSubRubro: (subRubro) => set({ subRubro, ...RESET_PAGINAS }),
  setRotacion: (rotacion) => set({ rotacion, ...RESET_PAGINAS }),
  setTemporada: (temporada) => set({ temporada, ...RESET_PAGINAS }),
  toggleRecomendacion: (r) =>
    set((s) => ({ recomendacion: s.recomendacion === r ? null : r, paginaTabla: 1 })),
  setOrden: (orden) => set({ orden, paginaTabla: 1 }),
  setPaginaTabla: (paginaTabla) => set({ paginaTabla }),
  setModoRanking: (modoRanking) => set({ modoRanking, paginaRanking: 1 }),
  setAlcanceRanking: (alcanceRanking) => set({ alcanceRanking, paginaRanking: 1 }),
  setPaginaRanking: (paginaRanking) => set({ paginaRanking }),
  setMoneda: (moneda) => set({ moneda, paginaPrecios: 1 }),
  setAlcancePrecios: (alcancePrecios) => set({ alcancePrecios, paginaPrecios: 1 }),
  setOrdenPrecios: (ordenPrecios) => set({ ordenPrecios, paginaPrecios: 1 }),
  setVolumenMin: (volumenMin) => set({ volumenMin, paginaPrecios: 1 }),
  setPaginaPrecios: (paginaPrecios) => set({ paginaPrecios }),
  setPaginaTendencias: (paginaTendencias) => set({ paginaTendencias }),
  setPaginaTemporadas: (paginaTemporadas) => set({ paginaTemporadas }),
}));
