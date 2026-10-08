/**
 * Página "Salvedades": todas las salvedades de datos de la ingesta y el detalle de
 * las telas que no cierran `inicial + compras − ventas = hoy`, con los artículos
 * que explican cada diferencia.
 *
 * Orquesta (no calcula): filtros compartidos (unidad, sub rubro, temporada,
 * búsqueda) → `filtrarOrdenar` → `detallarDescuadres` → tabla paginada. Exporta el
 * detalle a Excel con `EscritorPlanilla`.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { filtrarOrdenar } from '@/features/aciertos/logic/filtrarOrdenar';
import { BarraFiltros } from '@/features/aciertos/ui/BarraFiltros';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { EscritorPlanillaXlsx } from '@/features/ingesta-excel/services/EscritorPlanillaXlsx';
import { useCatalogoPorTemporada } from '@/features/temporadas/hooks/useTemporadas';
import { formatearEntero } from '@/shared/formato/numeros';
import { paginar } from '@/shared/logic/paginar';
import type { Unidad } from '@/shared/tipos/unidad';
import { Paginacion } from '@/shared/ui/Paginacion';
import { Segmento } from '@/shared/ui/Segmento';
import { detallarDescuadres } from '../logic/detallarDescuadres';
import type { SentidoDescuadre } from '../logic/detallarDescuadres';
import { hojaDescuadres } from '../logic/exportarDescuadres';
import { TablaDescuadres } from '../ui/TablaDescuadres';

const TELAS_POR_PAGINA = 30;
const ANCLA = 'tabla-descuadres';
const UNIDADES: readonly Unidad[] = ['KGS', 'MTS'];
const escritor = new EscritorPlanillaXlsx();

export function SalvedadesPage() {
  const catalogo = useCatalogoPorTemporada();
  const f = useFiltrosStore();
  const [sentido, setSentido] = useState<SentidoDescuadre | ''>('');
  const [pagina, setPagina] = useState(1);
  const [abiertas, setAbiertas] = useState<ReadonlySet<string>>(new Set());

  const filas = useMemo(() => {
    if (!catalogo) return [];
    const telas = filtrarOrdenar(catalogo.telas, {
      q: '',
      unidad: f.unidad,
      subRubro: f.subRubro,
      rotacion: '',
      recomendacion: null,
      orden: 'name',
    });
    return detallarDescuadres(telas, catalogo.articulos, { q: f.q, sentido });
  }, [catalogo, f.unidad, f.subRubro, f.q, sentido]);

  if (!catalogo) return null;

  const pag = paginar(filas, pagina, TELAS_POR_PAGINA);
  const alternar = (tela: string) =>
    setAbiertas((prev) => {
      const s = new Set(prev);
      if (!s.delete(tela)) s.add(tela);
      return s;
    });

  const totales = UNIDADES.map((unidad) => {
    const us = filas.filter((x) => x.tela.unidad === unidad);
    const suma = (signo: 1 | -1) =>
      us.reduce((s, x) => s + (Math.sign(x.diferencia) === signo ? Math.abs(x.diferencia) : 0), 0);
    return { unidad, telas: us.length, falta: suma(-1), sobra: suma(1) };
  }).filter((t) => t.telas > 0);

  const exportar = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    escritor.descargar(`Salvedades ${catalogo.ventana.desde} a ${catalogo.ventana.hasta} (${fecha}).xlsx`, [
      hojaDescuadres(filas),
    ]);
  };

  return (
    <div>
      {catalogo.avisos.length > 0 && (
        <section className="mt-4 border border-rule bg-panel/60 px-4 py-3 text-[13px] text-ink-2">
          <h2 className="mb-1.5 flex items-center gap-2 font-medium text-ink">
            <AlertTriangle className="size-4 text-rec-reducir" /> Salvedades de los archivos cargados
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            {catalogo.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-start gap-3 border-b border-rule py-4">
        <Segmento
          opciones={[
            ['', 'Todas'],
            ['falta', 'Falta stock'],
            ['sobra', 'Sobra stock'],
          ]}
          valor={sentido}
          onChange={(v) => {
            setSentido(v as SentidoDescuadre | '');
            setPagina(1);
          }}
        />
        <p className="max-w-[64ch] text-[12.5px] text-ink-2">
          Telas donde <b>inicial + compras − ventas</b> no da el <b>stock de hoy</b>. Abrí una tela para ver qué
          artículos lo explican. <span className="text-rec-liquidar">Negativo</span>: salió stock que no figura como
          venta. <span className="text-rec-aumentar">Positivo</span>: entró stock que no figura como compra.
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={filas.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 border border-ink px-3 py-[7px] text-[12.5px] text-ink hover:bg-ink hover:text-white disabled:opacity-40"
        >
          <Download className="size-4" /> Exportar Excel
        </button>
      </div>

      {totales.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 py-3 text-[12.5px] text-ink-2">
          {totales.map((t) => (
            <span key={t.unidad}>
              <b className="text-ink">{t.unidad}</b>: {formatearEntero(t.telas)} telas · faltan{' '}
              <b className="tabular text-rec-liquidar">{formatearEntero(t.falta)}</b> · sobran{' '}
              <b className="tabular text-rec-aumentar">{formatearEntero(t.sobra)}</b>
            </span>
          ))}
        </div>
      )}

      <div id={ANCLA} className="scroll-mt-4">
        <BarraFiltros
          mostrarOrden={false}
          mostrarRotacion={false}
          placeholder="Buscar tela, color o código…"
          conteo={`${formatearEntero(filas.length)} telas`}
        />
      </div>

      {filas.length === 0 ? (
        <div className="px-2 py-11 text-center text-[14px] text-ink-3">Ninguna tela con descuadre coincide con el filtro.</div>
      ) : (
        <TablaDescuadres filas={pag.items} estaAbierta={(t) => abiertas.has(t)} onAlternar={alternar} />
      )}

      <Paginacion pagina={pag} sustantivo="telas" onCambiar={setPagina} anclaId={ANCLA} />
    </div>
  );
}
