import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { setSesionCookieName } from "@/lib/session";
import { normalizarTelefono } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const { telefono, pin } = await req.json();

  if (!telefono || !pin) {
    return NextResponse.json(
      { error: "Falta el teléfono o el PIN." },
      { status: 400 }
    );
  }

  const telefonoNormalizado = normalizarTelefono(String(telefono));

  const usuario = (await db
    .prepare("SELECT id, nombre, pin, telefono FROM usuarios")
    .all())
    .find(
      (u: any) => normalizarTelefono(u.telefono) === telefonoNormalizado
    ) as { id: number; nombre: string; pin: string } | undefined;

  if (!usuario) {
    return NextResponse.json(
      { error: "No encontramos ese número. Probá de nuevo." },
      { status: 401 }
    );
  }

  if (usuario.pin !== String(pin).trim()) {
    return NextResponse.json(
      { error: "PIN incorrecto." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true, nombre: usuario.nombre });
  // Sesión larga a propósito: el celular queda logueado, no se vuelve a
  // pedir el PIN cada vez que se abre la app (pedido explícito del cliente).
  res.cookies.set(setSesionCookieName(), String(usuario.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 año
  });
  return res;
}
