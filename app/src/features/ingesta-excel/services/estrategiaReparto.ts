/**
 * Estrategia de reparto del stock actual de una tela entre sus artículos.
 *
 * El ERP solo trae stock actual por tela; hay que estimar el de cada color.
 * Se modela como interfaz (OCP/DIP) para poder cambiar el criterio —o enchufar
 * un stock real por artículo si algún día existe— sin tocar `construirCatalogo`.
 *
 * Implementación por defecto (`RepartoPorStockInicial`): reparte proporcional al
 * stock inicial de cada artículo (verificado contra el dashboard v9). Si la tela
 * no tenía stock inicial, cae a proporción de ventas; si tampoco, reparto igual.
 */

/** Datos mínimos de un artículo que necesita el reparto. */
export interface ArticuloParaReparto {
  readonly stockInicial: number;
  readonly ventas: number;
}

export interface EstrategiaReparto {
  /**
   * @returns un stockHoy por artículo, en el mismo orden de entrada; la suma
   * es igual a `hoyTela` (salvo redondeo).
   */
  repartir(articulos: readonly ArticuloParaReparto[], hoyTela: number): number[];
}

export class RepartoPorStockInicial implements EstrategiaReparto {
  repartir(articulos: readonly ArticuloParaReparto[], hoyTela: number): number[] {
    const n = articulos.length;
    if (n === 0) return [];
    if (hoyTela <= 0) return new Array<number>(n).fill(0);

    const pesos = elegirPesos(articulos);
    const total = pesos.reduce((s, p) => s + p, 0);
    if (total <= 0) return new Array<number>(n).fill(hoyTela / n);

    return pesos.map((p) => (hoyTela * p) / total);
  }
}

/** Elige la mejor señal de peso disponible: stock inicial → ventas → uniforme. */
function elegirPesos(articulos: readonly ArticuloParaReparto[]): number[] {
  const sumaIni = articulos.reduce((s, a) => s + Math.max(0, a.stockInicial), 0);
  if (sumaIni > 0) return articulos.map((a) => Math.max(0, a.stockInicial));

  const sumaVen = articulos.reduce((s, a) => s + Math.max(0, a.ventas), 0);
  if (sumaVen > 0) return articulos.map((a) => Math.max(0, a.ventas));

  return articulos.map(() => 1);
}
