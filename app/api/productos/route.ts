import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeEditarPrecios } from "@/lib/session";

export async function POST(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para agregar productos." },
      { status: 403 }
    );
  }

  const { linea, formato, unidad, precio_hasta, precio_desde, fecha_corte } = await req.json();

  if (
    typeof linea !== "string" ||
    !linea.trim() ||
    typeof formato !== "string" ||
    !formato.trim() ||
    typeof precio_hasta !== "number" ||
    typeof precio_desde !== "number" ||
    !fecha_corte ||
    precio_hasta < 0 ||
    precio_desde < 0
  ) {
    return NextResponse.json({ error: "Completá línea, formato y precios válidos." }, { status: 400 });
  }

  const yaExiste = await db
    .prepare("SELECT id FROM productos WHERE linea = ? AND formato = ?")
    .get(linea.trim(), formato.trim());
  if (yaExiste) {
    return NextResponse.json(
      { error: `Ya existe un producto "${linea.trim()} ${formato.trim()}".` },
      { status: 409 }
    );
  }

  const info = await db
    .prepare(
      "INSERT INTO productos (linea, formato, unidad, precio_hasta, precio_desde, fecha_corte) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(linea.trim(), formato.trim(), unidad?.trim() || "paquete", precio_hasta, precio_desde, fecha_corte);

  const producto = await db.prepare("SELECT * FROM productos WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ ok: true, producto });
}
