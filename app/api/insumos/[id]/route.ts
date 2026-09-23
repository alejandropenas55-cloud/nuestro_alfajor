import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeVerCostos } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar insumos." },
      { status: 403 }
    );
  }

  const { unidad, precio_unitario, proveedor } = await req.json();

  if (
    typeof unidad !== "string" ||
    !unidad.trim() ||
    typeof precio_unitario !== "number" ||
    precio_unitario < 0
  ) {
    return NextResponse.json({ error: "Los valores no son válidos." }, { status: 400 });
  }

  const info = await db
    .prepare(
      "UPDATE insumos SET unidad = ?, precio_unitario = ?, proveedor = ?, actualizado_en = datetime('now') WHERE id = ?"
    )
    .run(unidad.trim(), precio_unitario, proveedor?.trim() || "—", params.id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Insumo no encontrado." }, { status: 404 });
  }

  const insumo = await db.prepare("SELECT * FROM insumos WHERE id = ?").get(params.id);
  return NextResponse.json({ ok: true, insumo });
}
