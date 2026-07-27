import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";

// Cada usuario cambia SU PROPIO PIN, y solo estando ya logueado. No hay
// "olvidé mi PIN" ni cambio de PIN ajeno: son cuatro personas que se ven
// todos los días, y un mecanismo de recuperación sería más agujero que ayuda.

export async function POST(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { pin_actual, pin_nuevo, pin_repetido } = await req.json();

  const actual = String(pin_actual ?? "").trim();
  const nuevo = String(pin_nuevo ?? "").trim();
  const repetido = String(pin_repetido ?? "").trim();

  if (!/^\d{4}$/.test(nuevo)) {
    return NextResponse.json(
      { error: "El PIN nuevo tiene que ser de 4 números." },
      { status: 400 }
    );
  }
  if (nuevo !== repetido) {
    return NextResponse.json(
      { error: "El PIN nuevo y su repetición no coinciden." },
      { status: 400 }
    );
  }
  if (nuevo === "1234" || nuevo === "0000") {
    return NextResponse.json(
      { error: "Ese PIN es demasiado fácil de adivinar. Elegí otro." },
      { status: 400 }
    );
  }

  const fila = (await db
    .prepare("SELECT pin FROM usuarios WHERE id = ?")
    .get(sesion.id)) as { pin: string } | undefined;

  if (!fila || fila.pin !== actual) {
    return NextResponse.json({ error: "El PIN actual no es correcto." }, { status: 401 });
  }

  if (nuevo === actual) {
    return NextResponse.json(
      { error: "El PIN nuevo es igual al actual." },
      { status: 400 }
    );
  }

  await db
    .prepare(
      "UPDATE usuarios SET pin = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?"
    )
    .run(nuevo, sesion.id);

  return NextResponse.json({ ok: true });
}
