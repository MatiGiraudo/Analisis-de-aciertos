/**
 * Resuelve las hojas clasificadas en `FuentesErp`: decide cuál foto de stock es
 * la inicial y cuál la actual, parsea todo y arma la ventana del análisis.
 *
 * Reglas (en orden):
 *  1. Los nombres mandan: "inicial"/"30-09" → inicial; "hoy"/"actual" → actual.
 *  2. Control de calidad: una foto "inicial" por artículo idéntica a la actual
 *     es un duplicado (el ERP ignoró la fecha) → se descarta con aviso.
 *  3. Las fotos con solo una fecha en el nombre ("Stock al 5-8") completan el
 *     lugar vacío: la más vieja como inicial, la más nueva como actual.
 * SRP: no agrega ni deriva indicadores (eso es `construirCatalogo`).
 */
import type { FotoStock, FuentesErp } from '../model/fuentes';
import type { FechaDiaMes, HojasClasificadas, HojaStock } from './clasificarHojas';
import { etiquetaHoja } from './clasificarHojas';
import { sonMismaFoto } from './controlesCalidad';
import { parsearCompras, parsearStockArticulo, parsearStockTela, parsearVentas } from './parsearErp';

export interface FuentesResueltas {
  readonly fuentes: FuentesErp;
  readonly ventana: { readonly desde: string; readonly hasta: string };
  readonly avisos: readonly string[];
}

/** Error de dominio cuando los archivos no alcanzan para el análisis. */
export class PlanillaInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'PlanillaInvalidaError';
  }
}

interface Candidata extends HojaStock {
  readonly foto: FotoStock;
}

export function resolverFuentes(hojas: HojasClasificadas, hoy: Date = new Date()): FuentesResueltas {
  const avisos = [...hojas.ignoradas.map((m) => `Hoja ignorada — ${m}.`)];

  const candidatas: Candidata[] = hojas.stocks.map((s) => ({ ...s, foto: parsearFoto(s) }));
  const iniciales = candidatas.filter((c) => c.rol === 'inicial');
  const actuales = candidatas.filter((c) => c.rol === 'actual');
  const indefinidas = candidatas.filter((c) => c.rol === 'indefinido').sort(porFecha);

  // 2. Una "inicial" idéntica a una "actual" no es una foto anterior.
  const inicialesValidas = iniciales.filter((ini) => {
    const duplicada = actuales.some(
      (act) =>
        ini.foto.nivel === 'articulo' &&
        act.foto.nivel === 'articulo' &&
        sonMismaFoto(ini.foto.filas, act.foto.filas),
    );
    if (duplicada) {
      avisos.push(
        `"${etiquetaHoja(ini.hoja)}" tiene las mismas cantidades que el stock actual (el ERP exportó el stock de hoy): se descartó como stock inicial.`,
      );
    }
    return !duplicada;
  });

  // 3. Las fotos solo fechadas completan los lugares vacíos.
  let inicial: Candidata | undefined = inicialesValidas[0];
  let actual: Candidata | undefined = actuales[0];
  const libres = [...indefinidas];
  if (!actual && libres.length > 0) actual = libres.pop();
  if (!inicial && libres.length > 0) inicial = libres.shift();

  const sobrantes = [...inicialesValidas.slice(1), ...actuales.slice(1), ...libres];
  for (const s of sobrantes) avisos.push(`Foto de stock no utilizada: "${etiquetaHoja(s.hoja)}".`);

  if (!actual) {
    throw new PlanillaInvalidaError('Falta una foto de stock actual (p. ej. "Stock a hoy" o "Stock al 5-8").');
  }
  if (hojas.ventas.length === 0) {
    throw new PlanillaInvalidaError('Falta al menos una hoja de ventas (OFI / INTER / PESOS / BLUE).');
  }
  if (!inicial) avisos.push('No hay foto de stock inicial: se reconstruye como hoy + ventas − compras.');
  if (hojas.compras.length === 0) {
    avisos.push('No hay export de compras: se derivan como hoy + ventas − inicial.');
  }

  const fuentes: FuentesErp = {
    stockInicial: inicial?.foto,
    stockActual: actual.foto,
    compras: hojas.compras.length > 0 ? hojas.compras.flatMap(parsearCompras) : undefined,
    ventas: hojas.ventas.map((v) => ({ moneda: v.moneda, filas: parsearVentas(v.hoja) })),
  };

  const ventana = {
    desde: inicial?.fecha ? formatear(inicial.fecha) : '—',
    hasta: actual.fecha
      ? formatear(actual.fecha)
      : actual.rol === 'actual'
        ? formatear({ dia: hoy.getDate(), mes: hoy.getMonth() + 1 })
        : '—',
  };

  return { fuentes, ventana, avisos };
}

function parsearFoto(s: HojaStock): FotoStock {
  return s.nivel === 'articulo'
    ? { nivel: 'articulo', filas: parsearStockArticulo(s.hoja) }
    : { nivel: 'tela', filas: parsearStockTela(s.hoja) };
}

/** Orden cronológico dentro del año (sin fecha → al principio). */
function porFecha(a: HojaStock, b: HojaStock): number {
  const v = (f?: FechaDiaMes) => (f ? f.mes * 100 + f.dia : 0);
  return v(a.fecha) - v(b.fecha);
}

function formatear(f: FechaDiaMes): string {
  return `${String(f.dia).padStart(2, '0')}-${String(f.mes).padStart(2, '0')}`;
}
