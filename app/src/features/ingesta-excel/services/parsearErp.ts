/**
 * Parser de las exportaciones crudas del ERP a filas de dominio limpias.
 *
 * Responsabilidad única (SRP): tomar UNA hoja cruda, reconocer qué tipo de
 * export es y devolver filas tipadas. Resuelve las particularidades del ERP:
 *  - ubica las columnas por su ENCABEZADO (no por posición): el mismo reporte
 *    sale a veces desde la columna A y a veces desde la B, y el encabezado puede
 *    ocupar una o dos filas ("Articulo / Código", "Total Cantidad" arriba);
 *  - descarta encabezados y subtotales ("Total General", "Secciones"…);
 *  - arrastra Rubro y Sub Rubro desde las filas de agrupación hacia el detalle,
 *    y se queda solo con el rubro analizado (TELAS) cuando la hoja lo trae;
 *  - corrige el factor ×1000 del export legado "Stock al 3009";
 *  - valida la unidad (KGS/MTS) y descarta códigos basura ("COMPRA / Concepto",
 *    "NO", "USARRR"…: filas cuya descripción es "Concepto" o repite el código).
 *
 * No decide qué rol cumple cada hoja (eso es `clasificarHojas`) ni agrega ni
 * deriva indicadores (eso es `construirCatalogo`).
 */
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';
import type { Celda, HojaCruda } from '../model/planilla';

/** Tipos de export del ERP que la ingesta sabe leer. */
export type TipoHoja = 'ventas' | 'compras' | 'stock-articulo' | 'stock-tela';

/** Fila de stock por artículo (foto de stock de un código). */
export interface FilaStockArticulo {
  readonly codigo: string;
  readonly descripcion: string;
  readonly grupo: string;
  readonly unidad: Unidad;
  readonly subRubro: SubRubro;
  readonly cantidad: number;
}

/** Fila de stock por tela (el ERP agrupa por "Grupo Artículo"). */
export interface FilaStockTela {
  readonly grupo: string;
  readonly unidad: Unidad;
  readonly subRubro: SubRubro;
  readonly cantidad: number;
}

/** Fila de venta de detalle (una por artículo, en una moneda). */
export interface FilaVenta {
  readonly codigo: string;
  readonly descripcion: string;
  readonly grupo: string;
  readonly unidad: Unidad;
  readonly subRubro: SubRubro;
  readonly cantidad: number;
  readonly neto: number;
}

/**
 * Fila de compra por artículo. El export de compras NO trae unidad ni grupo:
 * se completan cruzando por código con stock/ventas.
 */
export interface FilaCompra {
  readonly codigo: string;
  readonly descripcion: string;
  readonly subRubro: SubRubro;
  readonly cantidad: number;
}

/** Rubro que analiza la app; el resto (hilados, ropa, bazar…) se descarta. */
export const RUBRO_ANALIZADO = 'TELAS';

const UNIDADES_VALIDAS: readonly string[] = ['KGS', 'MTS'];
const SUBRUBROS_VALIDOS: readonly string[] = ['PUNTO', 'PLANO'];

/** El export legado "Stock al 3009" venía con las cantidades multiplicadas ×1000. */
const FACTOR_STOCK_LEGADO = 1000;
const PATRON_STOCK_LEGADO = /30\s*[-/]?\s*09|3009/;

/** Cuántas filas del comienzo se revisan buscando el encabezado. */
const FILAS_BUSQUEDA_ENCABEZADO = 15;

/* ------------------------------------------------------------------ */
/* Encabezados                                                         */
/* ------------------------------------------------------------------ */

/** Etiquetas normalizadas (minúsculas, sin acentos) de cada columna conocida. */
const ETIQUETAS = {
  rubro: ['rubro'],
  subRubro: ['sub rubro'],
  codigo: ['codigo de articulo', 'clave articulo', 'codigo'],
  descripcion: ['descripcion de articulo', 'nombre articulo', 'descripcion'],
  grupo: ['grupo articulo'],
  unidad: ['nombre unidad'],
  cantidad: ['cant.', 'total cantidad'],
  neto: ['importe total neto'],
} as const;

type Columna = keyof typeof ETIQUETAS;

/** Resultado de ubicar el encabezado: dónde empiezan los datos y qué columna es cada campo. */
interface Encabezado {
  readonly tipo: TipoHoja;
  readonly primeraFilaDatos: number;
  readonly col: Partial<Record<Columna, number>>;
}

