/**
 * Ensambla el `Catalogo` analizado a partir de las fuentes ya parseadas del ERP.
 *
 * Orquesta el pipeline de negocio (SRP: solo agrega y deriva, no lee archivos):
 *  1. une por código lo que haya por artículo: stock inicial/actual, ventas
 *     (por moneda) y compras;
 *  2. agrupa en telas unificando los grupos por diseño del ERP (`UnificadorTelas`);
 *  3. por artículo, usa el dato MEDIDO cuando existe y deriva el faltante por
 *     identidad contable `inicial + compras − ventas = hoy`:
 *       - stock hoy: real por artículo, o reparto del stock de la tela;
 *       - compras: real, o `max(0, hoy + ventas − inicial)`;
 *       - inicial: real, o `max(0, hoy + ventas − compras)`;
 *  4. la tela usa su foto por tela cuando la hay (dato exacto) y si no, la suma
 *     de sus artículos;
 *  5. calcula indicadores (derivar) y puntajes de ranking de artículos y de telas.
 *
 * Lo estimado queda marcado en `Articulo.camposEstimados`. Ver README de la feature.
 */
import { analizar } from '@/features/catalogo/logic/derivar';
import { calcularPuntajes } from '@/features/catalogo/logic/puntajes';
import type {
  Articulo,
  ArticuloAnalizado,
  CampoEstimado,
  Catalogo,
  Indicadores,
  Tela,
  TelaAnalizada,
} from '@/features/catalogo/model/tipos';
import { porMonedaVacio } from '@/shared/tipos/moneda';
import type { PorMoneda } from '@/shared/tipos/moneda';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';
import { normalizarNombreTela, SET_TELAS_DESTACADAS } from '../config/listaDestacada';
import { ALIAS_TELAS, FUSIONES_TELAS } from '../config/unificacionTelas';
import type { FotoStock, FuentesErp } from '../model/fuentes';
import { RepartoPorStockInicial } from './estrategiaReparto';
import type { EstrategiaReparto } from './estrategiaReparto';
import { UnificarPorDiseno } from './unificarTelas';
import type { TelasUnificadas, UnificadorTelas } from './unificarTelas';

export interface OpcionesCatalogo {
  readonly ventana?: { readonly desde: string; readonly hasta: string };
  readonly avisos?: readonly string[];
  readonly reparto?: EstrategiaReparto;
  readonly unificador?: UnificadorTelas;
}

/** Acumulador mutable interno mientras se construye cada artículo. */
interface AcumArticulo {
  codigo: string;
  descripcion: string;
  grupo: string;
  unidad: Unidad;
  subRubro: SubRubro;
  ventas: number;
  pc: PorMoneda;
  pn: PorMoneda;
  /** Cantidades medidas por artículo (undefined = no hay dato de ese código). */
  inicial?: number;
  hoy?: number;
  compras?: number;
}

/** Datos de una tela en una foto de stock por tela. */
interface StockTela {
  cantidad: number;
  unidad: Unidad;
  subRubro: SubRubro;
}

