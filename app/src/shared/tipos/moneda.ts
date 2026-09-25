/**
 * Monedas de facturación.
 *
 * El ERP exporta las ventas en hojas paralelas (una por moneda). Cada ítem
 * guarda, por moneda, las unidades facturadas (`pc`) y el neto (`pn`), siempre
 * en el mismo orden que este enum y `MONEDAS`.
 */
export const enum Moneda {
  Oficial = 0,
  Intermedio = 1,
  Pesos = 2,
  Blue = 3,
}

/** Tupla indexada por `Moneda` (OFI, INTER, PESOS, BLUE). */
export type PorMoneda = [number, number, number, number];

/** Tupla en cero, para inicializar acumuladores. */
export function porMonedaVacio(): PorMoneda {
  return [0, 0, 0, 0];
}

/** Suma de las unidades/neto de todas las monedas. */
export function totalPorMoneda(v: Readonly<PorMoneda>): number {
  return v.reduce((s, x) => s + x, 0);
}

/** Metadatos de presentación de cada moneda. */
export interface InfoMoneda {
  readonly clave: Moneda;
  readonly etiqueta: string;
  readonly color: string;
  /** Decimales del precio ponderado (pesos no lleva decimales). */
  readonly decimales: number;
}

export const MONEDAS: readonly InfoMoneda[] = [
  { clave: Moneda.Oficial, etiqueta: 'US$ oficial', color: '#1c6e4f', decimales: 2 },
  { clave: Moneda.Intermedio, etiqueta: 'US$ intermedio', color: '#2b5c8c', decimales: 2 },
  { clave: Moneda.Pesos, etiqueta: '$ pesos', color: '#b36b12', decimales: 0 },
  { clave: Moneda.Blue, etiqueta: 'US$ blue', color: '#5b4a8a', decimales: 2 },
];
