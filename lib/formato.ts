// Formateo compartido entre servidor y cliente. Sin importar la base de
// datos: este archivo entra al bundle del navegador.

/**
 * Las tres listas de precios, una por canal. Cada una se carga a mano en cada
 * producto: no se derivan con un porcentaje, porque los precios comerciales
 * casi nunca salen de una cuenta redonda y el dueño necesita poder poner el
 * número exacto que quiere en cada canal.
 */
export type Lista = "minorista" | "mayorista" | "distribuidor";

/** Solo los precios: así esto no depende del tipo completo del producto. */
type ConPrecios = {
  precio: number | null;
  precio_minorista: number | null;
  precio_distribuidor: number | null;
};

export function precioDeLista(p: ConPrecios, lista: Lista): number | null {
  if (lista === "minorista") return p.precio_minorista;
  if (lista === "distribuidor") return p.precio_distribuidor;
  return p.precio;
}

/** Formato argentino: 2500 -> "$2.500". Sin decimales (los precios son enteros). */
export function precioAR(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-AR");
}

/**
 * Devuelve la parte de fecha ("2026-07-29") de un texto de fecha/hora de la
 * base — que puede venir como "2026-07-29 10:47:46" (lo que escribe
 * datetime('now')) o como ISO. null si no hay valor o no tiene forma de fecha.
 */
function soloFecha(valor: string | null | undefined): string | null {
  const dia = String(valor ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) ? dia : null;
}

/**
 * Fecha de alta para mostrar en pantalla: "29/07/2026". La hora no se muestra
 * porque a nadie le sirve saber el minuto en que se cargó un cliente.
 * Devuelve "—" cuando no hay fecha: son los clientes que ya estaban cargados
 * antes de que existiera la columna, de los que no se puede reconstruir
 * cuándo entraron.
 */
export function fechaAltaLegible(valor: string | null | undefined): string {
  const dia = soloFecha(valor);
  if (!dia) return "—";
  const [y, m, d] = dia.split("-");
  return `${d}/${m}/${y}`;
}

/** Convierte '#B14539' + alpha a 'rgba(177, 69, 57, 0.42)'. */
export function hexRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(177, 69, 57, ${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
