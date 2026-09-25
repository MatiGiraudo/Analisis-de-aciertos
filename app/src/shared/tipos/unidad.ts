/**
 * Unidad de medida de una tela/artículo.
 *
 * Regla de negocio central: **KGS y MTS nunca se suman entre sí**. Toda
 * agregación y todo puntaje se calcula por separado dentro de cada unidad.
 */
export type Unidad = 'KGS' | 'MTS';

/** Familia comercial asociada a cada unidad, para rótulos del hero. */
export const FAMILIA_POR_UNIDAD: Record<Unidad, { familia: string; sustantivo: string }> = {
  KGS: { familia: 'Punto', sustantivo: 'kilos' },
  MTS: { familia: 'Plano', sustantivo: 'metros' },
};

/** Sub-rubro del ERP. Cadena vacía cuando el artículo no lo trae. */
export type SubRubro = 'PUNTO' | 'PLANO' | '';
