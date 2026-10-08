/**
 * Entrada y salida de la lista de temporadas en Excel.
 *
 * - `leerListaTemporadas`: busca, en cualquier hoja, un encabezado con una
 *   columna de tela (ARTICULO / TELA / NOMBRE) y otra de temporada
 *   (TEMP / TEMPORADA) y devuelve las filas reconocidas. Es el formato de
 *   `TEMPORADAS DE ARTICULOS.xlsx` y el mismo que genera la exportación.
 * - `filasExportacion`: arma la planilla con la temporada vigente de cada tela
 *   (incluye correcciones manuales) más las entradas de la lista sin tela en el
 *   ERP, para que al volver a cargarla no se pierda nada.
 *
 * Depende de `LectorPlanilla` (DIP), no de SheetJS.
 */
import { normalizar } from '@/features/ingesta-excel/services/parsearErp';
import type { Celda, HojaSalida, LectorPlanilla } from '@/features/ingesta-excel/model/planilla';
import { parsearTemporada } from '@/shared/tipos/temporada';
import type { Unidad } from '@/shared/tipos/unidad';
import type { EntradaTemporada } from '../config/temporadasBase';
import type { AsignacionTemporada, ResolucionTemporadas } from '../logic/resolverTemporadas';

const ENCABEZADO_TELA = /^(articulo|tela|nombre|descripcion)$/;
const ENCABEZADO_TEMPORADA = /^temp(orada)?$/;
/** Filas del principio de cada hoja donde se busca el encabezado. */
const FILAS_BUSQUEDA = 10;

export interface ListaLeida {
  readonly entradas: readonly EntradaTemporada[];
  /** Filas con tela pero temporada no reconocida (para avisar). */
  readonly descartadas: readonly string[];
}

export class ListaTemporadasInvalidaError extends Error {
  constructor() {
    super('No se encontró una hoja con columnas ARTICULO (o TELA) y TEMP (o TEMPORADA).');
    this.name = 'ListaTemporadasInvalidaError';
  }
}

export async function leerListaTemporadas(datos: ArrayBuffer, lector: LectorPlanilla): Promise<ListaLeida> {
  const { hojas } = await lector.leer(datos);
  for (const hoja of hojas) {
    const r = leerFilas(hoja.filas);
    if (r) return r;
  }
  throw new ListaTemporadasInvalidaError();
}

/** Lee una matriz de celdas; `undefined` si no tiene el encabezado esperado. */
export function leerFilas(filas: readonly Celda[][]): ListaLeida | undefined {
  for (let i = 0; i < Math.min(FILAS_BUSQUEDA, filas.length); i++) {
    const enc = filas[i].map(normalizar).map((s) => s.trim());
    const cTela = enc.findIndex((s) => ENCABEZADO_TELA.test(s));
    const cTemp = enc.findIndex((s) => ENCABEZADO_TEMPORADA.test(s));
    if (cTela < 0 || cTemp < 0) continue;

    const entradas: EntradaTemporada[] = [];
    const descartadas: string[] = [];
    const vistos = new Set<string>();
    for (const fila of filas.slice(i + 1)) {
      const nombre = String(fila[cTela] ?? '').trim().replace(/\s+/g, ' ');
      if (!nombre) continue;
      const temporada = parsearTemporada(fila[cTemp]);
      if (!temporada) {
        descartadas.push(nombre);
        continue;
      }
      const clave = nombre.toUpperCase();
      if (vistos.has(clave)) continue; // gana la primera aparición
      vistos.add(clave);
      entradas.push({ nombre, temporada });
    }
    return { entradas, descartadas };
  }
  return undefined;
}

const ETIQUETA_ORIGEN: Record<AsignacionTemporada['origen'], string> = {
  manual: 'Corregida a mano',
  lista: 'Lista',
  alias: 'Lista (equivalencia)',
  ninguno: 'Sin asignar',
};

/** Planilla de exportación: una fila por tela del catálogo + las entradas sin cruce. */
export function filasExportacion(
  telas: readonly { readonly nombre: string; readonly unidad: Unidad }[],
  resolucion: ResolucionTemporadas,
): HojaSalida {
  const filas: Celda[][] = [['ARTICULO', 'TEMP', 'UNIDAD', 'ORIGEN', 'NOMBRE EN LISTA']];
  const ordenadas = [...telas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  for (const t of ordenadas) {
    const a = resolucion.porTela.get(t.nombre);
    filas.push([t.nombre, a?.temporada ?? '', t.unidad, ETIQUETA_ORIGEN[a?.origen ?? 'ninguno'], a?.nombreLista ?? '']);
  }
  for (const e of resolucion.sinCruce) {
    filas.push([e.nombre, e.temporada, '', 'Lista (sin tela en el ERP)', e.nombre]);
  }
  return { nombre: 'LISTA', filas };
}
