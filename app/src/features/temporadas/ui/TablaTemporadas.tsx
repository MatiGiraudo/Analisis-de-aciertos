/**
 * Tabla de telas agrupadas por temporada, con la temporada editable en cada fila.
 *
 * Presentacional: recibe las filas ya filtradas, ordenadas (por temporada y luego
 * por el orden elegido) y paginadas. Inserta un encabezado cada vez que cambia la
 * temporada. Cada fila tiene casilla de selección (para asignar varias juntas), un
 * selector de temporada y, si fue corregida a mano, un botón para volver a la lista.
 *
 * Props:
 *  - `filas`: telas con su asignación de temporada.
 *  - `seleccion` / `onSeleccionar` / `onSeleccionarPagina`: selección múltiple.
 *  - `onCambiar(fila, temporada)` / `onRestaurar(fila)`: edición de una tela.
 */
import { Fragment } from 'react';
import { Undo2 } from 'lucide-react';
import { INFO_RECOMENDACION } from '@/features/catalogo/logic/recomendacion';
import { formatearCobertura, formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import { ETIQUETA_TEMPORADA, TEMPORADAS } from '@/shared/tipos/temporada';
import type { Temporada } from '@/shared/tipos/temporada';
import { Badge } from '@/shared/ui/Badge';
import type { FilaTemporada } from '../logic/filasTemporadas';
import type { AsignacionTemporada } from '../logic/resolverTemporadas';
import { EtiquetaTemporada } from './EtiquetaTemporada';

interface TablaTemporadasProps {
  readonly filas: readonly FilaTemporada[];
  readonly seleccion: ReadonlySet<string>;
  readonly onSeleccionar: (tela: string, marcada: boolean) => void;
  readonly onSeleccionarPagina: (marcar: boolean) => void;
  readonly onCambiar: (fila: FilaTemporada, temporada: Temporada) => void;
  readonly onRestaurar: (fila: FilaTemporada) => void;
}

const TH = 'sticky top-0 z-[2] border-b-[1.5px] border-ink bg-paper px-[9px] py-[11px] text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-2';
const TD = 'border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px] whitespace-nowrap';
const COLUMNAS = 8;

const ORIGEN: Record<AsignacionTemporada['origen'], string> = {
  manual: 'corregida a mano',
  lista: '',
  alias: 'por equivalencia',
  ninguno: '',
};

export function TablaTemporadas({
  filas,
  seleccion,
  onSeleccionar,
  onSeleccionarPagina,
  onCambiar,
  onRestaurar,
}: TablaTemporadasProps) {
  const todasMarcadas = filas.length > 0 && filas.every((f) => seleccion.has(f.tela.nombre));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse">
        <thead>
          <tr>
            <th className={`${TH} w-8 text-left`}>
              <input
                type="checkbox"
                aria-label="Seleccionar las telas de esta página"
                checked={todasMarcadas}
                onChange={(e) => onSeleccionarPagina(e.target.checked)}
              />
            </th>
            <th className={`${TH} text-left`}>Tela</th>
            <th className={`${TH} text-right`}>Ventas</th>
            <th className={`${TH} text-right`}>Stock hoy</th>
            <th className={`${TH} text-right`}>Sell-through</th>
            <th className={`${TH} text-right`}>Cobertura</th>
            <th className={`${TH} text-right`}>Recomendación</th>
            <th className={`${TH} text-left`}>Temporada</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const t = f.asignacion.temporada;
            const nuevaSeccion = i === 0 || filas[i - 1].asignacion.temporada !== t;
            const info = INFO_RECOMENDACION[f.tela.recomendacion];
            const nota = ORIGEN[f.asignacion.origen];
            const marcada = seleccion.has(f.tela.nombre);
            return (
              <Fragment key={f.tela.nombre}>
                {nuevaSeccion && (
                  <tr>
                    <td colSpan={COLUMNAS} className="border-b border-ink bg-cloth/60 px-[9px] pb-1.5 pt-3">
                      <EtiquetaTemporada temporada={t} />
                    </td>
                  </tr>
                )}
                <tr className={marcada ? 'bg-panel' : 'hover:bg-panel'}>
                  <td className="border-b border-rule-2 px-[9px] py-2">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${f.tela.nombre}`}
                      checked={marcada}
                      onChange={(e) => onSeleccionar(f.tela.nombre, e.target.checked)}
                    />
                  </td>
                  <td className="min-w-[220px] whitespace-normal border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
                    {f.tela.nombre}
                    {f.tela.enLista && <span className="ml-1 text-[11px] text-rec-mantener">★</span>}
                    <span className="block text-[11px] uppercase tracking-[0.04em] text-ink-3">
                      {f.tela.subRubro || '—'} · {f.tela.unidad}
                      {nota && (
                        <span className="normal-case tracking-normal" title={f.asignacion.nombreLista ? `En la lista: "${f.asignacion.nombreLista}"` : undefined}>
                          {' '}
                          · {nota}
                          {f.asignacion.origen === 'alias' && f.asignacion.nombreLista ? ` ("${f.asignacion.nombreLista}")` : ''}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={TD}>
                    {formatearEntero(f.tela.ventas)} <span className="text-[11px] text-ink-3">{f.tela.unidad}</span>
                  </td>
                  <td className={TD}>{formatearEntero(f.tela.stockHoy)}</td>
                  <td className={TD}>{formatearPorcentaje(f.tela.sellThrough)}</td>
                  <td className={TD}>{formatearCobertura(f.tela.cobertura)}</td>
                  <td className={TD}>
                    <Badge texto={info.texto} color={info.varColor} />
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-left">
                    <span className="flex items-center gap-1.5">
                      <select
                        aria-label={`Temporada de ${f.tela.nombre}`}
                        value={t ?? ''}
                        onChange={(e) => onCambiar(f, e.target.value as Temporada)}
                        className={`border bg-panel px-2 py-1 text-[12.5px] focus:outline-2 focus:outline-rec-mantener ${
                          f.asignacion.origen === 'manual' ? 'border-ink font-semibold' : 'border-rule'
                        } ${t ? 'text-ink' : 'text-ink-3'}`}
                      >
                        {!t && <option value="">— Elegir —</option>}
                        {TEMPORADAS.map((op) => (
                          <option key={op} value={op}>
                            {ETIQUETA_TEMPORADA[op]}
                          </option>
                        ))}
                      </select>
                      {f.asignacion.origen === 'manual' && (
                        <button
                          type="button"
                          onClick={() => onRestaurar(f)}
                          className="inline-flex items-center text-ink-3 hover:text-ink"
                          title={
                            f.asignacion.temporadaLista
                              ? `Volver a lo que dice la lista (${ETIQUETA_TEMPORADA[f.asignacion.temporadaLista]})`
                              : 'Quitar la corrección (la tela no figura en la lista)'
                          }
                          aria-label={`Deshacer la corrección de ${f.tela.nombre}`}
                        >
                          <Undo2 className="size-4" />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
