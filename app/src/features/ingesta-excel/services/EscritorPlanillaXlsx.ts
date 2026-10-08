/**
 * Implementación de `EscritorPlanilla` sobre SheetJS (xlsx): arma el libro en el
 * navegador y dispara la descarga. Junto con `LectorPlanillaXlsx`, es la única
 * pieza que conoce SheetJS.
 */
import * as XLSX from 'xlsx';
import type { EscritorPlanilla, HojaSalida } from '../model/planilla';

export class EscritorPlanillaXlsx implements EscritorPlanilla {
  descargar(nombreArchivo: string, hojas: readonly HojaSalida[]): void {
    const libro = XLSX.utils.book_new();
    for (const h of hojas) {
      const hoja = XLSX.utils.aoa_to_sheet(h.filas.map((f) => [...f]));
      // Ancho de columna según el contenido más largo (tope 60).
      const anchos = (h.filas[0] ?? []).map((_, c) =>
        Math.min(60, Math.max(...h.filas.map((f) => String(f[c] ?? '').length)) + 2),
      );
      hoja['!cols'] = anchos.map((wch) => ({ wch }));
      XLSX.utils.book_append_sheet(libro, hoja, h.nombre.slice(0, 31));
    }
    XLSX.writeFile(libro, nombreArchivo);
  }
}
