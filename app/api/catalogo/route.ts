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
  const precioMinorista = normalizarPrecio(body.precio_minorista);
  const precioDistribuidor = normalizarPrecio(body.precio_distribuidor);
  if (precio === undefined || precioMinorista === undefined || precioDistribuidor === undefined) {
    return NextResponse.json({ error: "Alguno de los precios no es válido." }, { status: 400 });
  }

  // Nuevo producto: va al final de la lista salvo que manden orden explícito.
  const maxFila = (await db
    .prepare("SELECT COALESCE(MAX(orden), 0) AS m FROM catalogo_productos")
    .get()) as { m: number };
  const orden = Number.isFinite(Number(body.orden)) && body.orden !== null && body.orden !== ""
    ? Math.round(Number(body.orden))
    : Number(maxFila.m) + 1;

  const minimoPropio = Math.round(Number(body.minimo_propio) || 0);

  const info = await db
    .prepare(
      `INSERT INTO catalogo_productos (nombre, peso, descripcion, precio, precio_minorista, precio_distribuidor, badge, tag_color, activo, orden, minimo_propio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      nombre,
      String(body.peso ?? "").trim(),
      String(body.descripcion ?? "").trim(),
      precio,
      precioMinorista,
      precioDistribuidor,
      String(body.badge ?? "").trim(),
      normalizarColor(body.tag_color),
      body.activo === false || body.activo === 0 ? 0 : 1,
      orden,
      minimoPropio > 0 ? minimoPropio : null
    );

  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
