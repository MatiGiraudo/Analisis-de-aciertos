/**
 * Extrae el COLOR de la descripción de un artículo.
 *
 * El ERP arma la descripción como "<grupo> <color> (E)", con variantes:
 *   "RIB ONIX ROSA BB (E)"                   → ROSA BB
 *   "BRODERY PLANO dsn 6 OFF WHITE (E)"      → OFF WHITE   (grupo "BRODERY PLANO dsn 6")
 *   "BRODERY PLANO dsn 1 NEGRO (E)"          → NEGRO       (grupo "BRODERY PLANO": se salta "dsn 1")
 *   "MORLEY EST 2525 (E)" / "BIFAZ DSN 30"   → ''          (estampado sin color: solo código de diseño)
 *   "... vte 3 NEGRO"                        → NEGRO       (se descarta la variante)
 * Devuelve '' cuando la descripción no nombra un color. Función pura.
 */
import { normalizarNombreTela } from '@/features/ingesta-excel/config/listaDestacada';

const SUFIJO_ORIGEN = /\s*\((E|VJ)\)\s*$/;

export function extraerColor(descripcion: string, grupoErp: string, tela: string): string {
  let d = normalizarNombreTela(descripcion).replace(SUFIJO_ORIGEN, '');

  // Quitar el prefijo más largo que coincida: grupo del ERP o tela unificada.
  const prefijos = [grupoErp, tela]
    .map(normalizarNombreTela)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  for (const p of prefijos) {
    if (d === p) return '';
    if (d.startsWith(`${p} `)) {
      d = d.slice(p.length + 1);
      break;
    }
  }

  d = d
    .replace(/^DSN\s+\S+\s*/, '') // "dsn 1 NEGRO" → "NEGRO"
    .replace(/\bVTE\s+\d+\b/g, '') // variante numerada
    .replace(/^VTE\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Sin letras o con marca de diseño: es un código de estampado, no un color.
  if (!/[A-ZÑ]/.test(d) || /\bDSN\b/.test(d) || /^\d+$/.test(d)) return '';
  return d;
}
