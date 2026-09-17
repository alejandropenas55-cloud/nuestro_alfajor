// --------------------------------------------------------------------------
// Receta por producto: qué insumos y en qué cantidad lleva UNA unidad de
// venta (un paquete, una bandeja). No confundir con lib/produccion.ts, que
// calcula por LOTE de amasijo para decidir compras — esto es costo por
// unidad vendida, para ver margen.
// --------------------------------------------------------------------------

import db from "./db";

export type LineaReceta = {
  id: number;
  insumo_id: number;
  nombre: string;
  unidad: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
};

export async function listarRecetaDeProducto(productoId: number): Promise<LineaReceta[]> {
  const filas = (await db
    .prepare(
      `SELECT ri.id, ri.insumo_id, i.nombre, i.unidad, i.precio_unitario, ri.cantidad
       FROM receta_items ri
       JOIN insumos i ON i.id = ri.insumo_id
       WHERE ri.producto_id = ?
       ORDER BY i.nombre`
    )
    .all(productoId)) as Omit<LineaReceta, "subtotal">[];

  return filas.map((f) => ({
    ...f,
    subtotal: Math.round(f.cantidad * f.precio_unitario * 100) / 100,
  }));
}

export async function costoProducto(productoId: number): Promise<number> {
  const lineas = await listarRecetaDeProducto(productoId);
  return Math.round(lineas.reduce((a, l) => a + l.subtotal, 0) * 100) / 100;
}
