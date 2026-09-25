/**
 * Unificación de artículos en TELAS.
 *
 * El ERP arma un "Grupo Artículo" por diseño ("BRODERY PLANO dsn 4",
 * "POPLIN EST 2302", "MORLEY 2327"), así que una misma tela aparece partida en
 * decenas de grupos. Para decidir compras se necesita la tela. Reglas:
 *  1. Se quita del grupo el sufijo de diseño:
 *       "X dsn …"        → X, estampado
 *       "X EST 1234"     → "X EST" (familia estampada con nombre propio; también "EST V51")
 *       "X 2327", "X 14", "X A57" → X, estampado (código de diseño suelto)
 *     No se tocan números que son parte de la tela: "JERSEY TUBULAR 24-1",
 *     "BATISTA 90/10", "CHAUD 1RA", "4 WAY".
 *     También es estampado un artículo cuya descripción dice "dsn".
 *  2. Si la tela base tiene artículos lisos, los estampados van a "X DSN"
 *     (MODAL SOFT vs MODAL SOFT DSN, como en la Lista de 49). Si todo es
 *     estampado, queda "X" (BRODERY PLANO). Si la lista de referencia usa
 *     "X DSN", se respeta ese nombre.
 *  3. Fusiones aprobadas (config): renombran la tela resultante por nombre
 *     exacto o prefijo ("POPLIN EST" → "POPLIN DSN", "MORLEY EST ZIGGY" → "MORLEY DSN").
 *  4. Artículos sin grupo: se asignan a la tela conocida más larga que prefija
 *     su descripción (con alias del ERP); si no hay, la descripción limpia.
 *
 * Se modela como interfaz (OCP/DIP): se puede cambiar el criterio sin tocar
 * `construirCatalogo`.
 */
import { normalizarNombreTela } from '../config/listaDestacada';

/** Datos mínimos de un artículo para decidir su tela. */
export interface ArticuloParaUnificar {
  readonly codigo: string;
  readonly descripcion: string;
  /** "Grupo Artículo" del ERP ('' si no trae). */
  readonly grupo: string;
}

export interface TelasUnificadas {
  /** codigo → nombre de tela. */
  readonly porCodigo: ReadonlyMap<string, string>;
  /** Resuelve un "Grupo Artículo" del ERP (p. ej. de una foto por tela) a su tela. */
  telaDeGrupo(grupo: string): string;
}

export interface UnificadorTelas {
  unificar(articulos: readonly ArticuloParaUnificar[]): TelasUnificadas;
}

interface Analisis {
  readonly base: string;
  readonly estampado: boolean;
}

const MARCA_DSN = /\bDSN\b/;
const SUFIJO_ORIGEN = /\s*\((E|VJ)\)\s*$/;

/** Separa la tela base del sufijo de diseño de un nombre (ya normalizado). */
function analizarNombre(nombre: string): Analisis {
  let m = /^(.*?)\s+DSN\b.*$/.exec(nombre);
  if (m) return { base: m[1], estampado: true };
  m = /^(.*?\bEST)\s+[A-Z]{0,2}\d+.*$/.exec(nombre);
  if (m) return { base: m[1], estampado: false };
  m = /^(.*[A-ZÑ].*?)\s+(?:\d{3,}(?:-\d+)?|[A-Z]{0,2}\d{1,2})$/.exec(nombre);
  if (m) return { base: m[1], estampado: true };
  return { base: nombre, estampado: false };
}

export class UnificarPorDiseno implements UnificadorTelas {
  constructor(
    private readonly listaReferencia: ReadonlySet<string>,
    private readonly alias: Readonly<Record<string, string>>,
    private readonly fusiones: Readonly<Record<string, string>> = {},
  ) {}

  unificar(articulos: readonly ArticuloParaUnificar[]): TelasUnificadas {
    const analisis = new Map<string, Analisis>();

    // 1. Artículos con grupo.
    for (const a of articulos) {
      if (!a.grupo) continue;
      const x = analizarNombre(normalizarNombreTela(a.grupo));
      const estampado = x.estampado || MARCA_DSN.test(normalizarNombreTela(a.descripcion));
      analisis.set(a.codigo, { base: x.base, estampado });
    }

    // 4. Artículos sin grupo: prefijo más largo contra las telas conocidas.
    const conocidas = [...new Set([...[...analisis.values()].map((x) => x.base), ...this.listaReferencia])].sort(
      (a, b) => b.length - a.length,
    );
    for (const a of articulos) {
      if (a.grupo) continue;
      analisis.set(a.codigo, this.analizarSinGrupo(a, conocidas));
    }

    // 2. Nombre final: "X DSN" solo si X también tiene artículos lisos (o la lista lo usa).
    const basesLisas = new Set([...analisis.values()].filter((x) => !x.estampado).map((x) => x.base));
    const nombreAuto = (x: Analisis) =>
      x.estampado && (basesLisas.has(x.base) || this.listaReferencia.has(`${x.base} DSN`)) ? `${x.base} DSN` : x.base;
    // 3. Fusiones aprobadas (clave más larga primero).
    const claves = Object.keys(this.fusiones).sort((a, b) => b.length - a.length);
    const nombre = (x: Analisis) => {
      const auto = nombreAuto(x);
      const clave = claves.find((k) => auto === k || auto.startsWith(`${k} `));
      return clave ? this.fusiones[clave] : auto;
    };

    const porCodigo = new Map<string, string>();
    const porGrupo = new Map<string, string>();
    for (const a of articulos) {
      const tela = nombre(analisis.get(a.codigo)!);
      porCodigo.set(a.codigo, tela);
      if (a.grupo && !porGrupo.has(a.grupo)) porGrupo.set(a.grupo, tela);
    }

    return {
      porCodigo,
      telaDeGrupo: (grupo) => porGrupo.get(grupo) ?? nombre(analizarNombre(normalizarNombreTela(grupo))),
    };
  }

  private analizarSinGrupo(a: ArticuloParaUnificar, conocidas: readonly string[]): Analisis {
    let desc = normalizarNombreTela(a.descripcion).replace(SUFIJO_ORIGEN, '');
    for (const [abrev, canon] of Object.entries(this.alias)) {
      if (desc.startsWith(`${abrev} `) || desc === abrev) desc = canon + desc.slice(abrev.length);
    }
    const x = analizarNombre(desc);
    if (x.estampado) return x;
    const hit = conocidas.find((t) => desc === t || desc.startsWith(`${t} `));
    return { base: hit ?? (desc || a.codigo), estampado: false };
  }
}
