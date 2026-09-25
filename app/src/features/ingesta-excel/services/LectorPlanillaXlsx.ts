/**
 * Implementación de `LectorPlanilla` sobre SheetJS (xlsx).
 *
 * Única pieza del sistema que conoce SheetJS (SRP + DIP): si mañana se cambia de
 * librería, solo se reemplaza este archivo. Lee cada hoja como matriz de celdas
 * (`header: 1`) preservando posiciones vacías para que el parser pueda ubicar
 * columnas por índice.
 */
import * as XLSX from 'xlsx';
import type { Celda, HojaCruda, LectorPlanilla, PlanillaCruda } from '../model/planilla';

export class LectorPlanillaXlsx implements LectorPlanilla {
  async leer(datos: ArrayBuffer): Promise<PlanillaCruda> {
    const libro = XLSX.read(datos, { type: 'array' });

    const hojas: HojaCruda[] = libro.SheetNames.map((nombre) => {
      const hoja = libro.Sheets[nombre];
      return { nombre, filas: leerFilas(hoja) };
    });

    return { hojas };
  }
}

/**
 * Lee una hoja como matriz de celdas SIEMPRE desde la columna A.
 *
 * El ERP exporta algunas hojas con la columna A vacía (`!ref` arranca en B), y
 * SheetJS desplazaría los índices. Forzamos el rango a empezar en la columna 0
 * para que las posiciones de columna sean deterministas en todas las hojas.
 */
function leerFilas(hoja: XLSX.WorkSheet): Celda[][] {
  const ref = hoja['!ref'];
  let range: string | undefined;
  if (ref) {
    const decodificado = XLSX.utils.decode_range(ref);
    decodificado.s.c = 0; // columna inicial = A
    decodificado.s.r = 0; // fila inicial = 1
    range = XLSX.utils.encode_range(decodificado);
  }
  return XLSX.utils.sheet_to_json<Celda[]>(hoja, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
    range,
  });
}
