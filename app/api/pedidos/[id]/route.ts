import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";
import { getProducto, precioVigente } from "@/lib/pricing";
import { generarTextoRemito } from "@/lib/remito";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  await db.ensureSchema();
  const tx = await db.client.transaction("write");
  try {
    const info = await tx.execute({
      sql: `UPDATE pedidos SET cliente_id = ?, fecha_entrega = ?, texto_remito = ? WHERE id = ?`,
      args: [cliente_id, fecha_entrega, textoRemito, params.id],
    });
    if (info.rowsAffected === 0) {
      await tx.rollback();
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }
    await tx.execute({ sql: "DELETE FROM pedido_items WHERE pedido_id = ?", args: [params.id] });
    for (const it of itemsResueltos) {
      await tx.execute({
        sql: `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
        args: [params.id, it.producto.id, it.cantidad, it.precioUnitario],
      });
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  return NextResponse.json({ ok: true, textoRemito });
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
