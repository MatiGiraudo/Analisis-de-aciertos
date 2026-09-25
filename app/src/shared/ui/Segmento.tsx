/**
 * Control segmentado (grupo de botones excluyentes), estilo editorial.
 *
 * Props:
 *  - `opciones`: pares [valor, etiqueta].
 *  - `valor`: valor activo.
 *  - `onChange`: se llama con el valor elegido.
 */
interface SegmentoProps {
  readonly opciones: readonly (readonly [string, string])[];
  readonly valor: string;
  readonly onChange: (v: string) => void;
}

export function Segmento({ opciones, valor, onChange }: SegmentoProps) {
  return (
    <div className="flex flex-none border border-ink">
      {opciones.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={valor === v}
          onClick={() => onChange(v)}
          className={`border-r border-ink px-[13px] py-[7px] text-[12.5px] last:border-r-0 ${
            valor === v ? 'bg-ink text-white' : 'text-ink hover:bg-panel'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
