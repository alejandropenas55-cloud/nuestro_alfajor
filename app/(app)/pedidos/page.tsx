import Link from "next/link";
import db from "@/lib/db";
import ListaPedidos from "@/components/ListaPedidos";
import type { PedidoConItems } from "@/components/TarjetaPedido";

export const dynamic = "force-dynamic";

const LIMITE = 20;

async function obtenerPrimeraTanda(): Promise<{ pedidos: PedidoConItems[]; hasMore: boolean }> {
  const filas = (await db
    .prepare(
      `SELECT p.id, p.fecha_entrega, p.estado, p.texto_remito, c.nombre AS cliente_nombre
       FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
       ORDER BY p.fecha_entrega ASC, p.id DESC
       LIMIT ?`
    )
    .all(LIMITE + 1)) as any[];

  const hasMore = filas.length > LIMITE;
  const pagina = hasMore ? filas.slice(0, LIMITE) : filas;

  const items = db.prepare(
    `SELECT pi.cantidad, pi.precio_unitario, pr.linea, pr.formato
     FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id
     WHERE pi.pedido_id = ?`
  );

  const pedidos = await Promise.all(
    pagina.map(async (p) => ({ ...p, items: await items.all(p.id) }))
  );

  return { pedidos: pedidos as PedidoConItems[], hasMore };
}

export default async function PedidosPage() {
  const { pedidos, hasMore } = await obtenerPrimeraTanda();

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 bg-masa-50 -mx-4 px-4 pt-2 pb-3 -mt-2">
        <Link href="/pedidos/nuevo" className="btn-primario w-full">
          + Cargar pedido
        </Link>
      </div>

      <ListaPedidos pedidosIniciales={pedidos} hasMoreInicial={hasMore} />
    </div>
  );
}
