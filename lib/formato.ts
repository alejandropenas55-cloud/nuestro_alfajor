// Formateo compartido entre servidor y cliente. Sin importar la base de
// datos: este archivo entra al bundle del navegador.

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
