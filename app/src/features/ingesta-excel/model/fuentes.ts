/**
 * Fuentes del ERP ya parseadas y con su rol resuelto: la entrada de
 * `construirCatalogo`.
 *
 * Cada foto de stock puede venir por ARTÍCULO (dato fino) o por TELA (el ERP
 * agrupa por "Grupo Artículo"); las compras pueden faltar. `construirCatalogo`
 * usa el dato medido cuando existe y deriva el resto por identidad contable.
 */
import type { Moneda } from '@/shared/tipos/moneda';
import type { FilaCompra, FilaStockArticulo, FilaStockTela, FilaVenta } from '../services/parsearErp';

export type FotoStock =
  | { readonly nivel: 'articulo'; readonly filas: readonly FilaStockArticulo[] }
  | { readonly nivel: 'tela'; readonly filas: readonly FilaStockTela[] };

export interface VentasMoneda {
  readonly moneda: Moneda;
  readonly filas: readonly FilaVenta[];
}

export interface FuentesErp {
  /** Foto al inicio de la ventana. Opcional: si falta se reconstruye. */
  readonly stockInicial?: FotoStock;
  /** Foto al cierre de la ventana (hoy). Obligatoria. */
  readonly stockActual: FotoStock;
  /** Compras reales por artículo. Si faltan, se derivan por identidad. */
  readonly compras?: readonly FilaCompra[];
  readonly ventas: readonly VentasMoneda[];
}
