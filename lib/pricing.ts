import db from "./db";
import { nombreProducto, type Producto } from "./producto-types";

export type { Producto };
export { nombreProducto };

/**
 * El precio de un pedido se define por la fecha de ENTREGA, no por la fecha
 * en que se carga el pedido (regla de negocio explícita, sección 5.3).
 */
export function precioVigente(producto: Producto, fechaEntregaISO: string): number {
  return fechaEntregaISO >= producto.fecha_corte
    ? producto.precio_desde
    : producto.precio_hasta;
}

export async function listarProductos(): Promise<Producto[]> {
  return (await db.prepare("SELECT * FROM productos ORDER BY id").all()) as Producto[];
}

export async function getProducto(id: number): Promise<Producto | undefined> {
  return (await db.prepare("SELECT * FROM productos WHERE id = ?").get(id)) as
    | Producto
    | undefined;
}
