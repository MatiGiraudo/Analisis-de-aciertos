/**
 * Hero: dos "rollos de tela" con el % vendido global por unidad (Punto/KGS y
 * Plano/MTS). Portado del bloque `.bolts` del HTML. El total es siempre sobre
 * todas las telas (no depende de filtros).
 */
import { useMemo } from 'react';
import type { TelaAnalizada } from '@/features/catalogo/model/tipos';
import { FAMILIA_POR_UNIDAD } from '@/shared/tipos/unidad';
import type { Unidad } from '@/shared/tipos/unidad';
import { formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';

interface HeroRollosProps {
  readonly telas: readonly TelaAnalizada[];
}

interface ResumenUnidad {
  readonly disponible: number;
  readonly ventas: number;
  readonly stockHoy: number;
  readonly colores: number;
}

const TEXTURA =
  'repeating-linear-gradient(48deg,rgba(255,255,255,.30) 0 1.5px,transparent 1.5px 5px),' +
  'repeating-linear-gradient(-48deg,rgba(0,0,0,.14) 0 1.5px,transparent 1.5px 5px)';

function color(st: number): string {
  return st >= 0.4 ? 'var(--color-rec-aumentar)' : st >= 0.3 ? 'var(--color-rec-reducir)' : 'var(--color-rec-liquidar)';
}

export function HeroRollos({ telas }: HeroRollosProps) {
  const resumen = useMemo(() => {
    const acc = new Map<Unidad, ResumenUnidad>();
    for (const t of telas) {
      const prev = acc.get(t.unidad) ?? { disponible: 0, ventas: 0, stockHoy: 0, colores: 0 };
      acc.set(t.unidad, {
        disponible: prev.disponible + t.disponible,
        ventas: prev.ventas + t.ventas,
        stockHoy: prev.stockHoy + t.stockHoy,
        colores: prev.colores + t.colores,
      });
    }
    return acc;
  }, [telas]);

  return (
    <section className="mb-8 grid gap-[18px] sm:grid-cols-2">
      {(['KGS', 'MTS'] as const).map((u) => {
        const d = resumen.get(u);
        if (!d) return null;
        const st = d.disponible > 0 ? d.ventas / d.disponible : 0;
        const { familia, sustantivo } = FAMILIA_POR_UNIDAD[u];
        return (
          <div key={u} className="border border-rule bg-panel px-[18px] pb-4 pt-[18px]">
            <h2 className="font-disp text-[13px] font-bold uppercase tracking-[0.16em] text-ink-2">
              {familia} · {u} · {formatearEntero(d.colores)} artículos
            </h2>
            <div className="mb-[14px] mt-[2px] flex items-end gap-[10px]">
              <span
                className="font-disp text-[clamp(44px,6vw,64px)] font-black leading-[0.9] tracking-[-0.03em]"
                style={{ color: color(st) }}
              >
                {formatearPorcentaje(st)}
              </span>
              <span className="pb-[7px] text-[11.5px] uppercase tracking-[0.1em] text-ink-3">
                se vendió
              </span>
            </div>
            <div className="flex h-[46px] overflow-hidden border border-ink bg-cloth">
              <span
                className="transition-[width] duration-1000 ease-out"
                style={{ width: `${(st * 100).toFixed(2)}%`, backgroundColor: color(st), backgroundImage: TEXTURA }}
              />
              {st < 0.999 && <span className="flex-1 border-l-[1.5px] border-ink" />}
            </div>
            <div className="mt-[9px] flex justify-between gap-3 text-[12px] text-ink-2">
              <span>
                Vendido <b className="tabular text-ink">{formatearEntero(d.ventas)}</b> {sustantivo}
              </span>
              <span>
                Queda <b className="tabular text-ink">{formatearEntero(d.stockHoy)}</b> {sustantivo}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