/**
 * Reconoce el tipo de export por su encabezado. Devuelve `undefined` si la hoja
 * no es ninguno de los exports conocidos (se ignora).
 */
export function detectarTipoHoja(hoja: HojaCruda): TipoHoja | undefined {
  return ubicarEncabezado(hoja)?.tipo;
}

function ubicarEncabezado(hoja: HojaCruda): Encabezado | undefined {
  const limite = Math.min(hoja.filas.length, FILAS_BUSQUEDA_ENCABEZADO);
  for (let i = 0; i < limite; i++) {
    // El encabezado puede venir partido en dos filas: se combina con la anterior.
    const etiquetas = combinarEncabezado(hoja.filas[i - 1], hoja.filas[i]);
    const tiene = (e: string) => etiquetas.includes(e);

    let tipo: TipoHoja | undefined;
    if (tiene('codigo de articulo') && tiene('cant.') && tiene('nombre unidad')) tipo = 'ventas';
    else if (tiene('clave articulo') && tiene('cant.')) tipo = 'compras';
    else if (tiene('codigo') && tiene('nombre unidad') && tiene('total cantidad')) tipo = 'stock-articulo';
    else if (tiene('descripcion') && tiene('nombre unidad') && tiene('total cantidad')) tipo = 'stock-tela';
    if (!tipo) continue;

    const col: Partial<Record<Columna, number>> = {};
    for (const campo of Object.keys(ETIQUETAS) as Columna[]) {
      const idx = ETIQUETAS[campo].map((e) => etiquetas.indexOf(e)).find((j) => j >= 0);
      if (idx !== undefined) col[campo] = idx;
    }
    return { tipo, primeraFilaDatos: i + 1, col };
  }
  return undefined;
}

function combinarEncabezado(arriba: readonly Celda[] | undefined, fila: readonly Celda[]): string[] {
  const largo = Math.max(arriba?.length ?? 0, fila.length);
  return Array.from({ length: largo }, (_, j) => normalizar(fila[j]) || normalizar(arriba?.[j]));
}

/* ------------------------------------------------------------------ */
/* Recorrido de filas de detalle                                       */
/* ------------------------------------------------------------------ */

/** Una fila de detalle con Rubro/Sub Rubro ya arrastrados. */
interface FilaDetalle {
  readonly celdas: readonly Celda[];
  readonly subRubro: SubRubro;
}

/**
 * Recorre las filas de datos arrastrando Rubro y Sub Rubro de las filas de
 * agrupación y filtra al rubro analizado (si la hoja tiene columna Rubro).
 */
function* filasDetalle(hoja: HojaCruda, enc: Encabezado): Generator<FilaDetalle> {
  const { col } = enc;
  let rubro = '';
  let subRubro: SubRubro = '';
  for (let i = enc.primeraFilaDatos; i < hoja.filas.length; i++) {
    const f = hoja.filas[i];
    if (col.rubro !== undefined) {
      const r = texto(f[col.rubro]).toUpperCase();
      if (r) rubro = r;
    }
    if (col.subRubro !== undefined) {
      const s = subRubroValido(f[col.subRubro]);
      if (s) subRubro = s;
    }
    if (col.rubro !== undefined && rubro !== RUBRO_ANALIZADO) continue;
    yield { celdas: f, subRubro };
  }
}

function exigirTipo(hoja: HojaCruda, tipo: TipoHoja): Encabezado {
  const enc = ubicarEncabezado(hoja);
  if (!enc || enc.tipo !== tipo) {
    throw new Error(`La hoja "${hoja.nombre}" no tiene el formato de ${tipo}.`);
  }
  return enc;
}

/* ------------------------------------------------------------------ */
/* Parsers por tipo                                                    */
/* ------------------------------------------------------------------ */

/** Parsea una foto de stock por artículo (corrige el ×1000 del export legado). */
export function parsearStockArticulo(hoja: HojaCruda): FilaStockArticulo[] {
  const enc = exigirTipo(hoja, 'stock-articulo');
  const factor = PATRON_STOCK_LEGADO.test(hoja.nombre.toLowerCase()) ? FACTOR_STOCK_LEGADO : 1;
  const { col } = enc;
  const filas: FilaStockArticulo[] = [];
  for (const { celdas: f, subRubro } of filasDetalle(hoja, enc)) {
    const codigo = texto(f[col.codigo!]);
    const unidad = unidadValida(f[col.unidad!]);
    if (!codigo || !unidad || esCodigoBasura(codigo, texto(f[col.descripcion!]))) continue;
    filas.push({
      codigo,
      descripcion: texto(f[col.descripcion!]),
      grupo: col.grupo === undefined ? '' : texto(f[col.grupo]),
      unidad,
      subRubro,
      cantidad: numero(f[col.cantidad!]) / factor,
    });
  }
  return filas;
}

