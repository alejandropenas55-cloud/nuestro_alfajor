import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";
import {
  armarSemana,
  diasHabiles,
  lunesDeLaSemana,
  type FilaPedidoAgregada,
} from "@/lib/planilla";

// Planilla de producción semanal (lunes a viernes) para imprimir.
// Mismo criterio que /api/produccion: se toman los pedidos que todavía no
// están entregados, porque lo entregado ya no hay que producirlo.
export async function GET(req: NextRequest) {
  if (!(await getSesion()))
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const desde = req.nextUrl.searchParams.get("desde");
  if (!desde)
    return NextResponse.json({ error: "Falta la fecha." }, { status: 400 });

  const lunes = lunesDeLaSemana(desde);
  const dias = diasHabiles(lunes);
  const ultimoDia = dias[dias.length - 1];

  const filas = (await db
    .prepare(
      `SELECT p.fecha_entrega, pr.linea, pr.formato, SUM(pi.cantidad) AS cantidad
       FROM pedido_items pi
       JOIN pedidos p ON p.id = pi.pedido_id
       JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.fecha_entrega BETWEEN ? AND ? AND p.estado != 'Entregado'
       GROUP BY p.fecha_entrega, pr.linea, pr.formato`
    )
    .all(lunes, ultimoDia)) as FilaPedidoAgregada[];

  return NextResponse.json({ lunes, dias: armarSemana(lunes, filas) });
}
