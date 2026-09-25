/**
 * Zona de carga del Excel (drag & drop + selección manual).
 *
 * Acepta varios archivos a la vez (p. ej. el libro del período + "Stock al 5-8.xlsx");
 * sus hojas se unen. Conecta la UI con `useCatalogoStore.cargarDesdeArchivos`,
 * da feedback con Toastify y muestra el estado de carga/error. No parsea nada
 * por sí misma (SRP): solo entrega los `File` al store.
 */
import { useCallback, useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';

const EXTENSIONES_VALIDAS = ['.xlsx', '.xlsm', '.xls'];

export function ExcelDropzone() {
  const cargarDesdeArchivos = useCatalogoStore((s) => s.cargarDesdeArchivos);
  const estado = useCatalogoStore((s) => s.estado);
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const procesar = useCallback(
    async (lista: FileList | null | undefined) => {
      const archivos = Array.from(lista ?? []);
      if (archivos.length === 0) return;
      const invalidos = archivos.filter(
        (a) => !EXTENSIONES_VALIDAS.some((ext) => a.name.toLowerCase().endsWith(ext)),
      );
      if (invalidos.length > 0) {
        toast.error(`Solo se aceptan Excel (.xlsx): ${invalidos.map((a) => a.name).join(', ')}.`);
        return;
      }
      try {
        await cargarDesdeArchivos(archivos);
        toast.success(archivos.length === 1 ? `"${archivos[0].name}" procesado.` : `${archivos.length} archivos procesados.`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo procesar el archivo.');
      }
    },
    [cargarDesdeArchivos],
  );

  const cargando = estado === 'cargando';

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        void procesar(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-12 text-center transition-colors ${arrastrando ? 'border-ink bg-panel' : 'border-rule bg-panel/60'
        }`}
    >
      {cargando ? (
        <Loader2 className="size-8 animate-spin text-ink-3" />
      ) : (
        <FileSpreadsheet className="size-8 text-ink-3" />
      )}
      <div className="text-ink-2">
        <p className="text-[15px] font-medium text-ink">Arrastrá los Excel del ERP acá</p>
        <p className="text-[12.5px]">
          Stock inicial y actual (por artículo o por tela), compras y ventas (OFI / INTER / PESOS /
          BLUE). Podés soltar varios archivos juntos.
        </p>
      </div>
      <button
        type="button"
        disabled={cargando}
        onClick={() => inputRef.current?.click()}
        className="mt-1 inline-flex items-center gap-2 border border-ink px-4 py-2 text-[13px] text-ink hover:bg-ink hover:text-white disabled:opacity-50"
      >
        <Upload className="size-4" />
        {cargando ? 'Procesando…' : 'Elegir archivos'}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={EXTENSIONES_VALIDAS.join(',')}
        className="hidden"
        onChange={(e) => void procesar(e.target.files)}
      />
    </div>
  );
}
