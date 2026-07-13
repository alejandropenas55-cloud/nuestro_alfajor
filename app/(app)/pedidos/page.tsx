import Link from "next/link";
import db from "@/lib/db";
import TarjetaPedido, { type PedidoConItems } from "@/components/TarjetaPedido";

export const dynamic = "force-dynamic";

async function obtenerPedidos(): Promise<PedidoConItems[]> {
  const pedidos = (await db
    .prepare(
      `SELECT p.id, p.fecha_entrega, p.estado, p.texto_remito, c.nombre AS cliente_nombre
       FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
       ORDER BY p.fecha_entrega ASC, p.id DESC`
    )
    .all()) as any[];

  const items = db.prepare(
    `SELECT pi.cantidad, pi.precio_unitario, pr.linea, pr.formato
     FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id
     WHERE pi.pedido_id = ?`
  );

  return Promise.all(
    pedidos.map(async (p) => ({ ...p, items: await items.all(p.id) }))
  ) as Promise<PedidoConItems[]>;
}

export default async function PedidosPage() {
  const pedidos = await obtenerPedidos();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/pedidos/nuevo" className="btn-primario">
        + Cargar pedido
      </Link>

      {pedidos.length === 0 ? (
        <div className="card text-center text-dulce-500 py-10">
          Todavía no hay pedidos cargados. Tocá "Cargar pedido" para empezar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <TarjetaPedido key={p.id} pedido={p} />
          ))}
        </div>
      )}
    </div>
  );
}
