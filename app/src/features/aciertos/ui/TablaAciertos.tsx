/**
 * Tabla de aciertos por TELA, con acordeón de colores.
 *
 * Portada de `render()` del HTML y unificada con la antigua vista "Artículos":
 * cada fila de tela se despliega y muestra sus colores como sub-filas con las
 * mismas columnas. El orden se cambia clickeando el encabezado. Presentacional:
 * recibe las telas ya filtradas/ordenadas/paginadas y el estado del acordeón.
 *
 * Props:
 *  - `filas`: telas con sus colores (`telasConColores`).
 *  - `estaAbierta` / `onAlternar`: estado del acordeón (lo maneja la página).
 */
import { Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TelaConColores } from '../logic/telasConColores';
import type { FilaAciertos } from '../logic/filtrarOrdenar';
import type { CampoEstimado } from '@/features/catalogo/model/tipos';
import { INFO_RECOMENDACION } from '@/features/catalogo/logic/recomendacion';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import type { OrdenTabla } from '@/features/catalogo/store/useFiltrosStore';
import { Badge } from '@/shared/ui/Badge';
import { BarraSellThrough } from '@/shared/ui/BarraSellThrough';
import { formatearCobertura, formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';

interface Columna {
  readonly clave: OrdenTabla;
  readonly label: string;
  readonly alaIzquierda?: boolean;
}

const COLUMNAS: Columna[] = [
  { clave: 'name', label: 'Tela / color', alaIzquierda: true },
  { clave: 'st', label: 'Sell-through', alaIzquierda: true },
  { clave: 'st', label: '%' },
  { clave: 'ini', label: 'Stock inicial' },
  { clave: 'com', label: 'Compras' },
  { clave: 'disp', label: 'Disponible' },
  { clave: 'ven', label: 'Ventas' },
  { clave: 'hoy', label: 'Stock hoy' },
  { clave: 'cob', label: 'Cobertura' },
  { clave: 'n', label: 'Colores' },
  { clave: 'rec', label: 'Recomendación' },
];

/** Rótulo corto de cada cantidad que puede venir estimada a nivel color. */
const ETIQUETA_ESTIMADO: Record<CampoEstimado, string> = {
  stockInicial: 'inicial',
  compras: 'compras',
  stockHoy: 'stock hoy',
};

interface TablaAciertosProps {
  readonly filas: readonly TelaConColores[];
  readonly estaAbierta: (fila: TelaConColores) => boolean;
  readonly onAlternar: (fila: TelaConColores) => void;
}

export function TablaAciertos({ filas, estaAbierta, onAlternar }: TablaAciertosProps) {
  const orden = useFiltrosStore((s) => s.orden);
  const setOrden = useFiltrosStore((s) => s.setOrden);

  const alClickHeader = (clave: OrdenTabla) => {
    if (clave === 'st') setOrden(orden === 'st' ? 'st_asc' : 'st');
    else setOrden(clave);
  };

  const activo = (clave: OrdenTabla) => orden === clave || (clave === 'st' && orden === 'st_asc');

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr>
            {COLUMNAS.map((c, i) => (
              <th key={i} className="sticky top-0 z-[2] border-b-[1.5px] border-ink bg-paper p-0 text-right">
                <button
                  type="button"
                  onClick={() => alClickHeader(c.clave)}
                  className={`w-full px-[9px] py-[11px] text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
                    c.alaIzquierda ? 'text-left' : 'text-right'
                  } ${activo(c.clave) ? 'text-ink' : 'text-ink-2'}`}
                >
                  {c.label}
                  {activo(c.clave) && (
                    <span className="ml-1 text-[9px] opacity-55">{orden === 'st_asc' ? '▲' : '▼'}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const abierta = estaAbierta(f);
            return (
              <Fragment key={f.tela.nombre}>
                <FilaTabla fila={f.tela} abierta={abierta} onAlternar={() => onAlternar(f)} />
                {abierta && f.colores.map((a) => <FilaTabla key={a.codigo} fila={a} />)}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface FilaTablaProps {
  readonly fila: FilaAciertos;
  /** Solo filas de tela: estado y acción del acordeón. */
  readonly abierta?: boolean;
  readonly onAlternar?: () => void;
}

const TD = 'px-[9px] py-2 border-b border-rule-2 text-right tabular text-[13px] whitespace-nowrap';

function FilaTabla({ fila, abierta = false, onAlternar }: FilaTablaProps) {
  const info = INFO_RECOMENDACION[fila.recomendacion];
  const gap = fila.disponible - fila.ventas - fila.stockHoy;
  const flag = gap > 0.5;
  const esTela = fila.clase === 'tela';

  return (
    <tr
      className={esTela ? 'cursor-pointer hover:bg-panel' : 'bg-panel/50 text-ink-2 hover:bg-panel'}
      onClick={esTela ? onAlternar : undefined}
      tabIndex={esTela ? 0 : undefined}
      aria-expanded={esTela ? abierta : undefined}
      onKeyDown={
        esTela
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAlternar?.();
              }
            }
          : undefined
      }
    >
      {/* Nombre */}
      <td className="min-w-[220px] whitespace-normal border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
        {fila.clase === 'articulo' ? (
          <span className="block border-l-2 border-rule pl-3 text-[12.5px]">
            <span className="font-mono text-[11px] text-ink-3">{fila.codigo}</span> {fila.descripcion}
            {fila.camposEstimados.length > 0 && (
              <span className="block text-[10px] uppercase tracking-[0.04em] text-ink-3">
                {fila.camposEstimados.map((c) => ETIQUETA_ESTIMADO[c]).join(' y ')} estimado
              </span>
            )}
          </span>
        ) : (
          <span className="flex items-start gap-1.5">
            <ChevronDown
              aria-hidden
              className={`mt-[2px] size-4 flex-none text-ink-3 transition-transform ${abierta ? 'rotate-180' : ''}`}
            />
            <span>
              {fila.nombre}
              {fila.enLista && <span className="ml-1 text-[11px] text-rec-mantener">★</span>}
              <span className="block text-[11px] uppercase tracking-[0.04em] text-ink-3">
                {fila.subRubro || '—'} · {fila.unidad}
              </span>
            </span>
          </span>
        )}
      </td>
      {/* Sell-through */}
      <td className="border-b border-rule-2 py-2 pl-0 pr-[9px] text-right">
        <BarraSellThrough valor={fila.sellThrough} color={info.hex} />
      </td>
      <td className={TD}>{formatearPorcentaje(fila.sellThrough)}</td>
      <td className={TD}>{formatearEntero(fila.stockInicial)}</td>
      <td
        className={`${TD} ${flag ? 'text-rec-liquidar' : ''}`}
        title={flag ? `Faltan ${formatearEntero(gap)} ${fila.unidad}: compradas y no ingresadas al stock` : undefined}
      >
        {formatearEntero(fila.compras)}
        {flag ? ' *' : ''}
      </td>
      <td className={TD}>
        {formatearEntero(fila.disponible)} <span className="text-[11px] tracking-[0.08em] text-ink-3">{fila.unidad}</span>
      </td>
      <td className={TD}>{formatearEntero(fila.ventas)}</td>
      <td className={TD}>{formatearEntero(fila.stockHoy)}</td>
      <td className={TD}>{formatearCobertura(fila.cobertura)}</td>
      <td className={TD}>{esTela ? fila.colores : ''}</td>
      <td className={`${TD} text-right`}>
        <Badge texto={info.texto} color={info.varColor} />
      </td>
    </tr>
  );
}
