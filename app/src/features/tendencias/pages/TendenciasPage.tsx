/**
 * Página "Colores de tendencia": qué colores se venden más, a través de todas las
 * telas, y si tiran o frenan respecto de su peso en el stock.
 *
 * Orquesta: filtros compartidos (búsqueda, unidad, sub rubro) + orden y alcance
 * locales → `agruparPorColor` → tabla con acordeón de artículos por color.
 */
import { useMemo, useState } from 'react';
import { BarraFiltros } from '@/features/aciertos/ui/BarraFiltros';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import { formatearCobertura, formatearEntero, formatearPorcentaje } from '@/shared/formato/numeros';
import { Segmento } from '@/shared/ui/Segmento';
import { agruparPorColor, PARTICIPACION_RELEVANTE } from '../logic/agruparPorColor';
import type { AlcanceTendencia, ColorTendencia, OrdenTendencia } from '../logic/agruparPorColor';
import { UMBRAL_FRENA, UMBRAL_TIRA } from '../ui/IndiceTendencia';
import { TablaColores } from '../ui/TablaColores';

const LIMITE = 60;

export function TendenciasPage() {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const q = useFiltrosStore((s) => s.q);
  const unidad = useFiltrosStore((s) => s.unidad);
  const subRubro = useFiltrosStore((s) => s.subRubro);
  const [orden, setOrden] = useState<OrdenTendencia>('ventas');
  const [alcance, setAlcance] = useState<AlcanceTendencia>('relevantes');
  const [limite, setLimite] = useState(LIMITE);
  const [abiertos, setAbiertos] = useState<ReadonlySet<string>>(new Set());

  const filas = useMemo(
    () => agruparPorColor(catalogo?.articulos ?? [], { q, unidad, subRubro, orden, alcance }),
    [catalogo, q, unidad, subRubro, orden, alcance],
  );

  if (!catalogo) return null;

  const mostradas = filas.slice(0, limite);
  const restantes = filas.length - mostradas.length;
  const clave = (c: ColorTendencia) => `${c.color}|${c.unidad}`;
  const alternar = (c: ColorTendencia) =>
    setAbiertos((prev) => {
      const s = new Set(prev);
      if (!s.delete(clave(c))) s.add(clave(c));
      return s;
    });

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3 border-b border-rule py-4">
        <Segmento
          opciones={[
            ['ventas', 'Más vendidos'],
            ['indice', 'Mayor índice'],
            ['st', 'Mejor sell-through'],
            ['stock', 'Más stock'],
          ]}
          valor={orden}
          onChange={(v) => {
            setOrden(v as OrdenTendencia);
            setLimite(LIMITE);
          }}
        />
        <Segmento
          opciones={[
            ['relevantes', `≥ ${formatearPorcentaje(PARTICIPACION_RELEVANTE)} de ventas`],
            ['conVentas', 'Con ventas'],
            ['todos', 'Todos'],
          ]}
          valor={alcance}
          onChange={(v) => {
            setAlcance(v as AlcanceTendencia);
            setLimite(LIMITE);
          }}
        />
        <p className="max-w-[60ch] text-[12.5px] text-ink-2">
          Colores sumados a través de todas las telas, separados por unidad. El <b>índice</b> divide
          el peso del color en las ventas por su peso en el stock disponible: ▲ tira (≥{' '}
          {formatearCobertura(UMBRAL_TIRA)}), ▼ frena (≤ {formatearCobertura(UMBRAL_FRENA)}). Abrí un color
          para ver en qué telas se vende.
        </p>
      </div>

      <div className="my-3">
        <BarraFiltros
          mostrarOrden={false}
          mostrarRotacion={false}
          placeholder="Buscar color o tela…"
          conteo={`${formatearEntero(mostradas.length)} de ${formatearEntero(filas.length)} colores`}
        />
      </div>

      {filas.length === 0 ? (
        <div className="px-2 py-11 text-center text-[14px] text-ink-3">Ningún color coincide con el filtro.</div>
      ) : (
        <TablaColores filas={mostradas} estaAbierta={(c) => abiertos.has(clave(c))} onAlternar={alternar} />
      )}

      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setLimite((l) => l + LIMITE)}
          className="mt-4 block w-full border border-dashed border-rule bg-panel p-3 text-[13px] text-ink-2 hover:border-ink hover:text-ink"
        >
          Ver {formatearEntero(Math.min(LIMITE, restantes))} colores más ({formatearEntero(restantes)} restantes)
        </button>
      )}
    </div>
  );
}
