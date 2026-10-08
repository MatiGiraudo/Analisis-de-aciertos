/**
 * Etiqueta compacta de temporada (ícono + texto), para filas y encabezados.
 *
 * Props:
 *  - `temporada`: la temporada, o `null` para "sin asignar" (borde punteado).
 *  - `compacta`: solo el ícono, con el texto como tooltip.
 */
import { CircleHelp, Infinity as IconoAtemporal, Snowflake, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ETIQUETA_TEMPORADA } from '@/shared/tipos/temporada';
import type { Temporada } from '@/shared/tipos/temporada';

export const ESTILO_TEMPORADA: Record<Temporada | 'SIN', { icono: LucideIcon; color: string }> = {
  VERANO: { icono: Sun, color: 'var(--color-temp-verano)' },
  INVIERNO: { icono: Snowflake, color: 'var(--color-temp-invierno)' },
  ATEMPORAL: { icono: IconoAtemporal, color: 'var(--color-temp-atemporal)' },
  SIN: { icono: CircleHelp, color: 'var(--color-ink-3)' },
};

interface EtiquetaTemporadaProps {
  readonly temporada: Temporada | null;
  readonly compacta?: boolean;
}

export function EtiquetaTemporada({ temporada, compacta = false }: EtiquetaTemporadaProps) {
  const clave = temporada ?? 'SIN';
  const { icono: Icono, color } = ESTILO_TEMPORADA[clave];
  const texto = ETIQUETA_TEMPORADA[clave];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap border px-1.5 py-px text-[10.5px] font-medium normal-case tracking-normal ${
        temporada ? 'border-current' : 'border-dashed border-current'
      }`}
      style={{ color }}
      title={compacta ? texto : undefined}
    >
      <Icono aria-hidden className="size-3" />
      {compacta ? <span className="sr-only">{texto}</span> : texto}
    </span>
  );
}
