import { NextResponse } from "next/server";
import { setSesionCookieName } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(setSesionCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}
