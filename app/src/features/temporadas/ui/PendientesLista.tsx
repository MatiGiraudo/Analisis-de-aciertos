/**
 * Panel desplegable con lo que la lista de temporadas no pudo resolver sola:
 * nombres de la lista que no cruzan con ninguna tela del ERP y conflictos entre
 * entradas. Sirve para corregir nombres en el Excel o sumar equivalencias en
 * `config/aliasTemporadas.ts`. No se muestra si no hay nada pendiente.
 */
import { ETIQUETA_TEMPORADA } from '@/shared/tipos/temporada';
import type { ResolucionTemporadas } from '../logic/resolverTemporadas';

interface PendientesListaProps {
  readonly resolucion: ResolucionTemporadas;
}

export function PendientesLista({ resolucion }: PendientesListaProps) {
  const { sinCruce, conflictos } = resolucion;
  if (sinCruce.length === 0 && conflictos.length === 0) return null;

  return (
    <details className="mb-3 border border-rule bg-panel px-3 py-2 text-[12.5px] text-ink-2">
      <summary className="cursor-pointer select-none text-ink">
        {sinCruce.length > 0 && `${sinCruce.length} nombres de la lista sin tela en el ERP`}
        {sinCruce.length > 0 && conflictos.length > 0 && ' · '}
        {conflictos.length > 0 && `${conflictos.length} conflictos`}
      </summary>
      {sinCruce.length > 0 && (
        <>
          <p className="mt-2">
            Estos nombres no coinciden con ninguna tela de los Excel cargados (puede ser otro nombre en el ERP o
            una tela sin movimiento). Asigná la tela equivalente a mano en la tabla.
          </p>
          <ul className="mt-1 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {sinCruce.map((e) => (
              <li key={e.nombre}>
                {e.nombre} <span className="text-ink-3">· {ETIQUETA_TEMPORADA[e.temporada]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {conflictos.length > 0 && (
        <ul className="mt-2 list-disc pl-5">
          {conflictos.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
    </details>
  );
}
