import db from "./db";
import { nombreProducto, type Producto } from "./producto-types";
import { precioDeLista, type Lista } from "./formato";

export type { Producto };
export { nombreProducto };

/**
 * Canal comercial del pedido. Es la misma idea que las tres listas de precios
 * del catálogo: minorista = consumidor final, mayorista = reventa, y
 * distribuidor. Los pedidos viejos (sin canal guardado) se leen como
 * mayoristas, que es la lista con la que se cargaron.
 */
export const CANAL_POR_DEFECTO: Lista = "mayorista";

export function normalizarCanal(valor: unknown): Lista {
  return valor === "minorista" || valor === "distribuidor" || valor === "mayorista"
    ? valor
    : CANAL_POR_DEFECTO;
}

export const NOMBRE_CANAL: Record<Lista, string> = {
  minorista: "Consumidor final",
  mayorista: "Mayorista",
  distribuidor: "Distribuidor",
};

/**
 * El precio de un pedido se define por la fecha de ENTREGA, no por la fecha
 * en que se carga el pedido (regla de negocio explícita, sección 5.3).
 */
export function precioVigente(producto: Producto, fechaEntregaISO: string): number {
  return fechaEntregaISO >= producto.fecha_corte
    ? producto.precio_desde
    : producto.precio_hasta;
}

/**
 * Precios del canal, listos para valorizar un pedido: producto operativo ->
 * precio de esa lista. Salen del catálogo comercial, que es donde viven las
 * tres listas y donde el cliente vio el precio; el vínculo es produccion_ref
 * (se elige a mano en Catálogo → Editar).
 *
 * Un producto sin vincular, o vinculado pero sin precio cargado en esa lista,
 * no aparece acá: lo resuelve precioParaPedido() cayendo a la lista de
 * siempre.
 *
 * MAYORISTA es la excepción a propósito: los precios de la tabla "productos"
 * SON la lista mayorista (nacieron así, y hoy coinciden número por número con
 * el catálogo). Esa tabla además tiene la fecha de corte, que es como el
 * negocio programa un aumento con anticipación. Si el catálogo le pisara el
 * precio, el aumento programado no se aplicaría nunca. Así que para mayorista
 * manda la lista de siempre, y el catálogo aporta las dos listas que el
 * sistema no tenía: consumidor final y distribuidor.
 */
export async function cargarPreciosDelCanal(canal: Lista): Promise<Map<number, number>> {
  if (canal === "mayorista") return new Map();

  const filas = (await db
    .prepare(
      `SELECT produccion_ref, precio, precio_minorista, precio_distribuidor
       FROM catalogo_productos WHERE produccion_ref IS NOT NULL`
    )
    .all()) as Array<{
    produccion_ref: number;
    precio: number | null;
    precio_minorista: number | null;
    precio_distribuidor: number | null;
  }>;

  const precios = new Map<number, number>();
  for (const f of filas) {
    const precio = precioDeLista(f, canal);
    if (precio !== null && precio > 0) precios.set(Number(f.produccion_ref), precio);
  }
  return precios;
}

/**
 * Precio unitario con el que se cierra un renglón del pedido: el de la lista
 * del canal si está cargado, y si no el precio de siempre por fecha de
 * entrega. Nunca deja un producto sin precio.
 */
export function precioParaPedido(
  producto: Producto,
  fechaEntregaISO: string,
  preciosDelCanal: Map<number, number>
): number {
  return preciosDelCanal.get(producto.id) ?? precioVigente(producto, fechaEntregaISO);
}

export async function listarProductos(): Promise<Producto[]> {
  return (await db.prepare("SELECT * FROM productos ORDER BY id").all()) as Producto[];
}

export async function getProducto(id: number): Promise<Producto | undefined> {
  return (await db.prepare("SELECT * FROM productos WHERE id = ?").get(id)) as
    | Producto
    | undefined;
}
