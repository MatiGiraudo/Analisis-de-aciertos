/**
 * Store del catálogo cargado (Zustand).
 *
 * Fuente única de verdad de los datos analizados. Expone el estado de carga y la
 * acción `cargarDesdeArchivos`, que delega en la ingesta (DIP: recibe el catálogo
 * ya construido, no sabe de Excel). Los componentes solo leen de acá.
 */
import { create } from 'zustand';
import type { Catalogo } from '../model/tipos';
import { LectorPlanillaXlsx } from '@/features/ingesta-excel/services/LectorPlanillaXlsx';
import { procesarArchivos } from '@/features/ingesta-excel/services/procesarPlanilla';

export type EstadoCarga = 'vacio' | 'cargando' | 'listo' | 'error';

interface CatalogoState {
  catalogo: Catalogo | null;
  estado: EstadoCarga;
  error: string | null;
  nombreArchivo: string | null;
  /** Procesa uno o más archivos Excel (sus hojas se unen) y guarda el catálogo. */
  cargarDesdeArchivos: (archivos: readonly File[]) => Promise<void>;
  reiniciar: () => void;
}

const lector = new LectorPlanillaXlsx();

export const useCatalogoStore = create<CatalogoState>((set) => ({
  catalogo: null,
  estado: 'vacio',
  error: null,
  nombreArchivo: null,

  async cargarDesdeArchivos(archivos) {
    set({ estado: 'cargando', error: null });
    try {
      const entradas = await Promise.all(
        archivos.map(async (a) => ({ nombre: a.name, datos: await a.arrayBuffer() })),
      );
      const catalogo = await procesarArchivos(entradas, lector);
      const nombreArchivo = archivos.map((a) => a.name).join(' + ');
      set({ catalogo, estado: 'listo', nombreArchivo, error: null });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'No se pudo procesar el archivo.';
      set({ estado: 'error', error, catalogo: null });
      throw e;
    }
  },

  reiniciar() {
    set({ catalogo: null, estado: 'vacio', error: null, nombreArchivo: null });
  },
}));
