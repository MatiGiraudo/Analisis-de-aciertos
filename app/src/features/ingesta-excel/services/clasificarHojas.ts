/**
 * Clasifica las hojas cargadas por el ROL que cumplen en el análisis.
 *
 * SRP: solo decide "qué es cada hoja"; no parsea filas. El TIPO de export
 * (ventas / compras / stock por artículo / stock por tela) sale del contenido
 * (`detectarTipoHoja`); lo que el contenido no dice —la moneda de una hoja de
 * ventas o si una foto de stock es la inicial o la actual— sale del nombre de
 * la hoja y, si ese es genérico ("Hoja2"), del nombre del archivo.
 */
import { Moneda } from '@/shared/tipos/moneda';
import type { HojaCruda, PlanillaCruda } from '../model/planilla';
import { detectarTipoHoja, normalizar } from './parsearErp';

/** Rol de una foto de stock según su nombre. */
export type RolStock = 'inicial' | 'actual' | 'indefinido';

/** Fecha día/mes extraída del nombre ("Stock al 5-8" → 5/8). */
export interface FechaDiaMes {
  readonly dia: number;
  readonly mes: number;
}

/** Una foto de stock candidata, antes de resolver cuál es la inicial y cuál la actual. */
export interface HojaStock {
  readonly hoja: HojaCruda;
  readonly nivel: 'articulo' | 'tela';
  readonly rol: RolStock;
  readonly fecha?: FechaDiaMes;
}

export interface HojaVentas {
  readonly hoja: HojaCruda;
  readonly moneda: Moneda;
}

export interface HojasClasificadas {
  readonly stocks: readonly HojaStock[];
  readonly compras: readonly HojaCruda[];
  readonly ventas: readonly HojaVentas[];
  /** Hojas que no se pudieron usar, con el motivo (para avisar al usuario). */
  readonly ignoradas: readonly string[];
}

/** Palabras clave de moneda, en orden de prioridad. */
const MONEDA_POR_CLAVE: readonly [RegExp, Moneda][] = [
  [/\bblue\b/, Moneda.Blue],
  [/\bofi/, Moneda.Oficial],
  [/\binter/, Moneda.Intermedio],
  [/\bpeso/, Moneda.Pesos],
];

export function clasificarHojas(planilla: PlanillaCruda): HojasClasificadas {
  const stocks: HojaStock[] = [];
  const compras: HojaCruda[] = [];
  const ventas: HojaVentas[] = [];
  const ignoradas: string[] = [];

  for (const hoja of planilla.hojas) {
    if (hoja.nombre.toLowerCase().includes('filterdatabase')) continue;
    const tipo = detectarTipoHoja(hoja);

    switch (tipo) {
      case 'ventas': {
        const moneda = detectarMoneda(hoja);
        if (moneda === undefined) ignoradas.push(`${etiquetaHoja(hoja)}: ventas sin moneda reconocible en el nombre`);
        else ventas.push({ hoja, moneda });
        break;
      }
      case 'compras':
        compras.push(hoja);
        break;
      case 'stock-articulo':
      case 'stock-tela':
        stocks.push({
          hoja,
          nivel: tipo === 'stock-articulo' ? 'articulo' : 'tela',
          rol: detectarRol(hoja),
          fecha: detectarFecha(hoja),
        });
        break;
      default:
        if (hoja.filas.length > 0) ignoradas.push(`${etiquetaHoja(hoja)}: formato no reconocido`);
    }
  }

  return { stocks, compras, ventas, ignoradas };
}

/** "archivo / hoja" para mensajes al usuario. */
export function etiquetaHoja(hoja: HojaCruda): string {
  return hoja.archivo ? `${hoja.archivo} / ${hoja.nombre}` : hoja.nombre;
}

/* ------------------------------------------------------------------ */
/* Pistas por nombre (hoja primero, archivo después)                    */
/* ------------------------------------------------------------------ */

function nombres(hoja: HojaCruda): string[] {
  return [hoja.nombre, hoja.archivo ?? ''].map((n) => normalizar(n)).filter(Boolean);
}

function detectarMoneda(hoja: HojaCruda): Moneda | undefined {
  for (const n of nombres(hoja)) {
    const hit = MONEDA_POR_CLAVE.find(([re]) => re.test(n));
    if (hit) return hit[1];
  }
  return undefined;
}

function detectarRol(hoja: HojaCruda): RolStock {
  for (const n of nombres(hoja)) {
    if (/inicial|30\s*[-/]?\s*09|3009/.test(n)) return 'inicial';
    if (/\bhoy\b|actual/.test(n)) return 'actual';
    if (detectarFechaEn(n)) return 'indefinido'; // tiene fecha: el nombre es informativo
  }
  return 'indefinido';
}

function detectarFecha(hoja: HojaCruda): FechaDiaMes | undefined {
  for (const n of nombres(hoja)) {
    const f = detectarFechaEn(n);
    if (f) return f;
  }
  return undefined;
}

/** Reconoce "5-8", "05/08", "30-09" y el pegado "3009". */
export function detectarFechaEn(texto: string): FechaDiaMes | undefined {
  const m = /(?:^|\D)(\d{1,2})\s*[-/]\s*(\d{1,2})(?!\d)/.exec(texto) ?? /(?:^|\D)(\d{2})(\d{2})(?!\d)/.exec(texto);
  if (!m) return undefined;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  return dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 ? { dia, mes } : undefined;
}
