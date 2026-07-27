import db from "./db";

// --------------------------------------------------------------------------
// Catálogo público — una sola fuente de verdad: la tabla catalogo_productos.
// El editor interno escribe acá y /catalogo lee de acá; no hay HTML estático
// que regenerar. El pedido NO se persiste: se cierra por WhatsApp (el flujo
// real del negocio), por eso el visitante nunca escribe en la base.
// --------------------------------------------------------------------------

// Número confirmado por el packaging real (343 507-8807). Se puede pisar por
// entorno sin tocar código; único punto de definición en todo el sistema.
export const WHATSAPP_CATALOGO =
  process.env.CATALOGO_WHATSAPP || "5493435078807";

export type CatalogoProducto = {
  id: number;
  nombre: string;
  peso: string;
  descripcion: string;
  precio: number | null;
  badge: string;
  tag_color: string;
  activo: number;
  orden: number;
  // URL lista para <img>; null = mostrar placeholder. Incluye la fecha de
  // actualización como cache-buster para que un cambio de foto se vea al toque.
  foto_url: string | null;
};

// Columnas sin el BLOB de la foto: las listas nunca deben arrastrar las
// imágenes en cada consulta.
const COLUMNAS = `id, nombre, peso, descripcion, precio, badge, tag_color,
  activo, orden,
  CASE WHEN foto IS NULL THEN NULL
       ELSE '/api/catalogo/' || id || '/foto?v=' || replace(replace(actualizado_en, ' ', '_'), ':', '-')
  END AS foto_url`;

export async function listarCatalogoPublico(): Promise<CatalogoProducto[]> {
  await seedSiVacio();
  return (await db
    .prepare(
      `SELECT ${COLUMNAS} FROM catalogo_productos WHERE activo = 1 ORDER BY orden, id`
    )
    .all()) as CatalogoProducto[];
}

export async function listarCatalogoCompleto(): Promise<CatalogoProducto[]> {
  await seedSiVacio();
  return (await db
    .prepare(`SELECT ${COLUMNAS} FROM catalogo_productos ORDER BY orden, id`)
    .all()) as CatalogoProducto[];
}

// ---------------------------------------------------------------------------
// Seed inicial — los 9 productos confirmados por el cliente (julio 2026).
// Corre una sola vez, cuando la tabla está vacía; después manda lo que el
// dueño cargue/edite desde el panel.
// ---------------------------------------------------------------------------

const DESC_PEPAS = "Producción por pedido — puede requerir más plazo de entrega.";

const SEED: Array<
  [orden: number, nombre: string, peso: string, precio: number, badge: string, color: string, desc: string]
> = [
  [1, "Alfajor de Maicena x7", "350 g · 7 unidades", 2500, "Más vendido", "#B14539",
    "El clásico de la casa: dulce de leche y coco rallado."],
  [2, "Alfajor de Maicena x14", "700 g · 14 unidades", 5000, "Ideal pedidos grandes", "#B14539",
    "La bandeja grande: doble contenido, ideal para compartir o revender."],
  [3, "Alfajor Frutal x7", "350 g · 7 unidades", 2800, "", "#4C7A4A",
    "Relleno de mermelada de membrillo, receta de la casa."],
  [4, "Alfajor Santafesino x7", "210 g · 7 unidades", 2800, "", "#2E6E93",
    "Baño glaseado, estilo tradicional santafesino."],
  [5, "Alfajor bañado en Chocolate Negro x7", "7 unidades", 4000, "Nuevo", "#7A5C3E",
    "Alfajor artesanal bañado en chocolate negro."],
  [6, "Alfajor bañado en Chocolate Blanco x7", "7 unidades", 4000, "Nuevo", "#B8862E",
    "Alfajor artesanal bañado en chocolate blanco."],
  [7, "Pepas — Dulce de leche", "350 g", 2600, "Bajo pedido", "#B8862E", DESC_PEPAS],
  [8, "Pepas — Membrillo", "350 g", 2600, "Bajo pedido", "#B8862E", DESC_PEPAS],
  [9, "Pepas — Batata", "350 g", 2600, "Bajo pedido", "#B8862E", DESC_PEPAS],
];

let seedListo = false;
async function seedSiVacio() {
  if (seedListo) return;
  const fila = (await db
    .prepare("SELECT COUNT(*) AS n FROM catalogo_productos")
    .get()) as { n: number };
  if (Number(fila.n) === 0) {
    for (const [orden, nombre, peso, precio, badge, color, desc] of SEED) {
      await db
        .prepare(
          `INSERT INTO catalogo_productos (orden, nombre, peso, precio, badge, tag_color, descripcion)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(orden, nombre, peso, precio, badge, color, desc);
    }
  }
  seedListo = true;
}

// precio: número >= 0, o null = "precio a confirmar". undefined = inválido.
export function normalizarPrecio(valor: unknown): number | null | undefined {
  if (valor === null || valor === "" || valor === undefined) return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function normalizarColor(valor: unknown): string {
  const s = String(valor ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(s) ? s : "#B14539";
}
