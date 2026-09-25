/**
 * Puntaje 0–100 con barra texturada coloreada por recomendación.
 *
 * Props:
 *  - `puntaje`: valor 0–100 (0 se muestra como "—").
 *  - `color`: hex de la recomendación del ítem.
 *  - `compacta`: versión más chica para las filas de color dentro del acordeón.
 */
const TEXTURA =
  'repeating-linear-gradient(48deg,rgba(255,255,255,.30) 0 1.5px,transparent 1.5px 5px),' +
  'repeating-linear-gradient(-48deg,rgba(0,0,0,.14) 0 1.5px,transparent 1.5px 5px)';

interface BarraPuntajeProps {
  readonly puntaje: number;
  readonly color: string;
  readonly compacta?: boolean;
}

export function BarraPuntaje({ puntaje, color, compacta = false }: BarraPuntajeProps) {
  return (
    <span className="block text-right max-[640px]:text-left">
      <span className={`tabular font-semibold ${compacta ? 'text-[12px]' : 'text-[13px]'}`}>
        {puntaje > 0 ? puntaje.toFixed(0) : '—'}
        <i className="not-italic text-ink-3">/100</i>
      </span>
      <span
        className={`mt-[5px] block overflow-hidden border border-ink bg-cloth ${compacta ? 'h-[6px]' : 'h-[9px]'}`}
      >
        <i
          className="block h-full"
          style={{ width: `${Math.round(puntaje)}%`, backgroundColor: color, backgroundImage: TEXTURA }}
        />
      </span>
    </span>
  );
}
