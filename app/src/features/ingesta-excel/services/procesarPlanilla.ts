/**
 * Fachada de la ingesta: de uno o más archivos Excel a `Catalogo` analizado.
 *
 * Orquesta las piezas (lectura → clasificación → resolución de fuentes →
 * construcción → controles). Se pueden cargar varios archivos juntos (p. ej. el
 * libro del período + la foto "Stock al 5-8.xlsx"): sus hojas se unen y cada una
 * recuerda su archivo de origen. Recibe el `LectorPlanilla` por inyección (DIP).
 */
import type { Catalogo } from '@/features/catalogo/model/tipos';
import { formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import type { ArchivoEntrada, HojaCruda, LectorPlanilla } from '../model/planilla';
import { clasificarHojas } from './clasificarHojas';
import { construirCatalogo } from './construirCatalogo';
import type { OpcionesCatalogo } from './construirCatalogo';
import { controlarIdentidad } from './controlesCalidad';
import { resolverFuentes } from './resolverFuentes';

export { PlanillaInvalidaError } from './resolverFuentes';

export interface OpcionesProceso extends Pick<OpcionesCatalogo, 'reparto'> {
  /** Fecha de "hoy" para rotular la ventana (inyectable para tests). */
  readonly hoy?: Date;
}

export async function procesarArchivos(
  archivos: readonly ArchivoEntrada[],
  lector: LectorPlanilla,
  opciones: OpcionesProceso = {},
): Promise<Catalogo> {
  const hojas: HojaCruda[] = [];
  for (const archivo of archivos) {
    const planilla = await lector.leer(archivo.datos);
    const nombreArchivo = archivo.nombre.replace(/\.[^.]+$/, '');
    hojas.push(...planilla.hojas.map((h) => ({ ...h, archivo: nombreArchivo })));
  }

  const { fuentes, ventana, avisos } = resolverFuentes(clasificarHojas({ hojas }), opciones.hoy);
  const catalogo = construirCatalogo(fuentes, { ventana, avisos, reparto: opciones.reparto });

  // Control de identidad: solo informa cuando inicial, compras y hoy son medidos.
  if (fuentes.stockInicial && fuentes.compras) {
    const extra = controlarIdentidad(catalogo.telas)
      .filter((d) => d.telasConDescuadre > 0)
      .map(
        (d) =>
          `${d.unidad}: ${d.telasConDescuadre} de ${d.telas} telas no cierran inicial + compras − ventas = hoy ` +
          `(diferencia neta ${formatearEntero(d.diferencia)} ${d.unidad}, ${formatearPorcentaje(Math.abs(d.diferencia) / (d.stockHoy || 1))} del stock). ` +
          'Suelen ser ajustes, devoluciones o artículos sin tela asignada.',
      );
    return { ...catalogo, avisos: [...catalogo.avisos, ...extra] };
  }
  return catalogo;
}

/** Atajo para un único archivo. */
export function procesarPlanilla(
  datos: ArrayBuffer,
  lector: LectorPlanilla,
  opciones?: OpcionesProceso,
): Promise<Catalogo> {
  return procesarArchivos([{ nombre: 'planilla.xlsx', datos }], lector, opciones);
}
