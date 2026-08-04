import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSesion, puedeEditarPrecios } from "@/lib/session";
import { normalizarColor, normalizarPrecio } from "@/lib/catalogo";

// Campos editables desde el panel. Cada uno con su saneador, para que el
// PATCH pueda mandar solo lo que cambió (ej. el switch de activo/inactivo
// manda únicamente { activo }).
const CAMPOS: Record<string, (v: unknown) => unknown> = {
  nombre: (v) => String(v ?? "").trim(),
  peso: (v) => String(v ?? "").trim(),
  descripcion: (v) => String(v ?? "").trim(),
  badge: (v) => String(v ?? "").trim(),
  tag_color: (v) => normalizarColor(v),
  activo: (v) => (v === false || v === 0 || v === "0" ? 0 : 1),
  orden: (v) => Math.round(Number(v) || 0),
  // Mínimo de compra propio del producto. Vacío o 0 = entra en el mínimo
  // general surtido.
  minimo_propio: (v) => {
    const n = Math.round(Number(v) || 0);
    return n > 0 ? n : null;
  },
  // Producto operativo (tabla "productos") al que corresponde este producto
  // comercial. Vacío = sin vincular: los pedidos pegados desde el catálogo no
  // van a poder cargar este producto solos.
  produccion_ref: (v) => {
    const n = Math.round(Number(v) || 0);
    return n > 0 ? n : null;
  },
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar el catálogo." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const sets: string[] = [];
  const valores: unknown[] = [];

  for (const [campo, sanear] of Object.entries(CAMPOS)) {
    if (campo in body) {
      sets.push(`${campo} = ?`);
      valores.push(sanear(body[campo]));
    }
  }

  // Los precios van aparte porque null es un valor válido ("a confirmar") y
  // no un "no vino en el body".
  for (const campo of ["precio", "precio_minorista", "precio_distribuidor"]) {
    if (!(campo in body)) continue;
    const precio = normalizarPrecio(body[campo]);
    if (precio === undefined) {
      return NextResponse.json({ error: "Alguno de los precios no es válido." }, { status: 400 });
    }
    sets.push(`${campo} = ?`);
    valores.push(precio);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No hay nada para actualizar." }, { status: 400 });
  }
  if ("nombre" in body && !String(body.nombre ?? "").trim()) {
    return NextResponse.json({ error: "El producto necesita un nombre." }, { status: 400 });
  }

  sets.push("actualizado_en = datetime('now')");
  const info = await db
    .prepare(`UPDATE catalogo_productos SET ${sets.join(", ")} WHERE id = ?`)
    .run(...valores, params.id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  revalidatePath("/catalogo");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar el catálogo." },
      { status: 403 }
    );
  }

  const info = await db
    .prepare("DELETE FROM catalogo_productos WHERE id = ?")
    .run(params.id);
  if (info.changes === 0) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  revalidatePath("/catalogo");
  return NextResponse.json({ ok: true });
}
