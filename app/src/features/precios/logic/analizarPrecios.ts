/**
 * Lógica pura de precios ponderados por moneda.
 *
 * Portada de `renderPrecios()` del HTML. Para la moneda elegida calcula, por
 * ítem: unidades facturadas (`pc`), neto (`pn`), participación de esas unidades
 * sobre el total del ítem, precio ponderado (`pn/pc`) y su peso en el neto total.
 */
import type { ArticuloAnalizado, TelaAnalizada } from '@/features/catalogo/model/tipos';
import type { Moneda } from '@/shared/tipos/moneda';
import { totalPorMoneda } from '@/shared/tipos/moneda';
import type { OrdenPrecios } from '@/features/catalogo/store/useFiltrosStore';
import type { Rotacion } from '@/features/catalogo/model/tipos';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';

type ItemPrecio = TelaAnalizada | ArticuloAnalizado;

export interface FilaPrecio {
  readonly clave: string;
  readonly titulo: string;
  readonly subtitulo: string;
  readonly unidad: Unidad;
  readonly codigo?: string;
  readonly unidades: number; // pc[moneda]
  readonly neto: number; // pn[moneda]
  readonly participacion: number; // pc[moneda] / (pc0+pc1+pc2)
  readonly precio: number; // pn / pc
}

export interface CriteriosPrecios {
  readonly moneda: Moneda;
  readonly q: string;
  readonly unidad: Unidad | '';
  readonly subRubro: SubRubro | '';
  readonly rotacion: Rotacion | '';
  readonly volumenMin: number;
  readonly orden: OrdenPrecios;
}

export interface ResultadoPrecios {
  readonly filas: FilaPrecio[];
  readonly netoTotalUniverso: number; // neto de todos los ítems con venta en la moneda
  readonly precioPonderadoGlobal: number | null;
  readonly netoAcumuladoFiltrado: number;
  readonly cantidad: number;
}

function participacion(item: ItemPrecio, m: Moneda): number {
  const total = totalPorMoneda(item.unidadesPorMoneda);
  return total > 0 ? item.unidadesPorMoneda[m] / total : 0;
}

export function analizarPrecios(items: readonly ItemPrecio[], c: CriteriosPrecios): ResultadoPrecios {
  const m = c.moneda;
  const universo = items.filter((a) => a.unidadesPorMoneda[m] > 0);

  const netoTotalUniverso = universo.reduce((s, a) => s + a.netoPorMoneda[m], 0);
  const unidadesUniverso = universo.reduce((s, a) => s + a.unidadesPorMoneda[m], 0);
  const precioPonderadoGlobal = unidadesUniverso > 0 ? netoTotalUniverso / unidadesUniverso : null;

  let r = universo;
  if (c.unidad) r = r.filter((a) => a.unidad === c.unidad);
  if (c.subRubro) r = r.filter((a) => a.subRubro === c.subRubro);
  if (c.rotacion) r = r.filter((a) => a.rotacion === c.rotacion);
  if (c.volumenMin) r = r.filter((a) => a.unidadesPorMoneda[m] >= c.volumenMin);
  const q = c.q.trim().toLowerCase();
  if (q) {
    r = r.filter((a) => {
      const texto =
        a.clase === 'articulo' ? `${a.codigo} ${a.descripcion} ${a.tela}` : `${a.nombre} ${a.subRubro}`;
      return texto.toLowerCase().includes(q);
    });
  }

  const filas: FilaPrecio[] = r.map((a) => {
    const unidades = a.unidadesPorMoneda[m];
    const neto = a.netoPorMoneda[m];
    return {
      clave: a.clase === 'articulo' ? a.codigo : a.nombre,
      titulo: a.clase === 'articulo' ? a.descripcion : a.nombre,
      subtitulo: a.clase === 'articulo' ? `${a.tela} · ${a.unidad}` : `${a.subRubro || '—'} · ${a.unidad}`,
      unidad: a.unidad,
      codigo: a.clase === 'articulo' ? a.codigo : undefined,
      unidades,
      neto,
      participacion: participacion(a, m),
      precio: unidades > 0 ? neto / unidades : 0,
    };
  });

  ordenar(filas, c.orden);

  return {
    filas,
    netoTotalUniverso,
    precioPonderadoGlobal,
    netoAcumuladoFiltrado: filas.reduce((s, f) => s + f.neto, 0),
    cantidad: filas.length,
  };
}

function ordenar(filas: FilaPrecio[], orden: OrdenPrecios): void {
  const cmp: Record<OrdenPrecios, (a: FilaPrecio, b: FilaPrecio) => number> = {
    name: (a, b) => a.titulo.localeCompare(b.titulo, 'es'),
    sh: (a, b) => b.participacion - a.participacion,
    pr: (a, b) => b.precio - a.precio,
    un: (a, b) => b.unidades - a.unidades,
    net: (a, b) => b.neto - a.neto,
  };
  filas.sort(cmp[orden] ?? cmp.un);
}
