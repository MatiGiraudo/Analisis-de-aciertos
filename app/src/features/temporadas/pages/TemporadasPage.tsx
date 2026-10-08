/**
 * Página "Temporadas": agrupa las telas en Verano / Invierno / Atemporal, permite
 * filtrarlas y corregir la temporada (de a una o varias juntas).
 *
 * Orquesta (no calcula reglas de negocio): filtros compartidos → `filtrarOrdenar`;
 * resumen por temporada → `resumirPorTemporada` (sin el filtro de temporada, para
 * que las tarjetas muestren todas); filas → `filasTemporadas`; edición →
 * `useTemporadasStore`. El filtro de temporada es el global: elegido acá, también
 * aplica en Lista, Telas, Tendencias, Ranking y Precios.
 */
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { filtrarOrdenar } from '@/features/aciertos/logic/filtrarOrdenar';
import { BarraFiltros } from '@/features/aciertos/ui/BarraFiltros';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { formatearEntero } from '@/shared/formato/numeros';
import { paginar } from '@/shared/logic/paginar';
import { ETIQUETA_TEMPORADA, TEMPORADAS } from '@/shared/tipos/temporada';
import type { Temporada } from '@/shared/tipos/temporada';
import { Paginacion } from '@/shared/ui/Paginacion';
import { Segmento } from '@/shared/ui/Segmento';
import { useResolucionTemporadas } from '../hooks/useTemporadas';
import { filasTemporadas } from '../logic/filasTemporadas';
import type { FilaTemporada, FiltroOrigen } from '../logic/filasTemporadas';
import { resumirPorTemporada } from '../logic/resumirPorTemporada';
import { useTemporadasStore } from '../store/useTemporadasStore';
import { AccionesLista } from '../ui/AccionesLista';
import { PendientesLista } from '../ui/PendientesLista';
import { TablaTemporadas } from '../ui/TablaTemporadas';
import { TarjetasTemporada } from '../ui/TarjetasTemporada';

const TELAS_POR_PAGINA = 50;
const ANCLA = 'tabla-temporadas';

const BOTON_LOTE = 'border border-white/60 px-2.5 py-1 text-[12.5px] hover:bg-white hover:text-ink';

export function TemporadasPage() {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const f = useFiltrosStore();
  const resolucion = useResolucionTemporadas();
  const asignar = useTemporadasStore((s) => s.asignar);
  const restaurar = useTemporadasStore((s) => s.restaurar);
  const [origen, setOrigen] = useState<FiltroOrigen>('');
  const [seleccion, setSeleccion] = useState<ReadonlySet<string>>(new Set());

  // Filtros compartidos (sin temporada): base de las tarjetas y de la tabla.
  const base = useMemo(
    () =>
      catalogo
        ? filtrarOrdenar(catalogo.telas, {
            q: f.q,
            unidad: f.unidad,
            subRubro: f.subRubro,
            rotacion: f.rotacion,
            recomendacion: null,
            orden: f.orden,
          })
        : [],
    [catalogo, f.q, f.unidad, f.subRubro, f.rotacion, f.orden],
  );
  const resumen = useMemo(
    () => resumirPorTemporada(base, (t) => resolucion.porTela.get(t)?.temporada ?? null),
    [base, resolucion],
  );
  const filas = useMemo(
    () => filasTemporadas(base, resolucion, f.temporada, origen),
    [base, resolucion, f.temporada, origen],
  );

  if (!catalogo) return null;

  const pagina = paginar(filas, f.paginaTemporadas, TELAS_POR_PAGINA);

  const cambio = (x: FilaTemporada, temporada: Temporada) => ({
    tela: x.tela.nombre,
    temporada,
    temporadaLista: x.asignacion.temporadaLista,
  });

  const seleccionadas = filas.filter((x) => seleccion.has(x.tela.nombre));
  const marcar = (telas: readonly string[], marcadas: boolean) =>
    setSeleccion((prev) => {
      const s = new Set(prev);
      for (const t of telas) {
        if (marcadas) s.add(t);
        else s.delete(t);
      }
      return s;
    });

  const asignarSeleccion = (temporada: Temporada) => {
    asignar(seleccionadas.map((x) => cambio(x, temporada)));
    toast.success(`${seleccionadas.length} telas → ${ETIQUETA_TEMPORADA[temporada]}.`);
    setSeleccion(new Set());
  };
  const restaurarSeleccion = () => {
    for (const x of seleccionadas) if (x.asignacion.origen === 'manual') restaurar(x.tela.nombre);
    setSeleccion(new Set());
  };

  return (
    <div>
      <TarjetasTemporada resumen={resumen} activa={f.temporada} onElegir={f.setTemporada} />

      <AccionesLista telas={catalogo.telas} resolucion={resolucion} />

      <div className="flex flex-wrap items-center gap-3 py-3">
        <Segmento
          opciones={[
            ['', 'Todas'],
            ['manual', 'Corregidas a mano'],
            ['alias', 'Por equivalencia'],
          ]}
          valor={origen}
          onChange={(v) => {
            setOrigen(v as FiltroOrigen);
            f.setPaginaTemporadas(1);
          }}
        />
        <p className="max-w-[62ch] text-[12.5px] text-ink-2">
          La temporada sale de la lista; si está mal, cambiala en la fila (o marcá varias y asignalas juntas). Las
          correcciones se guardan en este navegador: para llevarlas a otra PC, exportá el Excel y cargalo allá.
        </p>
      </div>

      <PendientesLista resolucion={resolucion} />

      <div id={ANCLA} className="scroll-mt-4">
        <BarraFiltros conteo={`${formatearEntero(filas.length)} telas`} />
      </div>

      {seleccionadas.length > 0 && (
        <div className="sticky top-0 z-[3] my-2 flex flex-wrap items-center gap-2 bg-ink px-3 py-2 text-[12.5px] text-white">
          <span className="mr-1 font-semibold">
            {formatearEntero(seleccionadas.length)} seleccionada{seleccionadas.length === 1 ? '' : 's'} →
          </span>
          {TEMPORADAS.map((t) => (
            <button key={t} type="button" className={BOTON_LOTE} onClick={() => asignarSeleccion(t)}>
              {ETIQUETA_TEMPORADA[t]}
            </button>
          ))}
          {seleccionadas.some((x) => x.asignacion.origen === 'manual') && (
            <button type="button" className={BOTON_LOTE} onClick={restaurarSeleccion}>
              Volver a la lista
            </button>
          )}
          <button type="button" className="ml-auto text-white/70 hover:text-white" onClick={() => setSeleccion(new Set())}>
            Limpiar selección
          </button>
        </div>
      )}

      {filas.length === 0 ? (
        <div className="px-2 py-11 text-center text-[14px] text-ink-3">Ninguna tela coincide con el filtro.</div>
      ) : (
        <TablaTemporadas
          filas={pagina.items}
          seleccion={seleccion}
          onSeleccionar={(t, m) => marcar([t], m)}
          onSeleccionarPagina={(m) => marcar(pagina.items.map((x) => x.tela.nombre), m)}
          onCambiar={(x, t) => asignar([cambio(x, t)])}
          onRestaurar={(x) => restaurar(x.tela.nombre)}
        />
      )}

      <Paginacion pagina={pagina} sustantivo="telas" onCambiar={f.setPaginaTemporadas} anclaId={ANCLA} />
    </div>
  );
}
