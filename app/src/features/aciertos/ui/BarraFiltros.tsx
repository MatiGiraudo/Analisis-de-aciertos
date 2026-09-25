/**
 * Barra de filtros compartida: búsqueda, unidad, sub rubro, rotación y orden.
 * Escribe en `useFiltrosStore`. Los selectores de orden y rotación se ocultan
 * donde no aplican.
 */
import { Search } from 'lucide-react';
import { ETIQUETA_ROTACION } from '@/features/catalogo/logic/rotacion';
import type { Rotacion } from '@/features/catalogo/model/tipos';
import { useFiltrosStore } from '@/features/catalogo/store/useFiltrosStore';
import type { OrdenTabla } from '@/features/catalogo/store/useFiltrosStore';
import type { SubRubro, Unidad } from '@/shared/tipos/unidad';

const ORDENES: { valor: OrdenTabla; texto: string }[] = [
  { valor: 'ven', texto: 'Más vendidas' },
  { valor: 'hoy', texto: 'Más stock parado' },
  { valor: 'com', texto: 'Más compradas' },
  { valor: 'ini', texto: 'Más stock inicial' },
  { valor: 'st', texto: 'Mejor sell-through' },
  { valor: 'st_asc', texto: 'Peor sell-through' },
  { valor: 'cob', texto: 'Mayor cobertura' },
  { valor: 'name', texto: 'Alfabético' },
];

const CLASE_SELECT =
  'border border-rule bg-panel px-[10px] py-2 text-[13px] text-ink focus:outline-2 focus:outline-rec-mantener';

interface BarraFiltrosProps {
  readonly mostrarOrden?: boolean;
  readonly mostrarRotacion?: boolean;
  readonly conteo?: string;
  readonly placeholder?: string;
}

export function BarraFiltros({
  mostrarOrden = true,
  mostrarRotacion = true,
  conteo,
  placeholder = 'Buscar tela, color o código…',
}: BarraFiltrosProps) {
  const f = useFiltrosStore();

  return (
    <div className="mb-[6px] flex flex-wrap items-center gap-[10px] border-b border-rule pb-[14px]">
      <label className="relative flex min-w-[170px] flex-1 items-center">
        <Search className="pointer-events-none absolute left-2 size-4 text-ink-3" />
        <input
          type="search"
          value={f.q}
          onChange={(e) => f.setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className="w-full border border-rule bg-panel py-2 pl-8 pr-[10px] text-[13px] text-ink focus:outline-2 focus:outline-rec-mantener"
        />
      </label>

      <select
        aria-label="Unidad"
        className={CLASE_SELECT}
        value={f.unidad}
        onChange={(e) => f.setUnidad(e.target.value as Unidad | '')}
      >
        <option value="">MTS y KGS</option>
        <option value="KGS">Solo KGS</option>
        <option value="MTS">Solo MTS</option>
      </select>

      <select
        aria-label="Sub rubro"
        className={CLASE_SELECT}
        value={f.subRubro}
        onChange={(e) => f.setSubRubro(e.target.value as SubRubro | '')}
      >
        <option value="">Punto y plano</option>
        <option value="PUNTO">Solo punto</option>
        <option value="PLANO">Solo plano</option>
      </select>

      {mostrarRotacion && (
        <select
          aria-label="Rotación"
          className={CLASE_SELECT}
          value={f.rotacion}
          onChange={(e) => f.setRotacion(e.target.value as Rotacion | '')}
        >
          <option value="">Toda rotación</option>
          {(['A', 'M', 'B', 'N'] as Rotacion[]).map((r) => (
            <option key={r} value={r}>
              {ETIQUETA_ROTACION[r]}
            </option>
          ))}
        </select>
      )}

      {mostrarOrden && (
        <select
          aria-label="Ordenar por"
          className={CLASE_SELECT}
          value={f.orden === 'st_asc' ? 'st_asc' : f.orden}
          onChange={(e) => f.setOrden(e.target.value as OrdenTabla)}
        >
          {ORDENES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      )}

      {conteo && <span className="ml-auto whitespace-nowrap text-[12px] text-ink-3">{conteo}</span>}
    </div>
  );
}