/** Parsea una foto de stock por tela (grupo). */
export function parsearStockTela(hoja: HojaCruda): FilaStockTela[] {
  const enc = exigirTipo(hoja, 'stock-tela');
  const { col } = enc;
  const filas: FilaStockTela[] = [];
  for (const { celdas: f, subRubro } of filasDetalle(hoja, enc)) {
    const grupo = texto(f[col.descripcion!]);
    const unidad = unidadValida(f[col.unidad!]);
    if (!grupo || !unidad) continue; // "Total General", "Secciones", encabezados…
    filas.push({ grupo, unidad, subRubro, cantidad: numero(f[col.cantidad!]) });
  }
  return filas;
}

/** Parsea una hoja de ventas (una moneda). */
export function parsearVentas(hoja: HojaCruda): FilaVenta[] {
  const enc = exigirTipo(hoja, 'ventas');
  const { col } = enc;
  const filas: FilaVenta[] = [];
  for (const { celdas: f, subRubro } of filasDetalle(hoja, enc)) {
    const codigo = texto(f[col.codigo!]);
    const unidad = unidadValida(f[col.unidad!]);
    if (!codigo || !unidad) continue; // subtotales y encabezados no tienen código+unidad
    if (esCodigoBasura(codigo, texto(f[col.descripcion!]))) continue;
    filas.push({
      codigo,
      descripcion: texto(f[col.descripcion!]),
      grupo: col.grupo === undefined ? '' : texto(f[col.grupo]),
      unidad,
      subRubro,
      cantidad: numero(f[col.cantidad!]),
      neto: col.neto === undefined ? 0 : numero(f[col.neto]),
    });
  }
  return filas;
}

/** Parsea el export de compras por artículo. */
export function parsearCompras(hoja: HojaCruda): FilaCompra[] {
  const enc = exigirTipo(hoja, 'compras');
  const { col } = enc;
  const filas: FilaCompra[] = [];
  for (const { celdas: f, subRubro } of filasDetalle(hoja, enc)) {
    const codigo = texto(f[col.codigo!]);
    if (!codigo || esCodigoBasura(codigo, texto(f[col.descripcion!]))) continue; // subtotales: código vacío
    filas.push({
      codigo,
      descripcion: texto(f[col.descripcion!]),
      subRubro,
      cantidad: numero(f[col.cantidad!]),
    });
  }
  return filas;
}

/**
 * Códigos que no son artículos reales: conceptos contables ("COMPRA / Concepto")
 * y altas de prueba cuya descripción repite el código ("NO", "USARRRR").
 */
export function esCodigoBasura(codigo: string, descripcion: string): boolean {
  const c = codigo.trim().toUpperCase();
  const d = descripcion.trim().toUpperCase();
  return c === 'COMPRA' || d === 'CONCEPTO' || d === c;
}

/* ------------------------------------------------------------------ */
/* Utilidades de celda                                                 */
/* ------------------------------------------------------------------ */

/** Minúsculas, sin acentos y con espacios simples (para comparar encabezados). */
export function normalizar(c: Celda): string {
  return texto(c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function texto(c: Celda): string {
  return c == null ? '' : String(c).trim();
}

function numero(c: Celda): number {
  if (typeof c === 'number') return c;
  if (c == null) return 0;
  const s = String(c).trim();
  // Si trae coma decimal (formato es-AR), quitar miles y normalizar la coma.
  // Si no, es un número con punto decimal estándar.
  const normalizado = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

function unidadValida(c: Celda): Unidad | undefined {
  const t = texto(c).toUpperCase();
  return UNIDADES_VALIDAS.includes(t) ? (t as Unidad) : undefined;
}

function subRubroValido(c: Celda): SubRubro | undefined {
  const t = texto(c).toUpperCase();
  return SUBRUBROS_VALIDOS.includes(t) ? (t as SubRubro) : undefined;
}