export function construirCatalogo(fuentes: FuentesErp, opciones: OpcionesCatalogo = {}): Catalogo {
  const reparto = opciones.reparto ?? new RepartoPorStockInicial();
  const unificador = opciones.unificador ?? new UnificarPorDiseno(SET_TELAS_DESTACADAS, ALIAS_TELAS, FUSIONES_TELAS);
  const ventana = opciones.ventana ?? { desde: '—', hasta: '—' };

  const avisos = [...(opciones.avisos ?? [])];
  const acumPorCodigo = unirArticulos(fuentes, avisos);
  const telasUnificadas = unificador.unificar([...acumPorCodigo.values()]);

  const inicialArticulo = fuentes.stockInicial?.nivel === 'articulo';
  const actualArticulo = fuentes.stockActual.nivel === 'articulo';
  const comprasReales = fuentes.compras !== undefined;
  const inicialPorTela = indexarStockTela(fuentes.stockInicial, telasUnificadas);
  const actualPorTela = indexarStockTela(fuentes.stockActual, telasUnificadas);

  const telasSinPuntaje: (Tela & Indicadores)[] = [];
  const articulos: (Articulo & Indicadores)[] = [];

  for (const [grupo, acums] of agruparPorTela(acumPorCodigo, telasUnificadas)) {
    const infoIni = inicialPorTela.get(grupo);
    const infoHoy = actualPorTela.get(grupo);

    // Stock hoy: medido por artículo, o reparto del stock de la tela.
    const hoyReparto = actualArticulo
      ? undefined
      : reparto.repartir(
          acums.map((a) => ({ stockInicial: a.inicial ?? 0, ventas: a.ventas })),
          infoHoy?.cantidad ?? 0,
        );
    const hoyEstimado = !actualArticulo && acums.length > 1; // con un solo color el reparto es exacto

    const arts = acums.map((a, i): Articulo => {
      const estimados: CampoEstimado[] = [];
      const stockHoy = hoyReparto ? hoyReparto[i] : (a.hoy ?? 0);
      if (hoyEstimado) estimados.push('stockHoy');

      let stockInicial: number;
      let compras: number;
      if (inicialArticulo) {
        stockInicial = a.inicial ?? 0;
        compras = comprasReales ? (a.compras ?? 0) : Math.max(0, stockHoy + a.ventas - stockInicial);
        if (!comprasReales && hoyEstimado) estimados.push('compras');
      } else {
        compras = a.compras ?? 0;
        stockInicial = Math.max(0, stockHoy + a.ventas - compras);
        estimados.push('stockInicial');
        if (!comprasReales) estimados.push('compras');
      }

      return {
        clase: 'articulo',
        codigo: a.codigo,
        descripcion: a.descripcion,
        tela: grupo,
        grupoErp: a.grupo,
        subRubro: a.subRubro || infoHoy?.subRubro || infoIni?.subRubro || '',
        unidad: a.unidad,
        enLista: SET_TELAS_DESTACADAS.has(normalizarNombreTela(grupo)),
        camposEstimados: estimados,
        stockInicial,
        compras,
        ventas: a.ventas,
        stockHoy,
        unidadesPorMoneda: a.pc,
        netoPorMoneda: a.pn,
      };
    });
    articulos.push(...arts.map(analizar));

    const tela: Tela = {
      clase: 'tela',
      nombre: grupo,
      subRubro: infoHoy?.subRubro || infoIni?.subRubro || acums[0]?.subRubro || '',
      unidad: infoHoy?.unidad ?? acums[0]?.unidad ?? 'MTS',
      colores: acums.length,
      enLista: SET_TELAS_DESTACADAS.has(normalizarNombreTela(grupo)),
      // La foto por tela es dato exacto; si la tela no figura, suma de artículos.
      stockInicial: infoIni?.cantidad ?? suma(arts, (a) => a.stockInicial),
      compras: suma(arts, (a) => a.compras),
      ventas: suma(arts, (a) => a.ventas),
      stockHoy: infoHoy?.cantidad ?? suma(arts, (a) => a.stockHoy),
      unidadesPorMoneda: sumaPorMoneda(acums, (a) => a.pc),
      netoPorMoneda: sumaPorMoneda(acums, (a) => a.pn),
    };
    telasSinPuntaje.push(analizar(tela));
  }

  const articulosAnalizados: ArticuloAnalizado[] = calcularPuntajes(articulos);
  const telas: TelaAnalizada[] = calcularPuntajes(telasSinPuntaje);

  ordenarPorNombre(telas);
  ordenarPorCodigo(articulosAnalizados);

  return {
    telas,
    lista: telas.filter((t) => t.enLista),
    articulos: articulosAnalizados,
    ventana,
    avisos,
  };
}

/* ------------------------------------------------------------------ */
/* Paso 1 — unir por código todo lo que venga por artículo             */
/* ------------------------------------------------------------------ */

