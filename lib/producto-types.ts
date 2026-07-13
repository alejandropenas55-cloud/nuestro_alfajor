export type Producto = {
  id: number;
  linea: string;
  formato: string;
  unidad: string;
  precio_hasta: number;
  precio_desde: number;
  fecha_corte: string;
};

export function nombreProducto(p: Producto): string {
  if (p.formato === "bandeja18") return `${p.linea} (bandeja x18)`;
  return `${p.linea} ${p.formato}`;
}
