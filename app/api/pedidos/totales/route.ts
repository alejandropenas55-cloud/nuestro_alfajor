import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Totales por período (semana / dos semanas / mes) de la pantalla de Pedidos.
 *
 * Une por FECHA DE ENTREGA: un pedido cae en el período según el día en que se
 * entrega, no en que se cargó. Cuenta todos los pedidos del rango sin importar
 * el estado (Pendiente, Remito Enviado o Entregado): es "lo vendido para ese
 * período", aunque todavía no se haya despachado.
 *
 * El total en $ sale de pedido_items.precio_unitario, que es el precio que se
 * fijó al cargar el pedido según su fecha de entrega (regla de negocio 5.3, ver
 * lib/pricing.ts). O sea: el precio que estaba vigente para esa entrega, el
 * mismo número que figura en el remito.
 */
export async function GET(req: NextRequest) {
  if (!(await getSesion())) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const desde = req.nextUrl.searchParams.get("desde");
  const hasta = req.nextUrl.searchParams.get("hasta");
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!desde || !hasta || !iso.test(desde) || !iso.test(hasta)) {
    return NextResponse.json({ error: "Rango de fechas inválido." }, { status: 400 });
  }

  const filas = (await db
    .prepare(
      `SELECT pr.id, pr.linea, pr.formato,
              SUM(pi.cantidad) AS unidades,
              SUM(pi.cantidad * pi.precio_unitario) AS total
       FROM pedido_items pi
       JOIN pedidos p ON p.id = pi.pedido_id
       JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.fecha_entrega BETWEEN ? AND ?
       GROUP BY pr.id, pr.linea, pr.formato
       ORDER BY total DESC`
    )
    .all(desde, hasta)) as Array<{
    id: number;
    linea: string;
    formato: string;
    unidades: number;
    total: number;
  }>;

  const resumen = (await db
    .prepare(
      `SELECT COUNT(*) AS cantidad_pedidos
       FROM pedidos
       WHERE fecha_entrega BETWEEN ? AND ?`
    )
    .get(desde, hasta)) as { cantidad_pedidos: number } | undefined;

  const productos = filas.map((f) => ({
    id: Number(f.id),
    linea: f.linea,
    formato: f.formato,
    unidades: Number(f.unidades),
    total: Number(f.total),
  }));

  return NextResponse.json({
    desde,
    hasta,
    cantidadPedidos: Number(resumen?.cantidad_pedidos ?? 0),
    unidadesTotales: productos.reduce((a, p) => a + p.unidades, 0),
    totalGeneral: productos.reduce((a, p) => a + p.total, 0),
    productos,
  });
}
