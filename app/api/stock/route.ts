import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";

export async function GET() {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const filas = await db.prepare("SELECT nombre, cantidad FROM stock_insumos").all();
  return NextResponse.json({ stock: filas });
}

export async function PATCH(req: NextRequest) {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { nombre, cantidad } = (await req.json()) as { nombre?: string; cantidad?: number };

  if (!nombre || typeof cantidad !== "number" || cantidad < 0) {
    return NextResponse.json({ error: "Falta el insumo o la cantidad no es válida." }, { status: 400 });
  }

  await db
    .prepare(
      `INSERT INTO stock_insumos (nombre, cantidad, actualizado_en)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(nombre) DO UPDATE SET cantidad = excluded.cantidad, actualizado_en = datetime('now')`
    )
    .run(nombre, cantidad);

  return NextResponse.json({ ok: true, nombre, cantidad });
}