function unirArticulos(fuentes: FuentesErp, avisos: string[]): Map<string, AcumArticulo> {
  const mapa = new Map<string, AcumArticulo>();

  const obtener = (codigo: string, unidad: Unidad): AcumArticulo => {
    let a = mapa.get(codigo);
    if (!a) {
      a = {
        codigo,
        descripcion: '',
        grupo: '',
        unidad,
        subRubro: '',
        ventas: 0,
        pc: porMonedaVacio(),
        pn: porMonedaVacio(),
      };
      mapa.set(codigo, a);
    }
    return a;
  };

  const completar = (a: AcumArticulo, f: { descripcion: string; grupo: string; subRubro: SubRubro }) => {
    if (!a.descripcion) a.descripcion = f.descripcion;
    if (!a.grupo) a.grupo = f.grupo;
    if (!a.subRubro) a.subRubro = f.subRubro;
  };

  // La foto actual primero: es la que mejor refleja el grupo vigente de cada código.
  if (fuentes.stockActual.nivel === 'articulo') {
    for (const f of fuentes.stockActual.filas) {
      const a = obtener(f.codigo, f.unidad);
      a.hoy = (a.hoy ?? 0) + f.cantidad;
      completar(a, f);
    }
  }
  if (fuentes.stockInicial?.nivel === 'articulo') {
    for (const f of fuentes.stockInicial.filas) {
      const a = obtener(f.codigo, f.unidad);
      a.inicial = (a.inicial ?? 0) + f.cantidad;
      completar(a, f);
    }
  }

  for (const { moneda, filas } of fuentes.ventas) {
    for (const f of filas) {
      const a = obtener(f.codigo, f.unidad);
      a.ventas += f.cantidad;
      a.pc[moneda] += f.cantidad;
      a.pn[moneda] += f.neto;
      completar(a, f);
    }
  }

  // Las compras no traen unidad ni grupo: solo se cruzan con códigos ya conocidos.
  const sinCruce: string[] = [];
  for (const f of fuentes.compras ?? []) {
    const a = mapa.get(f.codigo);
    if (!a) {
      sinCruce.push(f.codigo);
      continue;
    }
    a.compras = (a.compras ?? 0) + f.cantidad;
  }
  if (sinCruce.length > 0) {
    avisos.push(
      `${sinCruce.length} código(s) de compras no aparecen en stock ni ventas y se ignoraron: ${sinCruce.slice(0, 8).join(', ')}${sinCruce.length > 8 ? '…' : ''}.`,
    );
  }

  return mapa;
}

/* ------------------------------------------------------------------ */
/* Utilidades de agregación                                            */
/* ------------------------------------------------------------------ */

/** Indexa una foto por tela, sumando los grupos del ERP que caen en la misma tela. */
function indexarStockTela(foto: FotoStock | undefined, telas: TelasUnificadas): Map<string, StockTela> {
  const mapa = new Map<string, StockTela>();
  if (foto?.nivel !== 'tela') return mapa;
  for (const f of foto.filas) {
    const tela = telas.telaDeGrupo(f.grupo);
    const prev = mapa.get(tela);
    if (prev) prev.cantidad += f.cantidad;
    else mapa.set(tela, { cantidad: f.cantidad, unidad: f.unidad, subRubro: f.subRubro });
  }
  return mapa;
}

function agruparPorTela(arts: Map<string, AcumArticulo>, telas: TelasUnificadas): Map<string, AcumArticulo[]> {
  const mapa = new Map<string, AcumArticulo[]>();
  for (const a of arts.values()) {
    const clave = telas.porCodigo.get(a.codigo) ?? a.codigo;
    const arr = mapa.get(clave);
    if (arr) arr.push(a);
    else mapa.set(clave, [a]);
  }
  return mapa;
}

function suma<T>(items: readonly T[], f: (t: T) => number): number {
  return items.reduce((s, t) => s + f(t), 0);
}

function sumaPorMoneda<T>(items: readonly T[], f: (t: T) => PorMoneda): PorMoneda {
  const acc = porMonedaVacio();
  for (const t of items) f(t).forEach((v, i) => (acc[i] += v));
  return acc;
}

function ordenarPorNombre(telas: TelaAnalizada[]): void {
  telas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function ordenarPorCodigo(arts: ArticuloAnalizado[]): void {
  arts.sort((a, b) => a.codigo.localeCompare(b.codigo, 'es'));
}
