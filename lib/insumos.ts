// --------------------------------------------------------------------------
// Precio de insumos (materia prima) — reemplaza el array fijo que antes
// vivía en lib/costos.ts. Vive en la tabla `insumos` para poder editarse
// desde /insumos sin tocar código.
//
// IMPORTANTE — nunca importar este archivo desde un componente "use client".
// Es información sensible (precios de proveedores); solo debe vivir en
// código de servidor (ver lib/session.ts, puedeVerCostos).
// --------------------------------------------------------------------------

import db from "./db";

export type Insumo = {
  id: number;
  nombre: string;
  unidad: string;
  precio_unitario: number;
  proveedor: string;
  actualizado_en: string;
};

export async function listarInsumos(): Promise<Insumo[]> {
  return (await db.prepare("SELECT * FROM insumos ORDER BY nombre").all()) as Insumo[];
}

export async function getInsumo(id: number): Promise<Insumo | undefined> {
  return (await db.prepare("SELECT * FROM insumos WHERE id = ?").get(id)) as
    | Insumo
    | undefined;
}
