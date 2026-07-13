import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";
import { calcularManana, type ItemPedidoAgregado } from "@/lib/produccion";

export async function GET(req: NextRequest) {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const fecha = req.nextUrl.searchParams.get("fecha");
  if (!fecha) return NextResponse.json({ error: "Falta la fecha." }, { status: 400 });

  // Del día puntual: solo lo que se entrega ese día exacto.
  const filasDia = (await db
    .prepare(
      `SELECT pr.linea, pr.formato, SUM(pi.cantidad) AS cantidad
       FROM pedido_items pi
       JOIN pedidos p ON p.id = pi.pedido_id
       JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.fecha_entrega = ? AND p.estado != 'Entregado'
       GROUP BY pr.linea, pr.formato`
    )
    .all(fecha)) as ItemPedidoAgregado[];

  // Acumulado: todo lo pendiente con entrega en esa fecha o antes (incluye
  // atrasos), para saber qué hace falta para estar al día hasta ese punto.
  const filasAcumulado = (await db
    .prepare(
      `SELECT pr.linea, pr.formato, SUM(pi.cantidad) AS cantidad
       FROM pedido_items pi
       JOIN pedidos p ON p.id = pi.pedido_id
       JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.fecha_entrega <= ? AND p.estado != 'Entregado'
       GROUP BY pr.linea, pr.formato`
    )
    .all(fecha)) as ItemPedidoAgregado[];

  const calculoDia = calcularManana(fecha, filasDia);
  const calculoAcumulado = calcularManana(fecha, filasAcumulado);

  return NextResponse.json({
    calculoDia,
    calculoAcumulado,
    huboPedidosDia: filasDia.length > 0,
    huboPedidosAcumulado: filasAcumulado.length > 0,
  });
}
