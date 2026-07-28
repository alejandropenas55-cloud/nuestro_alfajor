import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSesion, puedeEditarPrecios } from "@/lib/session";

// Textos del catálogo público: "Quiénes somos", los chips y las condiciones
// de compra. Mismo permiso que el resto del catálogo.

async function guardia() {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar el catálogo." },
      { status: 403 }
    );
  }
  return null;
}

export async function PUT(req: NextRequest) {
  const no = await guardia();
  if (no) return no;

  const body = await req.json();

  if (typeof body.quienes_somos === "string") {
    await guardarTexto("quienes_somos", body.quienes_somos.trim());
  }

  if ("min_paquetes" in body) {
    const n = Math.round(Number(body.min_paquetes) || 0);
    if (n <= 0) {
      return NextResponse.json(
        { error: "El mínimo de paquetes tiene que ser un número mayor a cero." },
        { status: 400 }
      );
    }
    await guardarTexto("min_paquetes", String(n));
  }

  if (Array.isArray(body.chips)) {
    const chips = body.chips
      .map((c: unknown) => String(c ?? "").trim())
      .filter(Boolean)
      .join("\n");
    await guardarTexto("chips", chips);
  }

  // Las condiciones se reemplazan enteras: son pocas y así el orden queda
  // exactamente como lo dejó el usuario, sin tener que sincronizar altas,
  // bajas y reordenamientos uno por uno.
  if (Array.isArray(body.condiciones)) {
    const limpias = body.condiciones
      .map((c: any) => ({
        titulo: String(c?.titulo ?? "").trim(),
        texto: String(c?.texto ?? "").trim(),
      }))
      .filter((c: any) => c.titulo || c.texto);

    await db.prepare("DELETE FROM catalogo_condiciones").run();
    let orden = 1;
    for (const c of limpias) {
      await db
        .prepare("INSERT INTO catalogo_condiciones (titulo, texto, orden) VALUES (?, ?, ?)")
        .run(c.titulo, c.texto, orden++);
    }
  }

  revalidatePath("/catalogo");
  return NextResponse.json({ ok: true });
}

async function guardarTexto(clave: string, valor: string) {
  await db
    .prepare(
      `INSERT INTO catalogo_textos (clave, valor, actualizado_en)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = datetime('now')`
    )
    .run(clave, valor);
}
