import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeEditarPrecios } from "@/lib/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar precios." },
      { status: 403 }
    );
  }

  const { precio_hasta, precio_desde, fecha_corte } = await req.json();

  if (
    typeof precio_hasta !== "number" ||
    typeof precio_desde !== "number" ||
    !fecha_corte ||
    precio_hasta < 0 ||
    precio_desde < 0
  ) {
    return NextResponse.json({ error: "Los valores de precio no son válidos." }, { status: 400 });
  }

  const info = await db
    .prepare(
      "UPDATE productos SET precio_hasta = ?, precio_desde = ?, fecha_corte = ? WHERE id = ?"
    )
    .run(precio_hasta, precio_desde, fecha_corte, params.id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const producto = await db.prepare("SELECT * FROM productos WHERE id = ?").get(params.id);
  return NextResponse.json({ ok: true, producto });
}
