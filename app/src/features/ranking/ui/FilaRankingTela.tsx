/**
 * Fila del ranking para una TELA, con acordeón de sus colores.
 *
 * Props:
 *  - `item`: tela rankeada (tela, puntaje del modo activo y colores ordenados).
 *  - `posicion`: puesto en el ranking (1-based); el podio (1–3) va resaltado.
 *  - `modo`: modo activo, para el puntaje de cada color.
 *  - `abierta` / `onAlternar`: estado del acordeón (lo maneja la página).
 * Los colores sin puntaje en el modo activo (p. ej. sin ventas en "Reponer ya")
 * se muestran atenuados al final.
 */
import { ChevronDown } from 'lucide-react';
import type { ArticuloAnalizado } from '@/features/catalogo/model/tipos';
import type { ModoRanking } from '@/features/catalogo/store/useFiltrosStore';
import { INFO_RECOMENDACION } from '@/features/catalogo/logic/recomendacion';
import { formatearCobertura, formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import type { TelaRankeada } from '../logic/rankear';
import { puntajeDe } from '../logic/rankear';
import { BarraPuntaje } from './BarraPuntaje';

interface FilaRankingTelaProps {
  readonly item: TelaRankeada;
  readonly posicion: number;
  readonly modo: ModoRanking;
  readonly abierta: boolean;
  readonly onAlternar: () => void;
}

export function FilaRankingTela({ item, posicion, modo, abierta, onAlternar }: FilaRankingTelaProps) {
  const { tela, puntaje, colores } = item;
  const idPanel = `ranking-colores-${posicion}`;

  return (
    <li className="border-b border-rule-2">
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-controls={idPanel}
        className="grid w-full grid-cols-[58px_1fr_190px_20px] items-center gap-[14px] px-1 py-3 text-left hover:bg-panel max-[640px]:grid-cols-[44px_1fr_20px]"
      >
        <span
          className={`text-right font-disp text-[30px] font-black leading-none tabular ${
            posicion <= 3 ? 'text-ink' : 'text-rule'
          }`}
        >
          {String(posicion).padStart(2, '0')}
        </span>
        <span className="min-w-0">
          <span className="text-[14.5px] font-medium leading-[1.25]">
            {tela.nombre}
            {tela.enLista && <span className="ml-1 text-[11px] text-rec-mantener">★</span>}
          </span>
          <span className="mt-[3px] block text-[11.5px] tabular text-ink-2">
            <Dato valor={`${tela.subRubro || '—'} · ${tela.unidad}`} />
            <Dato etiqueta="vendió" valor={`${formatearEntero(tela.ventas)} ${tela.unidad}`} />
            <Dato etiqueta="queda" valor={formatearEntero(tela.stockHoy)} />
            <Dato etiqueta="ST" valor={formatearPorcentaje(tela.sellThrough)} />
            <Dato etiqueta="cob" valor={formatearCobertura(tela.cobertura)} />
            <Dato etiqueta="colores" valor={formatearEntero(colores.length)} />
          </span>
        </span>
        <span className="max-[640px]:col-span-2 max-[640px]:col-start-2 max-[640px]:row-start-2">
          <BarraPuntaje puntaje={puntaje} color={INFO_RECOMENDACION[tela.recomendacion].hex} />
        </span>
        <ChevronDown
          aria-hidden
          className={`size-4 text-ink-3 transition-transform max-[640px]:col-start-3 max-[640px]:row-start-1 ${
            abierta ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierta && (
        <ol id={idPanel} className="m-0 mb-3 ml-[72px] list-none border-l border-rule p-0 max-[640px]:ml-4">
          {colores.map((a) => (
            <FilaColor key={a.codigo} articulo={a} modo={modo} />
          ))}
        </ol>
      )}
    </li>
  );
}

function FilaColor({ articulo: a, modo }: { readonly articulo: ArticuloAnalizado; readonly modo: ModoRanking }) {
  const puntaje = puntajeDe(a, modo);
  return (
    <li
      className={`grid grid-cols-[1fr_150px] items-center gap-[14px] border-b border-rule-2 py-2 pl-3 pr-[34px] last:border-b-0 max-[640px]:grid-cols-1 max-[640px]:pr-1 ${
        puntaje > 0 ? '' : 'opacity-50'
      }`}
    >
      <span className="min-w-0">
        <span className="text-[13px] leading-[1.25]">
          <span className="font-mono text-[11.5px] text-ink-3">{a.codigo}</span> {a.descripcion}
        </span>
        <span className="mt-[2px] block text-[11px] tabular text-ink-2">
          <Dato etiqueta="vendió" valor={formatearEntero(a.ventas)} />
          <Dato etiqueta="queda" valor={formatearEntero(a.stockHoy)} />
          <Dato etiqueta="ST" valor={formatearPorcentaje(a.sellThrough)} />
          <Dato etiqueta="cob" valor={formatearCobertura(a.cobertura)} />
        </span>
      </span>
      <BarraPuntaje puntaje={puntaje} color={INFO_RECOMENDACION[a.recomendacion].hex} compacta />
    </li>
  );
}

function Dato({ etiqueta, valor }: { readonly etiqueta?: string; readonly valor: string }) {
  return (
    <span className="mr-3 whitespace-nowrap">
      {etiqueta && <i className="not-italic text-ink-3">{etiqueta} </i>}
      {valor}
    </span>
  );
}
