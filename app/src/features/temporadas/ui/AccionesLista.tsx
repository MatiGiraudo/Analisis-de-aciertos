/**
 * Barra de acciones sobre la lista de temporadas: de dónde sale la lista, cuántas
 * correcciones manuales hay, exportar a Excel, cargar una lista nueva y volver a
 * la lista base.
 *
 * Conecta la UI con el store y los servicios de planilla (no calcula nada):
 *  - Exportar: una fila por tela con su temporada vigente (incluye correcciones).
 *  - Cargar: reemplaza la lista y descarta las correcciones (pide confirmación si hay).
 */
import { useRef } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { EscritorPlanillaXlsx } from '@/features/ingesta-excel/services/EscritorPlanillaXlsx';
import { LectorPlanillaXlsx } from '@/features/ingesta-excel/services/LectorPlanillaXlsx';
import type { TelaAnalizada } from '@/features/catalogo/model/tipos';
import { formatearEntero } from '@/shared/formato/numeros';
import { TEMPORADAS_BASE } from '../config/temporadasBase';
import type { ResolucionTemporadas } from '../logic/resolverTemporadas';
import { filasExportacion, leerListaTemporadas } from '../services/planillaTemporadas';
import { useTemporadasStore } from '../store/useTemporadasStore';

const lector = new LectorPlanillaXlsx();
const escritor = new EscritorPlanillaXlsx();

const BOTON =
  'inline-flex items-center gap-1.5 border border-ink px-3 py-[7px] text-[12.5px] text-ink hover:bg-ink hover:text-white disabled:opacity-40';

interface AccionesListaProps {
  readonly telas: readonly TelaAnalizada[];
  readonly resolucion: ResolucionTemporadas;
}

export function AccionesLista({ telas, resolucion }: AccionesListaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lista = useTemporadasStore((s) => s.lista);
  const nombreLista = useTemporadasStore((s) => s.nombreLista);
  const manuales = useTemporadasStore((s) => s.manuales);
  const cargarLista = useTemporadasStore((s) => s.cargarLista);
  const restablecer = useTemporadasStore((s) => s.restablecer);

  const correcciones = Object.keys(manuales).length;
  const entradas = (lista ?? TEMPORADAS_BASE).length;

  const exportar = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    escritor.descargar(`Temporadas de telas ${fecha}.xlsx`, [filasExportacion(telas, resolucion)]);
  };

  const cargar = async (archivo: File | undefined) => {
    if (!archivo) return;
    try {
      const leida = await leerListaTemporadas(await archivo.arrayBuffer(), lector);
      if (leida.entradas.length === 0) throw new Error('La planilla no trae ninguna tela con temporada reconocible.');
      if (
        correcciones > 0 &&
        !window.confirm(`Cargar "${archivo.name}" descarta las ${correcciones} correcciones manuales. ¿Seguir?`)
      ) {
        return;
      }
      cargarLista(leida.entradas, archivo.name);
      const extra = leida.descartadas.length > 0 ? ` (${leida.descartadas.length} filas sin temporada se ignoraron)` : '';
      toast.success(`Lista cargada: ${formatearEntero(leida.entradas.length)} telas${extra}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo leer la lista de temporadas.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const volverABase = () => {
    if (window.confirm('Se vuelve a la lista base y se descartan todas las correcciones manuales. ¿Seguir?')) {
      restablecer();
      toast.info('Lista de temporadas restablecida.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule pb-3 text-[12.5px] text-ink-2">
      <span>
        Lista: <b className="font-semibold text-ink">{nombreLista ?? 'base del sistema'}</b> ·{' '}
        {formatearEntero(entradas)} telas
        {correcciones > 0 && (
          <>
            {' '}
            · <b className="font-semibold text-ink">{formatearEntero(correcciones)}</b> corregida
            {correcciones === 1 ? '' : 's'} a mano
          </>
        )}
      </span>
      <span className="ml-auto flex flex-wrap gap-2">
        <button type="button" className={BOTON} onClick={exportar}>
          <Download className="size-4" /> Exportar Excel
        </button>
        <button type="button" className={BOTON} onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Cargar lista
        </button>
        <button type="button" className={BOTON} onClick={volverABase} disabled={!lista && correcciones === 0}>
          <RotateCcw className="size-4" /> Restablecer
        </button>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm,.xls"
        className="hidden"
        onChange={(e) => void cargar(e.target.files?.[0])}
      />
    </div>
  );
}
