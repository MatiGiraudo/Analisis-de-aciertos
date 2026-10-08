/**
 * Store de temporadas (Zustand + persistencia en el navegador).
 *
 * Guarda lo que el usuario decide sobre las temporadas y que debe sobrevivir a
 * recargar la página o cargar otro Excel del ERP:
 *  - `lista`: la lista de temporadas cargada desde un .xlsx (`null` = la lista
 *    base de `config/temporadasBase.ts`);
 *  - `manuales`: correcciones tela por tela, que pisan a la lista.
 *
 * Se persiste en localStorage de ESTE navegador (la app no tiene backend): para
 * llevar los cambios a otra máquina se exporta el Excel y se carga allá.
 * Si el almacenamiento no está disponible, todo funciona igual en memoria.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Temporada } from '@/shared/tipos/temporada';
import type { EntradaTemporada } from '../config/temporadasBase';
import type { CorreccionesTemporada } from '../logic/resolverTemporadas';

export interface CambioTemporada {
  readonly tela: string;
  readonly temporada: Temporada;
  /** Lo que dice la lista para esa tela (`null` si no figura). */
  readonly temporadaLista: Temporada | null;
}

interface TemporadasState {
  lista: readonly EntradaTemporada[] | null;
  /** Nombre del archivo de la lista cargada (`null` = lista base). */
  nombreLista: string | null;
  manuales: CorreccionesTemporada;

  /**
   * Corrige la temporada de una o varias telas. Si la elegida coincide con la de
   * la lista, se quita la corrección (no hace falta guardarla).
   */
  asignar: (cambios: readonly CambioTemporada[]) => void;
  /** Vuelve una tela a lo que diga la lista. */
  restaurar: (tela: string) => void;
  /** Reemplaza la lista base y descarta las correcciones manuales. */
  cargarLista: (lista: readonly EntradaTemporada[], nombre: string) => void;
  /** Vuelve a la lista base y descarta todas las correcciones. */
  restablecer: () => void;
}

export const useTemporadasStore = create<TemporadasState>()(
  persist(
    (set) => ({
      lista: null,
      nombreLista: null,
      manuales: {},

      asignar: (cambios) =>
        set((s) => {
          const manuales = { ...s.manuales };
          for (const { tela, temporada, temporadaLista } of cambios) {
            if (temporada === temporadaLista) delete manuales[tela];
            else manuales[tela] = temporada;
          }
          return { manuales };
        }),
      restaurar: (tela) =>
        set((s) => {
          const manuales = { ...s.manuales };
          delete manuales[tela];
          return { manuales };
        }),
      cargarLista: (lista, nombre) => set({ lista, nombreLista: nombre, manuales: {} }),
      restablecer: () => set({ lista: null, nombreLista: null, manuales: {} }),
    }),
    {
      name: 'aciertos.temporadas',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
