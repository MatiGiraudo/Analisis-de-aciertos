/**
 * Página de Ranking: "Reponer ya" vs "Plata parada", por TELA.
 *
 * Une catálogo + filtros con la lógica pura `rankearTelas`. Cada tela muestra su
 * puntaje 0–100 y se despliega (acordeón) para ver sus colores rankeados. Si la
 * búsqueda coincide con un color y no con el nombre de la tela, la tela se abre sola.
 */
import { useMemo, useState } from 'react';
import { rankearTelas, EXPLICACION_RANKING } from '../logic/rankear';
import { FilaRankingTela } from '../ui/FilaRankingTela';
import { BarraFiltros } from '@/features/aciertos/ui/BarraFiltros';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { formatearEntero } from '@/shared/formato/numeros';
import { paginar } from '@/shared/logic/paginar';
import { Paginacion } from '@/shared/ui/Paginacion';
import { Segmento } from '@/shared/ui/Segmento';

const TELAS_POR_PAGINA = 25;
const ANCLA = 'lista-ranking';

export function RankingPage() {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const f = useFiltrosStore();
  /** Estado explícito del acordeón por tela; lo no tocado usa la apertura automática. */
  const [abiertas, setAbiertas] = useState<ReadonlyMap<string, boolean>>(new Map());

  const filas = useMemo(() => {
    if (!catalogo) return [];
    return rankearTelas(catalogo.telas, catalogo.articulos, {
      modo: f.modoRanking,
      alcance: f.alcanceRanking,
      q: f.q,
      unidad: f.unidad,
      subRubro: f.subRubro,
      rotacion: f.rotacion,
    });
  }, [catalogo, f.modoRanking, f.alcanceRanking, f.q, f.unidad, f.subRubro, f.rotacion]);

  if (!catalogo) return null;

  const pagina = paginar(filas, f.paginaRanking, TELAS_POR_PAGINA);

  const q = f.q.trim().toLowerCase();
  const estaAbierta = (nombre: string) => abiertas.get(nombre) ?? (!!q && !nombre.toLowerCase().includes(q));
  const alternar = (nombre: string) => setAbiertas((prev) => new Map(prev).set(nombre, !estaAbierta(nombre)));

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 border-b border-rule py-4">
        <Segmento
          opciones={[
            ['repo', 'Reponer ya'],
            ['dead', 'Plata parada'],
          ]}
          valor={f.modoRanking}
          onChange={(v) => f.setModoRanking(v as 'repo' | 'dead')}
        />
        <Segmento
          opciones={[
            ['all', 'Todos'],
            ['list', 'Lista de 49'],
          ]}
          valor={f.alcanceRanking}
          onChange={(v) => f.setAlcanceRanking(v as 'all' | 'list')}
        />
        <p className="max-w-[56ch] text-[12.5px] text-ink-2">{EXPLICACION_RANKING[f.modoRanking]}</p>
      </div>

      <div id={ANCLA} className="my-3 scroll-mt-4">
        <BarraFiltros
          mostrarOrden={false}
          conteo={`${formatearEntero(filas.length)} telas`}
        />
      </div>

      {filas.length === 0 ? (
        <div className="px-2 py-11 text-center text-[14px] text-ink-3">Ninguna tela coincide con el filtro.</div>
      ) : (
        <ol className="m-0 list-none p-0">
          {pagina.items.map((item, i) => (
            <FilaRankingTela
              key={item.tela.nombre}
              item={item}
              posicion={pagina.desde + i}
              modo={f.modoRanking}
              abierta={estaAbierta(item.tela.nombre)}
              onAlternar={() => alternar(item.tela.nombre)}
            />
          ))}
        </ol>
      )}

      <Paginacion pagina={pagina} sustantivo="telas" onCambiar={f.setPaginaRanking} anclaId={ANCLA} />
    </div>
  );
}
