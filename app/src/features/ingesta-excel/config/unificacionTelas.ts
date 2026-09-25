/**
 * Datos de negocio para unificar artículos en telas (editables).
 *
 * El ERP crea un "Grupo Artículo" por cada diseño ("BRODERY PLANO dsn 4",
 * "MODAL SOFT dsn 0093"…); para comprar se piensa por tela. Ver
 * `services/unificarTelas.ts` para las reglas.
 */

/**
 * Abreviaturas del ERP → nombre canónico de la tela. Se aplican al comienzo de
 * la descripción de artículos que no traen grupo.
 */
export const ALIAS_TELAS: Readonly<Record<string, string>> = {
  'SCUBA SUEDE C CORDERITO': 'SCUBA SUEDE CON CORDERITO',
};

/**
 * Fusiones de telas aprobadas por el comprador: tela resultante de la unificación
 * automática → tela final. Para familias que el ERP nombra distinto pero se
 * compran como una sola. La clave aplica al nombre exacto y a todo lo que empiece
 * con ella + espacio ("MORLEY EST" cubre "MORLEY EST ZIGGY"); gana la clave más larga.
 */
export const FUSIONES_TELAS: Readonly<Record<string, string>> = {
  // Aprobadas 25-09-2026:
  'POPLIN EST': 'POPLIN DSN', // estampados serie 23xx = diseños de poplin
  'MODAL SOFT EST': 'MODAL SOFT DSN', // incluye diseños con nombre (CAMUFLADO, COSMOS, KENYA…)
  'MORLEY EST': 'MORLEY DSN', // incluye diseños con nombre (ZIGGY, ZEBRA CRACK, NAMI…)
  'POLYSPOON EST DSN': 'POLYSPOON EST',
  CASMISACO: 'CAMISACO', // typo del ERP
  'SIMIL LINO SPANDEX ESTAMPADO': 'SIMIL LINO SPANDEX',
  'TIMBERLAND ESTAMPADO': 'TIMBERLAND',
};
