/**
 * Índice de tendencia de un color (participación en ventas ÷ participación en stock).
 *
 * Props:
 *  - `indice`: valor del índice, o null si el color no tiene disponible.
 * ≥ UMBRAL_TIRA se marca "tira" (verde ▲); ≤ UMBRAL_FRENA "frena" (rojo ▼); el resto, parejo.
 */
import { formatearCobertura } from '@/shared/formato/numeros';

export const UMBRAL_TIRA = 1.2;
export const UMBRAL_FRENA = 0.8;

export function IndiceTendencia({ indice }: { readonly indice: number | null }) {
  if (indice === null) return <span className="text-ink-3">—</span>;
  const tira = indice >= UMBRAL_TIRA;
  const frena = indice <= UMBRAL_FRENA;
  const clase = tira ? 'text-rec-aumentar' : frena ? 'text-rec-liquidar' : 'text-ink-2';
  const titulo = tira
    ? 'Se vende más de lo que pesa en el stock'
    : frena
      ? 'Pesa más en el stock de lo que se vende'
      : 'Se vende en proporción a su stock';
  return (
    <span className={`font-semibold ${clase}`} title={titulo}>
      {tira ? '▲ ' : frena ? '▼ ' : ''}
      {formatearCobertura(indice)}
    </span>
  );
}
