/**
 * Detalle de la salvedad "telas que no cierran inicial + compras − ventas = hoy"
 * (función pura): qué telas descuadran, en cuánto, y qué artículos lo explican.
 *
 * - La diferencia es la de `diferenciaIdentidad` (la misma que resume el aviso):
 *   positiva = sobra stock (entró algo que no figura como compra), negativa = falta
 *   stock (salió algo que no figura como venta).
 * - Por artículo se propone una causa probable con una tabla de reglas en orden
 *   (OCP: para afinar el diagnóstico se edita `CAUSAS`, no el algoritmo).
 * - `restoSinArticulo` es la parte de la diferencia de la tela que no se ve en
 *   ningún artículo (pasa cuando el stock de la tela viene de una foto por tela).
 */
import type { ArticuloAnalizado, TelaAnalizada } from '@/features/catalogo/model/tipos';
import { diferenciaIdentidad, TOLERANCIA_IDENTIDAD } from '@/features/ingesta-excel/services/controlesCalidad';

export type SentidoDescuadre = 'falta' | 'sobra';

export interface Causa {
  readonly clave: string;
  readonly texto: string;
  readonly aplica: (a: ArticuloAnalizado, diferencia: number) => boolean;
}

/** Reglas de diagnóstico por artículo, evaluadas en orden (gana la primera). */
export const CAUSAS: readonly Causa[] = [
  {
    clave: 'venta-sin-stock',
    texto: 'Vendió sin stock inicial ni compras: falta la compra en el export o cambió el código.',
    aplica: (a) => a.ventas > 0 && a.stockInicial + a.compras <= 0,
  },
  {
    clave: 'aparecio',
    texto: 'Apareció stock sin inicial ni compra: ingreso no registrado o transferencia desde otro código.',
    aplica: (a, d) => d > 0 && a.stockInicial <= 0 && a.compras <= 0,
  },
  {
    clave: 'devoluciones',
    texto: 'Ventas netas negativas: devoluciones de clientes.',
    aplica: (a) => a.ventas < 0,
  },
  {
    clave: 'sobra',
    texto: 'Entró stock que no figura como compra: ajuste positivo, devolución o compra fuera del período.',
    aplica: (_, d) => d > 0,
  },
  {
    clave: 'falta',
    texto: 'Salió stock que no figura como venta: ajuste negativo, merma, remito sin facturar o venta en otra hoja.',
    aplica: (_, d) => d < 0,
  },
];

export interface ArticuloDescuadrado {
  readonly articulo: ArticuloAnalizado;
  readonly esperado: number;
  readonly diferencia: number;
  readonly causa: Causa;
}

export interface TelaDescuadrada {
  readonly tela: TelaAnalizada;
  /** inicial + compras − ventas */
  readonly esperado: number;
  /** stockHoy − esperado */
  readonly diferencia: number;
  /** Artículos que no cierran, de mayor a menor |diferencia|. */
  readonly articulos: readonly ArticuloDescuadrado[];
  readonly restoSinArticulo: number;
}

export interface CriteriosDescuadre {
  readonly q: string;
  readonly sentido: SentidoDescuadre | '';
}

export function detallarDescuadres(
  telas: readonly TelaAnalizada[],
  articulos: readonly ArticuloAnalizado[],
  criterios: CriteriosDescuadre = { q: '', sentido: '' },
): TelaDescuadrada[] {
  const porTela = new Map<string, ArticuloAnalizado[]>();
  for (const a of articulos) {
    const arr = porTela.get(a.tela);
    if (arr) arr.push(a);
    else porTela.set(a.tela, [a]);
  }

  const q = criterios.q.trim().toLowerCase();
  const r: TelaDescuadrada[] = [];
  for (const tela of telas) {
    const diferencia = diferenciaIdentidad(tela);
    if (Math.abs(diferencia) <= TOLERANCIA_IDENTIDAD) continue;
    if (criterios.sentido === 'falta' && diferencia >= 0) continue;
    if (criterios.sentido === 'sobra' && diferencia <= 0) continue;

    const arts = porTela.get(tela.nombre) ?? [];
    const descuadrados = arts
      .map((a) => ({ a, d: diferenciaIdentidad(a) }))
      .filter(({ d }) => Math.abs(d) > TOLERANCIA_IDENTIDAD)
      .map(({ a, d }) => ({
        articulo: a,
        esperado: a.stockInicial + a.compras - a.ventas,
        diferencia: d,
        causa: CAUSAS.find((c) => c.aplica(a, d)) ?? CAUSAS[CAUSAS.length - 1],
      }))
      .sort((x, y) => Math.abs(y.diferencia) - Math.abs(x.diferencia));

    const coincide =
      !q ||
      tela.nombre.toLowerCase().includes(q) ||
      descuadrados.some((x) => `${x.articulo.codigo} ${x.articulo.descripcion}`.toLowerCase().includes(q));
    if (!coincide) continue;

    const sumaArticulos = arts.reduce((s, a) => s + diferenciaIdentidad(a), 0);
    r.push({
      tela,
      esperado: tela.stockInicial + tela.compras - tela.ventas,
      diferencia,
      articulos: descuadrados,
      restoSinArticulo: diferencia - sumaArticulos,
    });
  }
  return r.sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));
}
