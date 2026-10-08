/**
 * Planilla de exportación del detalle de descuadres (función pura): una fila por
 * tela con su total y, debajo, una por cada artículo que no cierra.
 */
import type { Celda, HojaSalida } from '@/features/ingesta-excel/model/planilla';
import type { TelaDescuadrada } from './detallarDescuadres';

const redondear = (v: number) => Math.round(v * 100) / 100;

export function hojaDescuadres(telas: readonly TelaDescuadrada[]): HojaSalida {
  const filas: Celda[][] = [
    ['TELA', 'UNIDAD', 'CODIGO', 'DESCRIPCION', 'INICIAL', 'COMPRAS', 'VENTAS', 'ESPERADO', 'STOCK HOY', 'DIFERENCIA', 'CAUSA PROBABLE'],
  ];
  for (const t of telas) {
    const m = t.tela;
    filas.push([
      m.nombre, m.unidad, '', '(total tela)',
      redondear(m.stockInicial), redondear(m.compras), redondear(m.ventas), redondear(t.esperado), redondear(m.stockHoy), redondear(t.diferencia), '',
    ]);
    for (const x of t.articulos) {
      const a = x.articulo;
      filas.push([
        m.nombre, a.unidad, a.codigo, a.descripcion,
        redondear(a.stockInicial), redondear(a.compras), redondear(a.ventas), redondear(x.esperado), redondear(a.stockHoy), redondear(x.diferencia), x.causa.texto,
      ]);
    }
  }
  return { nombre: 'Descuadres', filas };
}
