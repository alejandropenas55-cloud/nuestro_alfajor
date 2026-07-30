import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion } from "@/lib/session";

export async function GET() {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const clientes = await db.prepare("SELECT * FROM clientes ORDER BY nombre").all();
  return NextResponse.json({ clientes });
}

export async function POST(req: NextRequest) {
  if (!(await getSesion())) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const { nombre, ciudad, lista_difusion } = await req.json();
  const nombreLimpio = String(nombre ?? "").trim();
  if (!nombreLimpio) {
    return NextResponse.json({ error: "Falta el nombre del cliente." }, { status: 400 });
  }

  // Mecanismo auto-ampliable: si ya existe, lo devuelve; si no, lo crea.
  const existente = await db.prepare("SELECT * FROM clientes WHERE nombre = ?").get(nombreLimpio);
  if (existente) return NextResponse.json({ cliente: existente });

  const info = await db
    .prepare("INSERT INTO clientes (nombre, ciudad, lista_difusion) VALUES (?, ?, ?)")
    .run(nombreLimpio, ciudad ?? null, lista_difusion ?? null);

  const cliente = await db.prepare("SELECT * FROM clientes WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ cliente });
}
