/**
 * Fichas (chips) que cuentan filas por recomendación y filtran al tocarlas.
 * Portado de `chips()` del HTML. Se ocultan las categorías sin filas.
 */
import { useMemo } from 'react';
import type { FilaAciertos } from '../logic/filtrarOrdenar';
import { INFO_RECOMENDACION } from '@/features/catalogo/logic/recomendacion';
import { Recomendacion } from '@/features/catalogo/model/tipos';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { formatearEntero } from '@/shared/formato/numeros';

interface ChipsRecomendacionProps {
  readonly filas: readonly FilaAciertos[];
}

const ORDEN: Recomendacion[] = [
  Recomendacion.Aumentar,
  Recomendacion.Mantener,
  Recomendacion.Reducir,
  Recomendacion.Liquidar,
  Recomendacion.Revisar,
];

export function ChipsRecomendacion({ filas }: ChipsRecomendacionProps) {
  const seleccion = useFiltrosStore((s) => s.recomendacion);
  const toggle = useFiltrosStore((s) => s.toggleRecomendacion);

  const conteos = useMemo(() => {
    const m = new Map<Recomendacion, number>();
    for (const f of filas) m.set(f.recomendacion, (m.get(f.recomendacion) ?? 0) + 1);
    return m;
  }, [filas]);

  return (
    <div className="mb-[14px] flex flex-wrap gap-2">
      {ORDEN.map((rec) => {
        const n = conteos.get(rec) ?? 0;
        if (!n) return null;
        const info = INFO_RECOMENDACION[rec];
        const activo = seleccion === rec;
        return (
          <button
            key={rec}
            type="button"
            aria-pressed={activo}
            onClick={() => toggle(rec)}
            className={`flex items-center gap-[9px] border px-[10px] py-[7px] text-[13px] ${
              activo ? 'border-ink bg-ink text-white' : 'border-rule bg-panel text-ink hover:border-ink'
            }`}
          >
            <span className="size-[11px] border border-black/35" style={{ background: info.hex }} />
            {info.texto}
            <span className="tabular font-semibold">{formatearEntero(n)}</span>
          </button>
        );
      })}
    </div>
  );
}
