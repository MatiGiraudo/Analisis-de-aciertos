/**
 * "Lista de 49": subconjunto curado de telas bajo seguimiento del comprador.
 *
 * NO es derivable del Excel (es una decisión de negocio: solo ~31 de las 49 son
 * top por ventas). Se mantiene acá como configuración editable, sembrada con la
 * lista vigente del dashboard v9. Para cambiarla, editar este array.
 *
 * El nombre se compara normalizado (mayúsculas, sin espacios de más) contra el
 * `grupo` de cada tela para marcar `enLista`.
 */
export const TELAS_DESTACADAS: readonly string[] = [
  'ABERCROMBIE', 'BENGALINA LISA', 'CORDERITO BIFAZ', 'CORDEROY', 'COTTON ICE',
  'COTTON SATEN', 'CREP ZARA', 'DARLON DSN', 'DARLON EMBOSS', 'DARLON FOIL',
  'DARLON PATAGONIA', 'DARLON PUFF', 'ENCAJE', 'FLANEL LUMINOSO DSN', 'FRISA PREMIUM',
  'FRISA VISCOSA', 'JACQUARD WINNIE', 'LANILLA MELLOW', 'LANILLA SWEATER',
  'MICRO MORLEY ANGIE', 'MICROFIBRA CON LYCRA CHARO', 'MICROTUL', 'MICROTUL FLOCK',
  'MODAL SOFT', 'MODAL SOFT DSN', 'MORLEY BRUSH DSN', 'MORLEY DIESEL',
  'MORLEY DIESEL BRUSH', 'MORLEY DSN', 'MORLEY FRISADO', 'PANAL DE ABEJA',
  'PATAGONIA', 'PAÑO DE PUNTO', 'PAÑO LISO', 'PLUSH DOBLE', 'PUNTO ROMA',
  'RETRO FRISADO', 'RIB GIGI', 'RIB ONIX', 'SARA KEY PLUSH', 'SATEN DE PUNTO',
  'SCUBA SUEDE', 'SCUBA SUEDE CON CORDERITO', 'TERMOPOLAR', 'TERMOPOLAR MELANGE',
  'TERMOPOLAR RAYADO', 'TRENCH', 'WAFFLE LISO', 'WAFFLE PLUSH',
];

/** Normaliza un nombre de tela para comparar contra la lista destacada. */
export function normalizarNombreTela(nombre: string): string {
  return nombre.trim().toUpperCase().replace(/\s+/g, ' ');
}

/** Conjunto normalizado para lookups O(1). */
export const SET_TELAS_DESTACADAS: ReadonlySet<string> = new Set(
  TELAS_DESTACADAS.map(normalizarNombreTela),
);
