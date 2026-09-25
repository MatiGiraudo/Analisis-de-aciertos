/**
 * Tabla de colores de tendencia, con acordeón de sus artículos (color × tela).
 *
 * Props:
 *  - `filas`: colores ya agregados, filtrados y ordenados (`agruparPorColor`).
 *  - `estaAbierta` / `onAlternar`: estado del acordeón (lo maneja la página).
 * Presentacional: no calcula indicadores.
 */
import { Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ArticuloAnalizado } from '@/features/catalogo/model/tipos';
import { INFO_RECOMENDACION } from '@/features/catalogo/logic/recomendacion';
import { BarraSellThrough } from '@/shared/ui/BarraSellThrough';
import { formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import type { ColorTendencia } from '../logic/agruparPorColor';
import { IndiceTendencia } from './IndiceTendencia';

const COLUMNAS = ['Color', 'Ventas', '% de las ventas', 'Stock hoy', '% del stock', 'Índice', 'Sell-through'];

interface TablaColoresProps {
  readonly filas: readonly ColorTendencia[];
  readonly estaAbierta: (c: ColorTendencia) => boolean;
  readonly onAlternar: (c: ColorTendencia) => void;
}

const TD = 'px-[9px] py-2 border-b border-rule-2 text-right tabular text-[13px] whitespace-nowrap';

export function TablaColores({ filas, estaAbierta, onAlternar }: TablaColoresProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse">
        <thead>
          <tr>
            {COLUMNAS.map((c, i) => (
              <th
                key={c}
                className={`sticky top-0 z-[2] border-b-[1.5px] border-ink bg-paper px-[9px] py-[11px] text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-2 ${
                  i === 0 ? 'text-left' : 'text-right'
                }`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((c) => {
            const abierta = estaAbierta(c);
            const clave = `${c.color}|${c.unidad}`;
            return (
              <Fragment key={clave}>
                <tr
                  className="cursor-pointer hover:bg-panel"
                  onClick={() => onAlternar(c)}
                  tabIndex={0}
                  aria-expanded={abierta}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onAlternar(c);
                    }
                  }}
                >
                  <td className="min-w-[220px] border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
                    <span className="flex items-start gap-1.5">
                      <ChevronDown
                        aria-hidden
                        className={`mt-[2px] size-4 flex-none text-ink-3 transition-transform ${abierta ? 'rotate-180' : ''}`}
                      />
                      <span>
                        {c.color}
                        <span className="block text-[11px] uppercase tracking-[0.04em] text-ink-3">
                          {c.unidad} · {c.telas} {c.telas === 1 ? 'tela' : 'telas'} · {c.articulos.length} art.
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className={TD}>
                    {formatearEntero(c.ventas)} <span className="text-[11px] text-ink-3">{c.unidad}</span>
                  </td>
                  <td className={TD}>
                    <Participacion valor={c.participacionVentas} />
                  </td>
                  <td className={TD}>{formatearEntero(c.stockHoy)}</td>
                  <td className={TD}>{formatearPorcentaje(c.participacionStock)}</td>
                  <td className={TD}>
                    <IndiceTendencia indice={c.indice} />
                  </td>
                  <td className={TD}>{formatearPorcentaje(c.sellThrough)}</td>
                </tr>
                {abierta && c.articulos.map((a) => <FilaArticulo key={a.codigo} articulo={a} />)}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Participación con una barra fina proporcional (máx. visual 25%). */
function Participacion({ valor }: { readonly valor: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="block h-[6px] w-[60px] overflow-hidden border border-ink bg-cloth">
        <i className="block h-full bg-ink" style={{ width: `${Math.min(100, (valor / 0.25) * 100)}%` }} />
      </span>
      <span className="min-w-[46px] text-right">{formatearPorcentaje(valor)}</span>
    </span>
  );
}

function FilaArticulo({ articulo: a }: { readonly articulo: ArticuloAnalizado }) {
  const info = INFO_RECOMENDACION[a.recomendacion];
  return (
    <tr className="bg-panel/50 text-ink-2 hover:bg-panel">
      <td className="border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
        <span className="block border-l-2 border-rule pl-3 text-[12.5px]">
          {a.tela}
          <span className="block font-mono text-[11px] text-ink-3">{a.codigo}</span>
        </span>
      </td>
      <td className={TD}>{formatearEntero(a.ventas)}</td>
      <td className={TD} />
      <td className={TD}>{formatearEntero(a.stockHoy)}</td>
      <td className={TD} />
      <td className={TD} />
      <td className={TD}>
        <span className="flex justify-end">
          <BarraSellThrough valor={a.sellThrough} color={info.hex} ancho={72} />
        </span>
      </td>
    </tr>
  );
}
