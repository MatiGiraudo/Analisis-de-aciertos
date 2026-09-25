/**
 * Página de Precios ponderados. Tres monedas (OFI / INTER / PESOS) y tres
 * alcances (Lista de 49 / Todas las telas / Por artículo). Une catálogo +
 * filtros con `analizarPrecios`.
 */
import { useMemo } from 'react';
import { analizarPrecios } from '../logic/analizarPrecios';
import type { CriteriosPrecios } from '../logic/analizarPrecios';
import { BarraFiltros } from '@/features/aciertos/ui/BarraFiltros';
import { MONEDAS } from '@/shared/tipos/moneda';
import type { Moneda } from '@/shared/tipos/moneda';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import type { AlcancePrecios, OrdenPrecios } from '@/features/catalogo/store/useFiltrosStore';
import { formatearDinero, formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import { paginar } from '@/shared/logic/paginar';
import { Paginacion } from '@/shared/ui/Paginacion';

const FILAS_POR_PAGINA = 50;
const ANCLA = 'tabla-precios';

const COLS: { clave: OrdenPrecios; label: string; izq?: boolean }[] = [
  { clave: 'name', label: 'Ítem', izq: true },
  { clave: 'un', label: 'Un. en esta lista' },
  { clave: 'sh', label: '% de sus unidades' },
  { clave: 'net', label: 'Neto' },
  { clave: 'pr', label: 'Precio ponderado' },
  { clave: 'net', label: '% del neto de la lista' },
];

export function PreciosPage() {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const f = useFiltrosStore();

  const items = useMemo(() => {
    if (!catalogo) return [];
    if (f.alcancePrecios === 'art') return catalogo.articulos;
    if (f.alcancePrecios === 'lista') return catalogo.lista;
    return catalogo.telas;
  }, [catalogo, f.alcancePrecios]);

  const criterios: CriteriosPrecios = {
    moneda: f.moneda,
    q: f.q,
    unidad: f.unidad,
    subRubro: f.subRubro,
    rotacion: f.rotacion,
    volumenMin: f.volumenMin,
    orden: f.ordenPrecios,
  };

  const resultado = useMemo(() => analizarPrecios(items, criterios), [items, criterios]);
  if (!catalogo) return null;

  const info = MONEDAS[f.moneda];
  const pagina = paginar(resultado.filas, f.paginaPrecios, FILAS_POR_PAGINA);
  const noun = f.alcancePrecios === 'art' ? 'artículos' : 'telas';

  return (
    <div>
      {/* Selector de moneda */}
      <div className="mt-4 flex border border-ink">
        {MONEDAS.map((mon) => (
          <button
            key={mon.clave}
            type="button"
            aria-selected={f.moneda === mon.clave}
            onClick={() => f.setMoneda(mon.clave as Moneda)}
            className={`border-r border-ink px-[15px] py-2 text-[13px] last:border-r-0 ${
              f.moneda === mon.clave ? 'bg-ink text-white' : 'text-ink hover:bg-panel'
            }`}
          >
            {mon.etiqueta}
          </button>
        ))}
      </div>

      {/* Nota de moneda */}
      <div className="flex flex-wrap items-baseline gap-x-[22px] gap-y-2 py-3 text-[12.5px] text-ink-2">
        <span>
          Precio ponderado{' '}
          <b className="tabular text-ink">
            {resultado.precioPonderadoGlobal !== null
              ? formatearDinero(resultado.precioPonderadoGlobal, info.decimales)
              : '—'}
          </b>{' '}
          por unidad en el total de la lista
        </span>
        <span>
          {formatearEntero(resultado.cantidad)} {noun} con venta en esta lista
        </span>
        <span>
          Neto acumulado <b className="tabular text-ink">{formatearDinero(resultado.netoAcumuladoFiltrado, 0)}</b>
        </span>
        {f.moneda === 0 && (
          <span className="text-rec-liquidar">
            Ojo: el oficial es una fracción mínima de las unidades, así que muchos promedios se apoyan
            en muy poco volumen.
          </span>
        )}
      </div>

      {/* Alcance */}
      <div className="mb-3 flex flex-none border border-ink w-fit">
        {(
          [
            ['lista', 'Lista de 49'],
            ['tela', 'Todas las telas'],
            ['art', 'Por artículo'],
          ] as [AlcancePrecios, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={f.alcancePrecios === v}
            onClick={() => f.setAlcancePrecios(v)}
            className={`border-r border-ink px-[13px] py-[7px] text-[12.5px] last:border-r-0 ${
              f.alcancePrecios === v ? 'bg-ink text-white' : 'text-ink hover:bg-panel'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div id={ANCLA} className="scroll-mt-4">
        <BarraFiltros mostrarOrden={false} conteo={`${formatearEntero(resultado.filas.length)} ${noun}`} />
      </div>

      {resultado.filas.length === 0 ? (
        <div className="px-2 py-11 text-center text-[14px] text-ink-3">
          Ningún ítem tiene ventas en {info.etiqueta}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                {COLS.map((c, i) => (
                  <th
                    key={i}
                    className="sticky top-0 z-[2] border-b-[1.5px] border-ink bg-paper p-0 text-right"
                  >
                    <button
                      type="button"
                      onClick={() => f.setOrdenPrecios(c.clave)}
                      className={`w-full px-[9px] py-[11px] text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
                        c.izq ? 'text-left' : 'text-right'
                      } ${f.ordenPrecios === c.clave ? 'text-ink' : 'text-ink-2'}`}
                    >
                      {c.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagina.items.map((fila) => (
                <tr key={fila.clave} className="hover:bg-panel">
                  <td className="min-w-[200px] whitespace-normal border-b border-rule-2 px-[9px] py-2 text-left leading-[1.3]">
                    {fila.codigo && <span className="font-mono text-[11.5px] text-ink-3">{fila.codigo}</span>}{' '}
                    {fila.titulo}
                    <span className="block text-[11px] uppercase tracking-[0.04em] text-ink-3">
                      {fila.subtitulo}
                    </span>
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px] whitespace-nowrap">
                    {formatearEntero(fila.unidades)} <span className="text-[11px] text-ink-3">{fila.unidad}</span>
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px]">
                    {formatearPorcentaje(fila.participacion)}
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px]">
                    {formatearDinero(fila.neto, 0)}
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px] font-semibold">
                    {formatearDinero(fila.precio, info.decimales)}
                  </td>
                  <td className="border-b border-rule-2 px-[9px] py-2 text-right tabular text-[13px]">
                    {resultado.netoTotalUniverso > 0
                      ? formatearPorcentaje(fila.neto / resultado.netoTotalUniverso)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion pagina={pagina} sustantivo={noun} onCambiar={f.setPaginaPrecios} anclaId={ANCLA} />
    </div>
  );
}
