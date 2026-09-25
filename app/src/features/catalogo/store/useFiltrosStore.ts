/**
 * Store de filtros y estado de las vistas (Zustand).
 *
 * Reemplaza al objeto `state` mutable global del HTML original. Centraliza lo que
 * el usuario elige (búsqueda, unidad, orden, recomendación, moneda, etc.) para
 * que cualquier vista lo consuma sin prop-drilling. Cada setter que cambia el
 * conjunto de filas resetea los límites de paginación.
 */
import { create } from 'zustand';
import type { Recomendacion, Rotacion } from '../model/tipos';
import type { Moneda } from '@/shared/tipos/moneda';
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
  recomendacion: Recomendacion | null;
  // --- tablas de aciertos ---
  orden: OrdenTabla;
  limiteTabla: number;
  // --- ranking ---
  modoRanking: ModoRanking;
  alcanceRanking: AlcanceRanking;
  limiteRanking: number;
  // --- precios ---
  moneda: Moneda;
  alcancePrecios: AlcancePrecios;
  ordenPrecios: OrdenPrecios;
  volumenMin: number;
  limitePrecios: number;

  setQ: (q: string) => void;
  setUnidad: (u: Unidad | '') => void;
  setSubRubro: (s: SubRubro | '') => void;
  setRotacion: (r: Rotacion | '') => void;
  toggleRecomendacion: (r: Recomendacion) => void;
  setOrden: (o: OrdenTabla) => void;
  verMasTabla: () => void;
  setModoRanking: (m: ModoRanking) => void;
  setAlcanceRanking: (a: AlcanceRanking) => void;
  verMasRanking: () => void;
  setMoneda: (m: Moneda) => void;
  setAlcancePrecios: (a: AlcancePrecios) => void;
  setOrdenPrecios: (o: OrdenPrecios) => void;
  setVolumenMin: (v: number) => void;
  verMasPrecios: () => void;
}

const LIMITE_TABLA = 120;
const LIMITE_RANKING = 40;
const LIMITE_PRECIOS = 100;

/** Al cambiar un filtro, se reinician los límites de paginación de todas las vistas. */
const RESET_LIMITES = {
  limiteTabla: LIMITE_TABLA,
  limiteRanking: LIMITE_RANKING,
  limitePrecios: LIMITE_PRECIOS,
};

export const useFiltrosStore = create<FiltrosState>((set) => ({
  q: '',
  unidad: '',
  subRubro: '',
  rotacion: '',
  recomendacion: null,
  orden: 'ven',
  limiteTabla: LIMITE_TABLA,
  modoRanking: 'repo',
  alcanceRanking: 'all',
  limiteRanking: LIMITE_RANKING,
  moneda: 1,
  alcancePrecios: 'lista',
  ordenPrecios: 'un',
  volumenMin: 0,
  limitePrecios: LIMITE_PRECIOS,

  setQ: (q) => set({ q, ...RESET_LIMITES }),
  setUnidad: (unidad) => set({ unidad, ...RESET_LIMITES }),
  setSubRubro: (subRubro) => set({ subRubro, ...RESET_LIMITES }),
  setRotacion: (rotacion) => set({ rotacion, ...RESET_LIMITES }),
  toggleRecomendacion: (r) =>
    set((s) => ({ recomendacion: s.recomendacion === r ? null : r, limiteTabla: LIMITE_TABLA })),
  setOrden: (orden) => set({ orden, limiteTabla: LIMITE_TABLA }),
  verMasTabla: () => set((s) => ({ limiteTabla: s.limiteTabla + 200 })),
  setModoRanking: (modoRanking) => set({ modoRanking, limiteRanking: LIMITE_RANKING }),
  setAlcanceRanking: (alcanceRanking) => set({ alcanceRanking, limiteRanking: LIMITE_RANKING }),
  verMasRanking: () => set((s) => ({ limiteRanking: s.limiteRanking + 40 })),
  setMoneda: (moneda) => set({ moneda, limitePrecios: LIMITE_PRECIOS }),
  setAlcancePrecios: (alcancePrecios) => set({ alcancePrecios, limitePrecios: LIMITE_PRECIOS }),
  setOrdenPrecios: (ordenPrecios) => set({ ordenPrecios, limitePrecios: LIMITE_PRECIOS }),
  setVolumenMin: (volumenMin) => set({ volumenMin, limitePrecios: LIMITE_PRECIOS }),
  verMasPrecios: () => set((s) => ({ limitePrecios: s.limitePrecios + 200 })),
}));
