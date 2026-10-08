/**
 * Layout raíz: encabezado editorial, hero de rollos, navegación por pestañas y
 * el <Outlet> de la vista activa. Cuando no hay catálogo cargado, muestra la
 * zona de carga del Excel en lugar de las vistas.
 */
import { NavLink, Outlet } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { HeroRollos } from '@/features/aciertos/ui/HeroRollos';
import { AvisosDatos } from '@/features/ingesta-excel/ui/AvisosDatos';
import { ExcelDropzone } from '@/features/ingesta-excel/ui/ExcelDropzone';
import { useCatalogoStore } from '@/features/catalogo/store/useCatalogoStore';
import { formatearEntero } from '@/shared/formato/numeros';

const CLASE_TAB = 'border-r border-ink px-[15px] py-2 text-[13px] last:border-r-0';
const claseTab = ({ isActive }: { isActive: boolean }) =>
  `${CLASE_TAB} ${isActive ? 'bg-ink text-white' : 'text-ink hover:bg-panel'}`;

export function Layout() {
  const catalogo = useCatalogoStore((s) => s.catalogo);
  const nombreArchivo = useCatalogoStore((s) => s.nombreArchivo);
  const reiniciar = useCatalogoStore((s) => s.reiniciar);

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-[72px]">
      <header className="mb-7 border-b-[1.5px] border-ink">
        <div className="flex flex-wrap items-baseline gap-x-[18px] gap-y-[10px] pb-[6px] pt-[18px] text-[11px] uppercase tracking-[0.14em] text-ink-3">
          <span>
            <b className="font-semibold text-ink">Tela 770 SRL</b> · Rubro Telas
          </span>
          {catalogo && (
            <span>
              Ventana {catalogo.ventana.desde} → {catalogo.ventana.hasta}
            </span>
          )}
          <span>Todo en unidades · KGS y MTS no se suman</span>
          {nombreArchivo && (
            <button
              type="button"
              onClick={reiniciar}
              className="ml-auto inline-flex items-center gap-1.5 normal-case tracking-normal text-ink-3 hover:text-ink"
              title="Cargar otros archivos"
            >
              <RotateCcw className="size-3.5" />
              {nombreArchivo}
            </button>
          )}
        </div>
        <h1 className="my-1 font-disp text-[clamp(38px,7.2vw,74px)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em]">
          Aciertos
          <br />
          de compra
        </h1>
        <p className="mb-5 max-w-[60ch] text-[15px] text-ink-2">
          Qué tan bien se compró cada tela: cuánto de lo que entró se movió, cuánto quedó en el
          depósito y cuántas temporadas de stock representa. Tocá una tela para desplegar sus colores.
        </p>
      </header>

      {!catalogo ? (
        <ExcelDropzone />
      ) : (
        <>
          <AvisosDatos avisos={catalogo.avisos} />
          <HeroRollos telas={catalogo.telas} />

          <nav className="mb-4 flex flex-wrap gap-y-2">
            <div className="flex border border-ink">
              <NavLink to="/" end className={claseTab}>
                Lista de {formatearEntero(catalogo.lista.length)}
              </NavLink>
              <NavLink to="/telas" className={claseTab}>
                Telas y colores
              </NavLink>
              <NavLink to="/temporadas" className={claseTab}>
                Temporadas
              </NavLink>
              <NavLink to="/tendencias" className={claseTab}>
                Colores de tendencia
              </NavLink>
              <NavLink to="/ranking" className={claseTab}>
                Ranking
              </NavLink>
              <NavLink to="/precios" className={claseTab}>
                Precios
              </NavLink>
            </div>
          </nav>

          <Outlet />
        </>
      )}
    </div>
  );
}
