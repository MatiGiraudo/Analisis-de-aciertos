/**
 * Motor de recomendación de compra.
 *
 * Diseñado según OCP (Open/Closed): el motor `evaluarRecomendacion` es fijo y
 * recorre una lista ordenada de reglas (`REGLAS_RECOMENDACION`). Para cambiar el
 * criterio de negocio se agrega/edita una regla en la tabla, sin tocar el motor.
 *
 * Reglas portadas exactamente desde `recOf(st,cob,ven,hoy)` del HTML original.
 * La primera regla cuya condición se cumple gana; si ninguna aplica → `Revisar`.
 */
import { Recomendacion } from '../model/tipos';

/** Contexto que reciben las reglas: cantidades + indicadores ya calculados. */
export interface ContextoRecomendacion {
  readonly ventas: number;
  readonly stockHoy: number;
  readonly sellThrough: number;
  readonly cobertura: number;
}

/** Una regla: etiqueta legible, condición y resultado. */
export interface ReglaRecomendacion {
  readonly resultado: Recomendacion;
  readonly descripcion: string;
  readonly aplica: (c: ContextoRecomendacion) => boolean;
}

/**
 * Tabla de decisión, evaluada en orden. El orden importa: replica exactamente
 * el encadenamiento de `if` del HTML.
 */
export const REGLAS_RECOMENDACION: readonly ReglaRecomendacion[] = [
  {
    resultado: Recomendacion.Liquidar,
    descripcion: 'No se vendió nada pero todavía queda stock.',
    aplica: (c) => c.ventas <= 0 && c.stockHoy > 0,
  },
  {
    resultado: Recomendacion.Aumentar,
    descripcion: 'Se vendió muy bien y está por quedarse sin stock.',
    aplica: (c) => c.sellThrough >= 0.7 && c.cobertura <= 0.5,
  },
  {
    resultado: Recomendacion.Mantener,
    descripcion: 'Venta sana y cobertura razonable.',
    aplica: (c) => c.sellThrough >= 0.3 && c.cobertura <= 2,
  },
  {
    resultado: Recomendacion.Reducir,
    descripcion: 'Sobra cobertura o el sell-through es bajo.',
    aplica: (c) => c.cobertura > 2 || c.sellThrough < 0.3,
  },
];

/** Metadatos de presentación de cada recomendación (color/etiqueta). */
export const INFO_RECOMENDACION: Record<Recomendacion, { texto: string; hex: string; varColor: string }> = {
  [Recomendacion.Aumentar]: { texto: 'Aumentar compra', hex: '#1C6E4F', varColor: 'var(--color-rec-aumentar)' },
  [Recomendacion.Mantener]: { texto: 'Mantener', hex: '#2B5C8C', varColor: 'var(--color-rec-mantener)' },
  [Recomendacion.Reducir]: { texto: 'Reducir compra', hex: '#B36B12', varColor: 'var(--color-rec-reducir)' },
  [Recomendacion.Liquidar]: { texto: 'Liquidar', hex: '#9E2A2B', varColor: 'var(--color-rec-liquidar)' },
  [Recomendacion.Revisar]: { texto: 'Revisar', hex: '#6B6E68', varColor: 'var(--color-rec-revisar)' },
};

/**
 * Evalúa las reglas en orden y devuelve la primera que aplica.
 * @returns la recomendación; `Revisar` si ninguna regla se cumple (red de seguridad).
 */
export function evaluarRecomendacion(contexto: ContextoRecomendacion): Recomendacion {
  for (const regla of REGLAS_RECOMENDACION) {
    if (regla.aplica(contexto)) return regla.resultado;
  }
  return Recomendacion.Revisar;
}
