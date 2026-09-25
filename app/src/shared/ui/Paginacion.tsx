/**
 * Control de paginación compartido: "Mostrando X–Y de N", anterior/siguiente y
 * números de página (con "…" en listas largas).
 *
 * Props:
 *  - `pagina`: resultado de `paginar` (página efectiva, totales y rango).
 *  - `sustantivo`: qué se cuenta ("telas", "colores", "filas").
 *  - `onCambiar`: recibe la página elegida (1-based).
 * No se renderiza si todo entra en una página. Al cambiar de página, lleva la
 * vista al comienzo de la lista (`anclaId`) para no quedar al pie.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatearEntero } from '@/shared/formato/numeros';
import type { Pagina } from '@/shared/logic/paginar';
import { rangoPaginas } from '@/shared/logic/paginar';

interface PaginacionProps {
  readonly pagina: Pagina<unknown>;
  readonly sustantivo: string;
  readonly onCambiar: (pagina: number) => void;
  /** id del elemento al que se desplaza la vista al cambiar de página. */
  readonly anclaId?: string;
}

const BOTON =
  'inline-flex h-8 min-w-8 items-center justify-center border border-rule px-2 text-[12.5px] tabular text-ink hover:border-ink disabled:cursor-default disabled:opacity-35 disabled:hover:border-rule';

export function Paginacion({ pagina, sustantivo, onCambiar, anclaId }: PaginacionProps) {
  if (pagina.totalPaginas <= 1) return null;

  const ir = (p: number) => {
    onCambiar(p);
    if (anclaId) document.getElementById(anclaId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3"
    >
      <span className="text-[12px] text-ink-3">
        Mostrando {formatearEntero(pagina.desde)}–{formatearEntero(pagina.hasta)} de {formatearEntero(pagina.total)}{' '}
        {sustantivo}
      </span>
      <span className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className={BOTON}
          disabled={pagina.pagina === 1}
          onClick={() => ir(pagina.pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        {rangoPaginas(pagina.pagina, pagina.totalPaginas).map((p, i) =>
          p === '…' ? (
            <span key={`h${i}`} className="px-1 text-[12.5px] text-ink-3">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => ir(p)}
              aria-current={p === pagina.pagina ? 'page' : undefined}
              className={`${BOTON} ${p === pagina.pagina ? 'border-ink bg-ink text-white hover:border-ink' : ''}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={BOTON}
          disabled={pagina.pagina === pagina.totalPaginas}
          onClick={() => ir(pagina.pagina + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </span>
    </nav>
  );
}
