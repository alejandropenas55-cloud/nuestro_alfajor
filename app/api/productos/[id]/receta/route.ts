import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeVerCostos } from "@/lib/session";
import { getProducto, precioVigente } from "@/lib/pricing";
import { listarRecetaDeProducto, costoProducto } from "@/lib/receta";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json({ error: "Tu usuario no tiene permiso para ver esto." }, { status: 403 });
  }

  const productoId = Number(params.id);
  const producto = await getProducto(productoId);
  if (!producto) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const lineas = await listarRecetaDeProducto(productoId);
  const costoTotal = await costoProducto(productoId);
  const hoy = new Date().toISOString().slice(0, 10);
  const precioVenta = precioVigente(producto, hoy);

  return NextResponse.json({ producto, lineas, costoTotal, precioVenta });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar recetas." },
      { status: 403 }
    );
  }

  const productoId = Number(params.id);
  const producto = await getProducto(productoId);
  if (!producto) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const { insumo_id, cantidad } = await req.json();

  if (typeof insumo_id !== "number" || typeof cantidad !== "number" || cantidad <= 0) {
    return NextResponse.json(
      { error: "Elegí un insumo y una cantidad mayor a 0." },
      { status: 400 }
    );
  }

  const insumo = await db.prepare("SELECT id FROM insumos WHERE id = ?").get(insumo_id);
  if (!insumo) return NextResponse.json({ error: "Insumo no encontrado." }, { status: 404 });

  await db
    .prepare(
      `INSERT INTO receta_items (producto_id, insumo_id, cantidad) VALUES (?, ?, ?)
       ON CONFLICT(producto_id, insumo_id) DO UPDATE SET cantidad = excluded.cantidad`
    )
    .run(productoId, insumo_id, cantidad);

  const lineas = await listarRecetaDeProducto(productoId);
  const costoTotal = await costoProducto(productoId);
  return NextResponse.json({ ok: true, lineas, costoTotal });
}
