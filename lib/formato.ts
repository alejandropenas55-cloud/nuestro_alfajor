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

/** Convierte '#B14539' + alpha a 'rgba(177, 69, 57, 0.42)'. */
export function hexRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(177, 69, 57, ${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
