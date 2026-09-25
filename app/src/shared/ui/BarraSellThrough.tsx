/**
 * Mini "rollo de tela" que representa el sell-through de una fila.
 *
 * El ancho relleno = % vendido; el color = recomendación. Réplica del `.mini`
 * del HTML (textura de tela con líneas diagonales). Presentacional puro.
 */
interface BarraSellThroughProps {
  /** Sell-through en [0,1]. */
  readonly valor: number;
  /** Color del relleno (hex o var CSS). */
  readonly color: string;
  readonly ancho?: number;
}

const TEXTURA_TELA =
  'repeating-linear-gradient(48deg,rgba(255,255,255,.30) 0 1.5px,transparent 1.5px 5px),' +
  'repeating-linear-gradient(-48deg,rgba(0,0,0,.14) 0 1.5px,transparent 1.5px 5px)';

export function BarraSellThrough({ valor, color, ancho = 96 }: BarraSellThroughProps) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100);
  return (
    <div
      className="flex h-[15px] overflow-hidden border border-ink bg-cloth"
      style={{ width: ancho }}
      role="img"
      aria-label={`Sell-through ${pct}%`}
    >
      <span
        className={pct < 100 ? 'block h-full border-r-[1.5px] border-ink' : 'block h-full'}
        style={{ width: `${pct}%`, backgroundColor: color, backgroundImage: TEXTURA_TELA }}
      />
    </div>
  );
}
