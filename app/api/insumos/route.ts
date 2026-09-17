import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeVerCostos } from "@/lib/session";

export async function GET() {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json({ error: "Tu usuario no tiene permiso para ver esto." }, { status: 403 });
  }

  const insumos = await db.prepare("SELECT * FROM insumos ORDER BY nombre").all();
  return NextResponse.json({ insumos });
}

export async function POST(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para agregar insumos." },
      { status: 403 }
    );
  }

  const { nombre, unidad, precio_unitario, proveedor } = await req.json();

  if (
    typeof nombre !== "string" ||
    !nombre.trim() ||
    typeof unidad !== "string" ||
    !unidad.trim() ||
    typeof precio_unitario !== "number" ||
    precio_unitario < 0
  ) {
    return NextResponse.json(
      { error: "Completá nombre, unidad y un precio válido." },
      { status: 400 }
    );
  }

  const yaExiste = await db.prepare("SELECT id FROM insumos WHERE nombre = ?").get(nombre.trim());
  if (yaExiste) {
    return NextResponse.json(
      { error: `Ya existe un insumo "${nombre.trim()}".` },
      { status: 409 }
    );
  }

  const info = await db
    .prepare(
      "INSERT INTO insumos (nombre, unidad, precio_unitario, proveedor) VALUES (?, ?, ?, ?)"
    )
    .run(nombre.trim(), unidad.trim(), precio_unitario, proveedor?.trim() || "—");

  const insumo = await db.prepare("SELECT * FROM insumos WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ ok: true, insumo });
}
