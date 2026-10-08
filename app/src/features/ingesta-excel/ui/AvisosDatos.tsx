/**
 * Panel plegable con las salvedades de datos detectadas en la ingesta
 * (stock inicial duplicado, telas que no cierran, hojas ignoradas…).
 *
 * Props:
 *  - `avisos`: mensajes ya redactados por la ingesta. Si está vacío no se renderiza.
 * Solo presenta (SRP): los avisos los genera `procesarArchivos`. Enlaza a la
 * pestaña Salvedades, donde se ve qué telas y artículos no cierran.
 */
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <Link to="/salvedades" className="mt-2 inline-block text-[12.5px] text-ink underline underline-offset-2 hover:no-underline">
        Ver detalle de salvedades →
      </Link>
    </details>
  );
}
