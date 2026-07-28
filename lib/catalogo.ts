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

// Usuario de Instagram, igual que el impreso en el packaging del Santafesino.
export const INSTAGRAM_CATALOGO =
  process.env.CATALOGO_INSTAGRAM || "nuestro_alfajor";

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

// Las filas que devuelve @libsql/client no son objetos planos (traen métodos
// propios), y Next.js no deja pasar eso de un Server Component a un Client
// Component. El spread las aplana antes de salir de acá.
function aPlano<T>(filas: any[]): T[] {
  return filas.map((f) => ({ ...f })) as T[];
}

export async function listarCatalogoPublico(): Promise<CatalogoProducto[]> {
  await seedSiVacio();
  return aPlano<CatalogoProducto>(
    await db
      .prepare(
        `SELECT ${COLUMNAS} FROM catalogo_productos WHERE activo = 1 ORDER BY orden, id`
      )
      .all()
  );
}

export async function listarCatalogoCompleto(): Promise<CatalogoProducto[]> {
  await seedSiVacio();
  return aPlano<CatalogoProducto>(
    await db
      .prepare(`SELECT ${COLUMNAS} FROM catalogo_productos ORDER BY orden, id`)
      .all()
  );
}

// ---------------------------------------------------------------------------
// Textos editables: "Quiénes somos", los chips y las condiciones de compra.
// Viven en la base y no en el código para que los dueños los cambien desde el
// panel, sin depender de un despliegue.
// ---------------------------------------------------------------------------

export type CatalogoCondicion = {
  id: number;
  titulo: string;
  texto: string;
  orden: number;
};

export type CatalogoTextos = {
  quienes_somos: string;
  chips: string[];
  condiciones: CatalogoCondicion[];
};

export async function leerTextos(): Promise<CatalogoTextos> {
  await seedSiVacio();
  const filas = (await db
    .prepare("SELECT clave, valor FROM catalogo_textos")
    .all()) as Array<{ clave: string; valor: string }>;
  const mapa = new Map(filas.map((f) => [f.clave, f.valor]));

  const condiciones = aPlano<CatalogoCondicion>(
    await db
      .prepare("SELECT id, titulo, texto, orden FROM catalogo_condiciones ORDER BY orden, id")
      .all()
  );

  return {
    quienes_somos: mapa.get("quienes_somos") ?? "",
    // Los chips van en una sola fila separados por saltos de línea: son tres
    // frases cortas, no vale la pena una tabla para eso.
    chips: (mapa.get("chips") ?? "")
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean),
    condiciones,
  };
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
  // Los nombres del chocolate siguen el packaging YA IMPRESO ("baño de
  // repostería semiamargo"): cambiar el envase es caro, así que manda el
  // envase y la web se adapta, no al revés.
  [5, "Alfajor de Chocolate Semiamargo x7", "350 g · 7 unidades", 4000, "Nuevo", "#7A5C3E",
    "Alfajor de chocolate con baño de repostería semiamargo."],
  [6, "Alfajor de Chocolate Blanco x7", "350 g · 7 unidades", 4000, "Nuevo", "#B8862E",
    "Alfajor bañado en chocolate blanco, relleno de dulce de leche."],
  [7, "Pepas — Dulce de leche", "350 g", 2600, "Bajo pedido", "#B8862E", DESC_PEPAS],
  [8, "Pepas — Membrillo", "350 g", 2600, "Bajo pedido", "#B8862E", DESC_PEPAS],
  [9, "Pepas — Batata", "350 g", 2600, "Bajo pedido", "#B8862E", DESC_PEPAS],
];

// Somos cuatro: Máximo es parte de la familia aunque hoy no trabaje en la
// fábrica. Se lo nombra y nada más — su condición no es un argumento de venta
// y no tiene por qué estar en un catálogo de alfajores.
const QUIENES_SOMOS =
  "Somos una familia de Paraná: Javier, Mercedes, Francisco y Máximo. " +
  "Hacemos cada alfajor a mano, en tandas chicas, cuidando la receta y el " +
  "punto del dulce de leche. Hoy trabajamos con escuelas, clubes y empresas " +
  "de la zona que eligen nuestros alfajores para sus ventas y eventos.";

