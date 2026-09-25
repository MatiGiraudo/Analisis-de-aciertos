/**
 * Fuente única de formato numérico (DRY).
 *
 * Toda la app usa estas funciones para números, porcentajes, cobertura y dinero,
 * de modo que el estilo (es-AR, coma decimal, miles) esté definido en un solo
 * lugar. Portadas de `nf`, `pf`, `cf`, `money` del HTML original.
 */

/** Entero con separador de miles es-AR. Ej: 12.345 */
const nfInt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** Formatea una cantidad como entero es-AR. */
export const formatearEntero = (v: number): string => nfInt.format(v);

/** Porcentaje con un decimal y coma. Ej: 0.4397 → "44,0%" */
export const formatearPorcentaje = (v: number): string =>
  (v * 100).toFixed(1).replace('.', ',') + '%';

/**
 * Cobertura (temporadas). Tope visual "+99" para valores muy grandes.
 * Ej: 1.2743 → "1,3" ; 999 → "+99"
 */
export const formatearCobertura = (v: number): string =>
  v >= 99 ? '+99' : v.toFixed(1).replace('.', ',');

/** Monto con `decimales` fijos, formato es-AR. */
export const formatearDinero = (v: number, decimales: number): string =>
  v.toLocaleString('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
