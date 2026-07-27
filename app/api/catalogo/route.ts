import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeEditarPrecios } from "@/lib/session";
import { listarCatalogoCompleto, normalizarColor, normalizarPrecio } from "@/lib/catalogo";

// Mismo criterio que los precios de venta: cualquier usuario logueado puede
// VER el catálogo completo (incluidos inactivos); editar solo el trío que
// edita precios (Alejandro/Javier/Mercedes). Francisco ve, no toca.

export async function GET() {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const productos = await listarCatalogoCompleto();
  return NextResponse.json({ productos, puedeEditar: puedeEditarPrecios(sesion.rol) });
}

export async function POST(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar el catálogo." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const nombre = String(body.nombre ?? "").trim();
  if (!nombre) {
    return NextResponse.json({ error: "El producto necesita un nombre." }, { status: 400 });
  }
  const precio = normalizarPrecio(body.precio);
  if (precio === undefined) {
    return NextResponse.json({ error: "El precio no es válido." }, { status: 400 });
  }

  // Nuevo producto: va al final de la lista salvo que manden orden explícito.
  const maxFila = (await db
    .prepare("SELECT COALESCE(MAX(orden), 0) AS m FROM catalogo_productos")
    .get()) as { m: number };
  const orden = Number.isFinite(Number(body.orden)) && body.orden !== null && body.orden !== ""
    ? Math.round(Number(body.orden))
    : Number(maxFila.m) + 1;

  const info = await db
    .prepare(
      `INSERT INTO catalogo_productos (nombre, peso, descripcion, precio, badge, tag_color, activo, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nombre,
      String(body.peso ?? "").trim(),
      String(body.descripcion ?? "").trim(),
      precio,
      String(body.badge ?? "").trim(),
      normalizarColor(body.tag_color),
      body.activo === false || body.activo === 0 ? 0 : 1,
      orden
    );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
