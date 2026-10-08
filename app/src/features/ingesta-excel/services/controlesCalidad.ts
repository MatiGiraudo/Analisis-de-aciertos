/**
 * Controles de calidad de los datos del ERP.
 *
 * Funciones puras que detectan problemas típicos de los exports y devuelven
 * avisos legibles para el usuario. Surgieron de errores reales:
 *  - la foto de "stock inicial" que en realidad es el stock de hoy (el ERP
 *    ignora la fecha pedida y exporta el stock actual): hay que descartarla;
 *  - telas donde no cierra `inicial + compras − ventas = hoy` (ajustes,
 *    devoluciones, ventas fuera de la ventana).
 */
import type { Metricas, TelaAnalizada } from '@/features/catalogo/model/tipos';
import type { Unidad } from '@/shared/tipos/unidad';
import type { FilaStockArticulo } from './parsearErp';

/** Tolerancia por código al comparar cantidades de dos fotos de stock. */
const TOLERANCIA_CANTIDAD = 0.01;
/** Fracción mínima de códigos comunes idénticos para declarar "misma foto". */
const UMBRAL_DUPLICADO = 0.98;
/** Diferencia (en la unidad del ítem) a partir de la cual se considera descuadre. */
export const TOLERANCIA_IDENTIDAD = 1;

/**
 * Descuadre de la identidad contable de un ítem (tela o artículo):
 * `hoy − (inicial + compras − ventas)`. Positivo = hay más stock del esperado
 * (entró algo que no figura como compra); negativo = falta stock (salió algo que
 * no figura como venta).
 */
export function diferenciaIdentidad(m: Pick<Metricas, 'stockInicial' | 'compras' | 'ventas' | 'stockHoy'>): number {
  return m.stockHoy - (m.stockInicial + m.compras - m.ventas);
}

/**
 * ¿Las dos fotos de stock por artículo son la misma? Compara los códigos
 * presentes en ambas: si (casi) todos tienen la misma cantidad, la "inicial"
 * no es una foto anterior sino un duplicado de la actual.
 */
export function sonMismaFoto(a: readonly FilaStockArticulo[], b: readonly FilaStockArticulo[]): boolean {
  const cantB = new Map<string, number>();
  for (const f of b) cantB.set(f.codigo, (cantB.get(f.codigo) ?? 0) + f.cantidad);

  const cantA = new Map<string, number>();
  for (const f of a) cantA.set(f.codigo, (cantA.get(f.codigo) ?? 0) + f.cantidad);

  let comunes = 0;
  let iguales = 0;
  for (const [codigo, qa] of cantA) {
    const qb = cantB.get(codigo);
    if (qb === undefined) continue;
    comunes++;
    if (Math.abs(qa - qb) <= TOLERANCIA_CANTIDAD) iguales++;
  }
  return comunes > 0 && iguales / comunes >= UMBRAL_DUPLICADO;
}

/** Resumen del control de identidad por unidad. */
export interface DescuadreUnidad {
  readonly unidad: Unidad;
  readonly telas: number;
  readonly telasConDescuadre: number;
  /** hoy − (inicial + compras − ventas), sumado sobre las telas. */
  readonly diferencia: number;
  readonly stockHoy: number;
}

/**
 * Control de identidad contable por tela: `inicial + compras − ventas = hoy`.
 * Solo tiene sentido cuando las cuatro cantidades son medidas (no derivadas).
 */
export function controlarIdentidad(telas: readonly TelaAnalizada[]): DescuadreUnidad[] {
  const porUnidad = new Map<Unidad, { telas: number; con: number; dif: number; hoy: number }>();
  for (const t of telas) {
    const acc = porUnidad.get(t.unidad) ?? { telas: 0, con: 0, dif: 0, hoy: 0 };
    const dif = diferenciaIdentidad(t);
    acc.telas++;
    acc.hoy += t.stockHoy;
    acc.dif += dif;
    if (Math.abs(dif) > TOLERANCIA_IDENTIDAD) acc.con++;
    porUnidad.set(t.unidad, acc);
  }
  return [...porUnidad].map(([unidad, a]) => ({
    unidad,
    telas: a.telas,
    telasConDescuadre: a.con,
    diferencia: a.dif,
    stockHoy: a.hoy,
  }));
}
