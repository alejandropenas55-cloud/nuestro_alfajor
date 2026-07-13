import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";

const ESTADOS_VALIDOS = ["Pendiente", "Remito Enviado", "Entregado"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { estado } = await req.json();
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const info = await db
    .prepare("UPDATE pedidos SET estado = ? WHERE id = ?")
    .run(estado, params.id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  await db.ensureSchema();
  const tx = await db.client.transaction("write");
  let borrado = false;
  try {
    await tx.execute({ sql: "DELETE FROM pedido_items WHERE pedido_id = ?", args: [params.id] });
    const info = await tx.execute({ sql: "DELETE FROM pedidos WHERE id = ?", args: [params.id] });
    borrado = info.rowsAffected > 0;
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  if (!borrado) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
