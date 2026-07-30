import db from "@/lib/db";
import CalendarioPedidos from "@/components/CalendarioPedidos";
import type { PedidoConItems } from "@/components/TarjetaPedido";

export const dynamic = "force-dynamic";

async function obtenerPedidosDelMes(anio: number, mes: number): Promise<PedidoConItems[]> {
  const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const hasta = `${anio}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

  const filas = (await db
    .prepare(
      `SELECT p.id, p.fecha_entrega, p.estado, p.texto_remito, c.nombre AS cliente_nombre
       FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
       WHERE p.fecha_entrega BETWEEN ? AND ?
       ORDER BY p.fecha_entrega ASC, p.id DESC`
    )
    .all(desde, hasta)) as any[];

  const items = db.prepare(
    `SELECT pi.cantidad, pi.precio_unitario, pr.linea, pr.formato
     FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id
     WHERE pi.pedido_id = ?`
  );

  return (await Promise.all(
    filas.map(async (p) => ({ ...p, items: await items.all(p.id) }))
  )) as PedidoConItems[];
}

export default async function PedidosPage() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth() + 1;
  const hoyIso = `${anio}-${String(mes).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  const pedidos = await obtenerPedidosDelMes(anio, mes);

  return (
    <CalendarioPedidos
      pedidosIniciales={pedidos}
      anioInicial={anio}
      mesInicial={mes}
      hoyInicial={hoyIso}
    />
  );
}
