/**
 * Página de aciertos por tela, para la Lista de 49 o para todas las telas.
 * Cada tela se despliega (acordeón) y muestra sus colores: reemplaza a la antigua
 * vista "Artículos" y al drill-down tela → artículos.
 *
 * Orquesta (no calcula reglas de negocio): elige el dataset, aplica
 * `telasConColores`, pagina y maneja el estado del acordeón. Si la búsqueda
 * encuentra una tela por un color, la tela se abre sola.
 */
import { useMemo, useState } from 'react';
import { ChipsRecomendacion } from '../ui/ChipsRecomendacion';
import { BarraFiltros } from '../ui/BarraFiltros';
import { TablaAciertos } from '../ui/TablaAciertos';
import { indexarColores, telasConColores } from '../logic/telasConColores';
import type { TelaConColores } from '../logic/telasConColores';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { formatearEntero } from '@/shared/formato/numeros';

export type FuenteAciertos = 'lista' | 'telas';

interface VistaAciertosProps {
  readonly fuente: FuenteAciertos;
}

export function VistaAciertos({ fuente }: VistaAciertosProps) {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const f = useFiltrosStore();
  /** Estado explícito del acordeón por tela; lo no tocado usa la apertura automática. */
  const [abiertas, setAbiertas] = useState<ReadonlyMap<string, boolean>>(new Map());

  const telas = useMemo(() => {
    if (!catalogo) return [];
    return fuente === 'lista' ? catalogo.lista : catalogo.telas;
  }, [catalogo, fuente]);
  const coloresPorTela = useMemo(() => indexarColores(catalogo?.articulos ?? []), [catalogo]);

  const criterios = {
    q: f.q,
    unidad: f.unidad,
    subRubro: f.subRubro,
    rotacion: f.rotacion,
    recomendacion: f.recomendacion,
    orden: f.orden,
  };

  // Base para los chips: mismos filtros, sin el de recomendación.
  const baseChips = useMemo(
    () => telasConColores(telas, coloresPorTela, { ...criterios, recomendacion: null }).map((x) => x.tela),
    [telas, coloresPorTela, criterios],
  );
  const filas = useMemo(() => telasConColores(telas, coloresPorTela, criterios), [telas, coloresPorTela, criterios]);

  if (!catalogo) return null;

  const mostradas = filas.slice(0, f.limiteTabla);
  const restantes = filas.length - mostradas.length;
  const coloresVisibles = filas.reduce((s, x) => s + x.colores.length, 0);

  const estaAbierta = (x: TelaConColores) => abiertas.get(x.tela.nombre) ?? x.porColor;
  const alternar = (x: TelaConColores) => setAbiertas((prev) => new Map(prev).set(x.tela.nombre, !estaAbierta(x)));

  const conteo = `${formatearEntero(mostradas.length)} de ${formatearEntero(filas.length)} telas · ${formatearEntero(coloresVisibles)} colores`;

  return (
    <div>
      <ChipsRecomendacion filas={baseChips} />
      <BarraFiltros conteo={conteo} />

      {filas.length === 0 ? (
        <div className="px-2 py-11 text-center text-[14px] text-ink-3">Ninguna tela coincide con el filtro.</div>
      ) : (
        <TablaAciertos filas={mostradas} estaAbierta={estaAbierta} onAlternar={alternar} />
      )}

      {restantes > 0 && (
        <button
          type="button"
          onClick={f.verMasTabla}
          className="mt-4 block w-full border border-dashed border-rule bg-panel p-3 text-[13px] text-ink-2 hover:border-ink hover:text-ink"
        >
          Ver {formatearEntero(Math.min(200, restantes))} telas más ({formatearEntero(restantes)} restantes)
        </button>
      )}
    </div>
  );
}
