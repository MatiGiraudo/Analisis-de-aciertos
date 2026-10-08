/**
 * Tabla de telas que no cierran `inicial + compras − ventas = hoy`, con acordeón de
 * los artículos que explican la diferencia y su causa probable.
 *
 * Presentacional: recibe las telas ya filtradas/paginadas y el estado del acordeón.
 *
 * Props:
 *  - `filas`: salida de `detallarDescuadres`.
 *  - `estaAbierta(nombre)` / `onAlternar(nombre)`: acordeón (lo maneja la página).
 */
import { Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatearEntero } from '@/shared/formato/numeros';
import type { TelaDescuadrada } from '../logic/detallarDescuadres';

interface TablaDescuadresProps {
  readonly filas: readonly TelaDescuadrada[];
  readonly estaAbierta: (tela: string) => boolean;
  readonly onAlternar: (tela: string) => void;
}

const TH = 'sticky top-0 z-[2] border-b-[1.5px] border-ink bg-paper px-[9px] py-[11px] text-right text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-2';
const TD = 'border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px] whitespace-nowrap';

/** Diferencia con signo y color: rojo si falta stock, verde si sobra. */
function Diferencia({ valor }: { readonly valor: number }) {
  return (
    <span className={`font-semibold ${valor < 0 ? 'text-rec-liquidar' : 'text-rec-aumentar'}`}>
      {valor > 0 ? '+' : ''}
      {formatearEntero(valor)}
    </span>
  );
}

export function TablaDescuadres({ filas, estaAbierta, onAlternar }: TablaDescuadresProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse">
        <thead>
          <tr>
            <th className={`${TH} text-left`}>Tela / artículo</th>
            <th className={TH}>Inicial</th>
            <th className={TH}>+ Compras</th>
            <th className={TH}>− Ventas</th>
            <th className={TH}>= Esperado</th>
            <th className={TH}>Stock hoy</th>
            <th className={TH}>Diferencia</th>
            <th className={`${TH} text-left`}>Causa probable</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const abierta = estaAbierta(f.tela.nombre);
            const alternar = () => onAlternar(f.tela.nombre);
            return (
              <Fragment key={f.tela.nombre}>
                <tr
                  className="cursor-pointer hover:bg-panel"
                  onClick={alternar}
                  tabIndex={0}
                  aria-expanded={abierta}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      alternar();
                    }
                  }}
                >
                  <td className="min-w-[220px] whitespace-normal border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
                    <span className="flex items-start gap-1.5">
                      <ChevronDown
                        aria-hidden
                        className={`mt-[2px] size-4 flex-none text-ink-3 transition-transform ${abierta ? 'rotate-180' : ''}`}
                      />
                      <span>
                        {f.tela.nombre}
                        <span className="block text-[11px] uppercase tracking-[0.04em] text-ink-3">
                          {f.tela.subRubro || '—'} · {f.tela.unidad} · {f.articulos.length} artículo
                          {f.articulos.length === 1 ? '' : 's'} no cierra{f.articulos.length === 1 ? '' : 'n'}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className={TD}>{formatearEntero(f.tela.stockInicial)}</td>
                  <td className={TD}>{formatearEntero(f.tela.compras)}</td>
                  <td className={TD}>{formatearEntero(f.tela.ventas)}</td>
                  <td className={TD}>{formatearEntero(f.esperado)}</td>
                  <td className={TD}>{formatearEntero(f.tela.stockHoy)}</td>
                  <td className={TD}>
                    <Diferencia valor={f.diferencia} /> <span className="text-[11px] text-ink-3">{f.tela.unidad}</span>
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-left text-[12px] text-ink-3">
                    {f.diferencia < 0 ? 'Falta stock' : 'Sobra stock'}
                  </td>
                </tr>
                {abierta &&
                  f.articulos.map((x) => (
                    <tr key={x.articulo.codigo} className="bg-panel/50 text-ink-2 hover:bg-panel">
                      <td className="whitespace-normal border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
                        <span className="block border-l-2 border-rule pl-3 text-[12.5px]">
                          <span className="font-mono text-[11px] text-ink-3">{x.articulo.codigo}</span>{' '}
                          {x.articulo.descripcion}
                        </span>
                      </td>
                      <td className={TD}>{formatearEntero(x.articulo.stockInicial)}</td>
                      <td className={TD}>{formatearEntero(x.articulo.compras)}</td>
                      <td className={TD}>{formatearEntero(x.articulo.ventas)}</td>
                      <td className={TD}>{formatearEntero(x.esperado)}</td>
                      <td className={TD}>{formatearEntero(x.articulo.stockHoy)}</td>
                      <td className={TD}>
                        <Diferencia valor={x.diferencia} />
                      </td>
                      <td className="max-w-[320px] whitespace-normal border-b border-rule-2 px-[9px] py-2 text-left text-[12px] leading-[1.35]">
                        {x.causa.texto}
                      </td>
                    </tr>
                  ))}
                {abierta && Math.abs(f.restoSinArticulo) > 1 && (
                  <tr className="bg-panel/50 text-ink-3">
                    <td colSpan={6} className="border-b border-rule-2 px-[9px] py-2 pl-[30px] text-left text-[12px] italic">
                      Diferencia que no se ve en ningún artículo (el stock de la tela viene de una foto por tela)
                    </td>
                    <td className={TD}>
                      <Diferencia valor={f.restoSinArticulo} />
                    </td>
                    <td className="border-b border-rule-2" />
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
