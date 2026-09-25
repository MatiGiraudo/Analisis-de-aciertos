/**
 * Panel plegable con las salvedades de datos detectadas en la ingesta
 * (stock inicial duplicado, telas que no cierran, hojas ignoradas…).
 *
 * Props:
 *  - `avisos`: mensajes ya redactados por la ingesta. Si está vacío no se renderiza.
 * Solo presenta (SRP): los avisos los genera `procesarArchivos`.
 */
import { AlertTriangle } from 'lucide-react';

interface AvisosDatosProps {
  readonly avisos: readonly string[];
}

export function AvisosDatos({ avisos }: AvisosDatosProps) {
  if (avisos.length === 0) return null;
  return (
    <details className="mb-5 border border-rule bg-panel/60 px-4 py-2.5 text-[13px] text-ink-2">
      <summary className="flex cursor-pointer items-center gap-2 text-ink">
        <AlertTriangle className="size-4 text-rec-reducir" />
        <span className="font-medium">
          {avisos.length === 1 ? '1 salvedad de datos' : `${avisos.length} salvedades de datos`}
        </span>
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        {avisos.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </details>
  );
}
