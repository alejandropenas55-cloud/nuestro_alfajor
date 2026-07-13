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
