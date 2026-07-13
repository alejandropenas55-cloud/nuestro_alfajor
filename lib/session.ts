import { cookies } from "next/headers";
import db from "./db";

const COOKIE = "na_session";

export type SesionUsuario = {
  id: number;
  nombre: string;
  rol: string;
};

/**
 * Etapa 0 — login simple con teléfono + PIN de 4 dígitos (sección 8.1).
 * La cookie guarda solo el id de usuario; no hay tokens complejos porque
 * el equipo no tiene contraseñas ni emails y no hace falta ese nivel acá.
 *
 * Nota de seguridad para cuando se migre a Supabase: usar Supabase Auth con
 * "phone" + verificación, y mover el PIN a un hash (bcrypt) en vez de texto
 * plano. En esta etapa local de desarrollo se prioriza simplicidad.
 */
export async function getSesion(): Promise<SesionUsuario | null> {
  const id = cookies().get(COOKIE)?.value;
  if (!id) return null;
  const u = (await db
    .prepare("SELECT id, nombre, rol FROM usuarios WHERE id = ?")
    .get(Number(id))) as SesionUsuario | undefined;
  return u ?? null;
}

export function setSesionCookieName() {
  return COOKIE;
}

/**
 * Precios: solo Alejandro (dueño técnico), Javier y Mercedes (dueños del
 * negocio) pueden editarlos. Francisco los ve pero no los toca — pedido
 * explícito del cliente.
 */
export function puedeEditarPrecios(rol: string): boolean {
  return ["alejandro", "javier", "mercedes"].includes(rol);
}
