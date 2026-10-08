/**
 * Tarjetas de resumen por temporada (Verano / Invierno / Atemporal / Sin asignar).
 *
 * Cada tarjeta muestra cuántas telas tiene y, por unidad (KGS y MTS por separado),
 * ventas, stock hoy, sell-through y cobertura. Tocar una tarjeta filtra por esa
 * temporada; tocarla de nuevo quita el filtro.
 *
 * Props:
 *  - `resumen`: salida de `resumirPorTemporada`.
 *  - `activa` / `onElegir`: filtro de temporada actual y cómo cambiarlo.
 */
import type { FiltroTemporada } from '@/shared/tipos/temporada';
import { ETIQUETA_TEMPORADA } from '@/shared/tipos/temporada';
import { formatearCobertura, formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import type { ResumenTemporada } from '../logic/resumirPorTemporada';
import { ESTILO_TEMPORADA } from './EtiquetaTemporada';

interface TarjetasTemporadaProps {
  readonly resumen: readonly ResumenTemporada[];
  readonly activa: FiltroTemporada;
  readonly onElegir: (t: FiltroTemporada) => void;
}

export function TarjetasTemporada({ resumen, activa, onElegir }: TarjetasTemporadaProps) {
  return (
    <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
      {resumen.map((r) => {
        const { icono: Icono, color } = ESTILO_TEMPORADA[r.clave];
        const seleccionada = activa === r.clave;
        return (
          <button
            key={r.clave}
            type="button"
            aria-pressed={seleccionada}
            onClick={() => onElegir(seleccionada ? '' : r.clave)}
            className={`flex flex-col border bg-panel p-3 text-left transition-colors ${
              seleccionada ? 'border-ink ring-1 ring-ink' : 'border-rule hover:border-ink'
            } ${r.clave === 'SIN' && r.telas > 0 ? 'border-dashed' : ''}`}
          >
            <span className="flex items-center gap-2">
              <Icono aria-hidden className="size-4" style={{ color }} />
              <span className="font-disp text-[15px] font-bold uppercase tracking-[0.02em]">
                {ETIQUETA_TEMPORADA[r.clave]}
              </span>
              <span className="ml-auto tabular text-[20px] font-semibold leading-none">{formatearEntero(r.telas)}</span>
            </span>
            <span className="mb-2 text-right text-[10.5px] uppercase tracking-[0.1em] text-ink-3">telas</span>
            {r.porUnidad.length === 0 ? (
              <span className="text-[12px] text-ink-3">Sin telas.</span>
            ) : (
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    <th className="pb-0.5 text-left font-medium" />
                    <th className="pb-0.5 text-right font-medium">Ventas</th>
                    <th className="pb-0.5 text-right font-medium">Stock</th>
                    <th className="pb-0.5 text-right font-medium">ST</th>
                    <th className="pb-0.5 text-right font-medium">Cob.</th>
                  </tr>
                </thead>
                <tbody>
                  {r.porUnidad.map((u) => (
                    <tr key={u.unidad} className="tabular">
                      <td className="text-left text-[10px] tracking-[0.08em] text-ink-3">{u.unidad}</td>
                      <td className="text-right">{formatearEntero(u.ventas)}</td>
                      <td className="text-right">{formatearEntero(u.stockHoy)}</td>
                      <td className="text-right">{formatearPorcentaje(u.sellThrough)}</td>
                      <td className="text-right">{formatearCobertura(u.cobertura)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </button>
        );
      })}
    </div>
  );
}