const CHIPS = [
  "Habilitación bromatológica vigente",
  "RNPA registrado",
  "Producción 100% propia",
].join("\n");

// OJO con "Vida útil": 30 días es el valor vigente. Hay un estudio
// bromatológico en trámite para extenderlo, pero SIN resultado todavía.
// No subir ese número hasta que el laboratorio lo confirme por escrito.
const CONDICIONES: Array<[titulo: string, texto: string]> = [
  ["Mínimo de compra",
    "15 paquetes (se pueden pedir surtidos). Para la Bandeja Maicena x14, el mínimo es de 10 bandejas."],
  ["Anticipación de pedidos",
    "Mínimo 3 días. Grupos de venta, instituciones y compras de mayor volumen deben reservar previamente la fecha de entrega."],
  ["Producción artesanal",
    "Cada pedido se elabora especialmente; se trabaja con reserva previa."],
  ["Forma de pago",
    "Al momento del retiro: 50% efectivo + 50% transferencia, o 100% efectivo."],
  ["Horarios de retiro",
    "Lunes a viernes de 17:00 a 18:30 hs · Sábados de 9:00 a 11:00 hs."],
  ["Retiro", "Prof. Diego Mackinnon 1590, Paraná, Entre Ríos."],
  ["Vida útil", "30 días en condiciones adecuadas de almacenamiento."],
];

let seedListo = false;

// Marca de "la siembra ya corrió". Sin esto, las inserciones idempotentes
// resucitarían cualquier producto o condición que el dueño haya borrado a
// propósito desde el editor.
const CLAVE_SEED = "seed_hecho";

/**
 * Siembra el contenido inicial UNA sola vez.
 *
 * Va todo en un único batch en modo write —o sea, una transacción— y no en un
 * for con un round-trip por fila. La primera versión insertaba las 7
 * condiciones de a una y en producción entraron solo 4: la función serverless
 * se cortó a mitad del bucle, la tabla dejó de estar vacía y las 3 que
 * faltaban no se insertaron nunca más. Al ser una transacción, ahora entra
 * todo o no entra nada.
 *
 * La marca se escribe dentro del mismo batch: si la transacción falla, la
 * marca tampoco queda y el próximo render vuelve a intentar.
 */
async function seedSiVacio() {
  if (seedListo) return;
  await db.ensureSchema();

  const yaEsta = (await db
    .prepare("SELECT 1 AS x FROM catalogo_textos WHERE clave = ?")
    .get(CLAVE_SEED)) as { x: number } | undefined;
  if (yaEsta) {
    seedListo = true;
    return;
  }

  await db.client.batch(
    [
      ...SEED.map(([orden, nombre, peso, precio, badge, color, desc]) => ({
        sql: `INSERT INTO catalogo_productos (orden, nombre, peso, precio, badge, tag_color, descripcion)
              SELECT ?, ?, ?, ?, ?, ?, ?
              WHERE NOT EXISTS (SELECT 1 FROM catalogo_productos WHERE nombre = ?)`,
        args: [orden, nombre, peso, precio, badge, color, desc, nombre],
      })),
      {
        sql: "INSERT OR IGNORE INTO catalogo_textos (clave, valor) VALUES (?, ?)",
        args: ["quienes_somos", QUIENES_SOMOS],
      },
      {
        sql: "INSERT OR IGNORE INTO catalogo_textos (clave, valor) VALUES (?, ?)",
        args: ["chips", CHIPS],
      },
      ...CONDICIONES.map(([titulo, texto], i) => ({
        sql: `INSERT INTO catalogo_condiciones (titulo, texto, orden)
              SELECT ?, ?, ?
              WHERE NOT EXISTS (SELECT 1 FROM catalogo_condiciones WHERE titulo = ?)`,
        args: [titulo, texto, i + 1, titulo],
      })),
      {
        sql: "INSERT OR IGNORE INTO catalogo_textos (clave, valor) VALUES (?, ?)",
        args: [CLAVE_SEED, new Date().toISOString()],
      },
    ],
    "write"
  );

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
