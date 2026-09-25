/**
 * Contratos de la lectura de planillas (capa de abstracción).
 *
 * Aplica DIP: la feature de ingesta depende de la interfaz `LectorPlanilla`,
 * no de SheetJS. La implementación concreta (`LectorPlanillaXlsx`) se puede
 * sustituir sin tocar el parser ni el dominio.
 */

/** Una celda cruda tal como viene del archivo (texto, número o vacío). */
export type Celda = string | number | null | undefined;

/** Una hoja: su nombre, el archivo del que vino y su matriz de filas. */
export interface HojaCruda {
  readonly nombre: string;
  /**
   * Nombre del archivo de origen (sin extensión). Se usa como pista cuando la
   * hoja tiene un nombre genérico ("Hoja2") y el dato está en el archivo
   * ("Stock al 5-8.xlsx").
   */
  readonly archivo?: string;
  readonly filas: readonly Celda[][];
}

/** Uno o más libros ya leídos a estructura neutra (sin dependencia de la lib). */
export interface PlanillaCruda {
  readonly hojas: readonly HojaCruda[];
}

/** Un archivo a procesar: nombre original + bytes. */
export interface ArchivoEntrada {
  readonly nombre: string;
  readonly datos: ArrayBuffer;
}

/**
 * Lector de planillas. Convierte bytes de un archivo en una `PlanillaCruda`.
 * Cualquier motor (SheetJS, CSV, etc.) puede implementar esta interfaz.
 */
export interface LectorPlanilla {
  leer(datos: ArrayBuffer): Promise<PlanillaCruda>;
}
