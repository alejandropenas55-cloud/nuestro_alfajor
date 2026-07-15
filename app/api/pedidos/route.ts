import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";
import { getProducto, precioVigente } from "@/lib/pricing";
import { generarTextoRemito } from "@/lib/remito";

const ESTADOS_VALIDOS = ["Pendiente", "Remito Enviado", "Entregado"];

export async function GET(req: NextRequest) {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const estado = params.get("estado");
  const offset = Math.max(0, parseInt(params.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "20", 10) || 20));

  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const whereEstado = estado ? "WHERE p.estado = ?" : "";
  const args = estado ? [estado, limit + 1, offset] : [limit + 1, offset];

  const pedidos = (await db
    .prepare(
      `SELECT p.*, c.nombre AS cliente_nombre, c.ciudad AS cliente_ciudad
       FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
       ${whereEstado}
       ORDER BY p.fecha_entrega ASC, p.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(...args)) as any[];

  const hasMore = pedidos.length > limit;
  const pagina = hasMore ? pedidos.slice(0, limit) : pedidos;

  const items = db.prepare(
    `SELECT pi.*, pr.linea, pr.formato FROM pedido_items pi
     JOIN productos pr ON pr.id = pi.producto_id
     WHERE pi.pedido_id = ?`
  );

  const pedidosConItems = await Promise.all(
    pagina.map(async (p) => ({
      ...p,
      items: await items.all(p.id),
    }))
  );

  return NextResponse.json({ pedidos: pedidosConItems, hasMore });
}

export async function POST(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json();
  const { cliente_id, fecha_entrega, items } = body as {
    cliente_id: number;
    fecha_entrega: string;
    items: { producto_id: number; cantidad: number }[];
  };

  if (!cliente_id || !fecha_entrega || !items?.length) {
    return NextResponse.json(
      { error: "Falta cliente, fecha de entrega o productos." },
      { status: 400 }
    );
  }

  const cliente = (await db.prepare("SELECT * FROM clientes WHERE id = ?").get(cliente_id)) as
    | { id: number; nombre: string }
    | undefined;
  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });

  const itemsResueltos = await Promise.all(
    items
      .filter((it) => it.cantidad > 0)
      .map(async (it) => {
        const producto = await getProducto(it.producto_id);
        if (!producto) throw new Error("Producto no encontrado: " + it.producto_id);
        const precioUnitario = precioVigente(producto, fecha_entrega);
        return { producto, cantidad: it.cantidad, precioUnitario };
      })
  );

  if (!itemsResueltos.length) {
    return NextResponse.json({ error: "El pedido no tiene cantidades cargadas." }, { status: 400 });
  }

  const textoRemito = generarTextoRemito({
    clienteNombre: cliente.nombre,
    fechaEntrega: fecha_entrega,
    items: itemsResueltos,
  });

  const hoy = new Date().toISOString().slice(0, 10);

  await db.ensureSchema();
  const tx = await db.client.transaction("write");
  let pedidoId: number;
  try {
    const info = await tx.execute({
      sql: `INSERT INTO pedidos (fecha_pedido, fecha_entrega, cliente_id, estado, texto_remito)
            VALUES (?, ?, ?, 'Pendiente', ?)`,
      args: [hoy, fecha_entrega, cliente_id, textoRemito],
    });
    pedidoId = Number(info.lastInsertRowid!);
    for (const it of itemsResueltos) {
      await tx.execute({
        sql: `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
        args: [pedidoId, it.producto.id, it.cantidad, it.precioUnitario],
      });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  return NextResponse.json({ ok: true, pedidoId, textoRemito });
}
