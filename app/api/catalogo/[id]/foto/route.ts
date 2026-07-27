import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSesion, puedeEditarPrecios } from "@/lib/session";

// Tope de seguridad. El editor ya comprime en el celular a ~120-200 KB antes
// de subir; esto es la red por si alguien manda el original de 4 MB.
const MAX_BYTES = 900 * 1024;

/** Sirve la foto del producto. Pública: /catalogo la usa sin login. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fila = (await db
    .prepare("SELECT foto, foto_mime FROM catalogo_productos WHERE id = ?")
    .get(params.id)) as { foto: unknown; foto_mime: string | null } | undefined;

  if (!fila?.foto) {
    return new NextResponse("Sin foto", { status: 404 });
  }

  const bytes = fila.foto as ArrayBuffer | Uint8Array;
  const body = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  return new NextResponse(body, {
    headers: {
      "Content-Type": fila.foto_mime || "image/jpeg",
      // La URL lleva ?v=<actualizado_en>, así que el contenido de una URL
      // dada nunca cambia: se puede cachear fuerte y el cambio de foto se
      // ve al instante porque cambia la URL.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** Sube (o reemplaza) la foto. Solo roles internos con permiso. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar el catálogo." },
      { status: 403 }
    );
  }

  const form = await req.formData();
  const archivo = form.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  }
  if (!archivo.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo tiene que ser una imagen." }, { status: 400 });
  }
  if (archivo.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "La foto es demasiado pesada. Probá con una imagen más chica." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const info = await db
    .prepare(
      "UPDATE catalogo_productos SET foto = ?, foto_mime = ?, actualizado_en = datetime('now') WHERE id = ?"
    )
    .run(bytes, archivo.type, params.id);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  revalidatePath("/catalogo");
  return NextResponse.json({ ok: true });
}

/** Saca la foto y vuelve al placeholder "Foto próximamente". */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeEditarPrecios(sesion.rol)) {
    return NextResponse.json(
      { error: "Tu usuario no tiene permiso para editar el catálogo." },
      { status: 403 }
    );
  }

  await db
    .prepare(
      "UPDATE catalogo_productos SET foto = NULL, foto_mime = NULL, actualizado_en = datetime('now') WHERE id = ?"
    )
    .run(params.id);

  revalidatePath("/catalogo");
  return NextResponse.json({ ok: true });
}
