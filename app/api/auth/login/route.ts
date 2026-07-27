import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { setSesionCookieName } from "@/lib/session";
import { normalizarTelefono } from "@/lib/phone";

// Tras 4 PIN equivocados seguidos el usuario queda bloqueado un rato. Con un
// PIN de 4 dígitos hay solo 10.000 combinaciones: sin este freno, alguien que
// conozca la dirección del panel puede probarlas todas. Entrar bien vuelve el
// contador a cero.
const INTENTOS_MAX = 4;
const MINUTOS_BLOQUEO = 15;

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
    .prepare(
      "SELECT id, nombre, pin, telefono, intentos_fallidos, bloqueado_hasta FROM usuarios"
    )
    .all())
    .find(
      (u: any) => normalizarTelefono(u.telefono) === telefonoNormalizado
    ) as
    | {
        id: number;
        nombre: string;
        pin: string;
        intentos_fallidos: number | null;
        bloqueado_hasta: string | null;
      }
    | undefined;

  if (!usuario) {
    return NextResponse.json(
      { error: "No encontramos ese número. Probá de nuevo." },
      { status: 401 }
    );
  }

  const minutosRestantes = minutosDeBloqueo(usuario.bloqueado_hasta);
  if (minutosRestantes > 0) {
    return NextResponse.json(
      {
        error: `Demasiados intentos. Esperá ${minutosRestantes} ${
          minutosRestantes === 1 ? "minuto" : "minutos"
        } y probá de nuevo.`,
      },
      { status: 429 }
    );
  }

  if (usuario.pin !== String(pin).trim()) {
    const fallidos = Number(usuario.intentos_fallidos ?? 0) + 1;
    const bloquear = fallidos >= INTENTOS_MAX;

    await db
      .prepare(
        `UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?`
      )
      .run(
        bloquear ? 0 : fallidos,
        bloquear
          ? new Date(Date.now() + MINUTOS_BLOQUEO * 60_000).toISOString()
          : null,
        usuario.id
      );

    if (bloquear) {
      return NextResponse.json(
        {
          error: `PIN incorrecto. Por seguridad esperá ${MINUTOS_BLOQUEO} minutos antes de volver a probar.`,
        },
        { status: 429 }
      );
    }

    const quedan = INTENTOS_MAX - fallidos;
    return NextResponse.json(
      {
        error: `PIN incorrecto. Te ${quedan === 1 ? "queda" : "quedan"} ${quedan} ${
          quedan === 1 ? "intento" : "intentos"
        }.`,
      },
      { status: 401 }
    );
  }

  await db
    .prepare(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?"
    )
    .run(usuario.id);

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

/** Minutos que faltan para poder volver a intentar; 0 si no está bloqueado. */
function minutosDeBloqueo(hasta: string | null): number {
  if (!hasta) return 0;
  const restanteMs = new Date(hasta).getTime() - Date.now();
  if (!Number.isFinite(restanteMs) || restanteMs <= 0) return 0;
  return Math.ceil(restanteMs / 60_000);
}
