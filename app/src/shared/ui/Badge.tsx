/**
 * Etiqueta de color sólido (badge) para mostrar la recomendación de una fila.
 *
 * Presentacional puro: recibe texto y color; no conoce el dominio.
 */
interface BadgeProps {
  readonly texto: string;
  readonly color: string;
}

export function Badge({ texto, color }: BadgeProps) {
  return (
    <span
      className="inline-block whitespace-nowrap px-[9px] py-[3px] text-[11.5px] font-semibold text-white"
      style={{ background: color }}
    >
      {texto}
    </span>
  );
}
