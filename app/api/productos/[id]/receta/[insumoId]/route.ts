import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeVerCostos } from "@/lib/session";
import { listarRecetaDeProducto, costoProducto } from "@/lib/receta";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; insumoId: string } }
) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar recetas." },
      { status: 403 }
    );
  }

  const productoId = Number(params.id);
  const info = await db
    .prepare("DELETE FROM receta_items WHERE producto_id = ? AND insumo_id = ?")
    .run(productoId, params.insumoId);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Esa línea de receta no existe." }, { status: 404 });
  }

  const lineas = await listarRecetaDeProducto(productoId);
  const costoTotal = await costoProducto(productoId);
  return NextResponse.json({ ok: true, lineas, costoTotal });
}
