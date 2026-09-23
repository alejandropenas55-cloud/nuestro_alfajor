import { createClient, type Client } from "@libsql/client";

// --------------------------------------------------------------------------
// Base de datos (Turso / libSQL) — mismo esquema y mismo SQL que la Etapa 0
// local con SQLite, solo cambia el driver de conexión (ver README, sección
// "Arquitectura"). El esquema de abajo es un espejo intencional de la
// sección 8.3 del documento de especificación (modelo de datos para
// Supabase/Postgres). Cuando llegue el momento de migrar a Supabase, estas
// mismas tablas se recrean en Postgres sin cambiar la forma de los datos ni
// la lógica de negocio en /lib — solo cambia el driver de conexión.
// --------------------------------------------------------------------------

const client: Client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
  // El driver habla con Turso por HTTP usando fetch(). Next.js reemplaza el
  // fetch global por uno que cachea las respuestas en su "Data Cache", y la
  // clave incluye el cuerpo del pedido — o sea, el texto de la consulta SQL.
  // Resultado: una consulta ya vista devuelve el resultado VIEJO aunque la
  // base haya cambiado, y el caché sobrevive a reiniciar el servidor porque
  // vive en .next/cache/fetch-cache. Se detectó al editar el catálogo y no
  // verse el cambio en /catalogo. La base nunca se debe cachear: se fuerza
  // no-store en cada consulta.
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, { ...init, cache: "no-store" }),
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('javier','mercedes','francisco','alejandro')),
  telefono TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,           -- PIN de 4 dígitos. Etapa 0: guardado simple, ver nota de seguridad al migrar.
  etapa_habilitada INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea TEXT NOT NULL,              -- Maicena | Frutal | Santafesino | Pepas DDL | Pepas Membrillo | Pepas Batata | Pepas Arandano | Pepas Frutos del Bosque
  formato TEXT NOT NULL,            -- x7 | x14 | bandeja18
  unidad TEXT NOT NULL DEFAULT 'paquete',
  precio_hasta REAL NOT NULL,
  precio_desde REAL NOT NULL,
  fecha_corte TEXT NOT NULL         -- ISO date: a partir de esta fecha de ENTREGA rige precio_desde
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  ciudad TEXT,
  lista_difusion TEXT              -- Colegios/Escuelas | Clubes | Negocios | (libre)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_pedido TEXT NOT NULL,
  fecha_entrega TEXT NOT NULL,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','Remito Enviado','Entregado')),
  texto_remito TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedido_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL     -- fijado al momento de crear el pedido, según fecha de entrega
);

CREATE TABLE IF NOT EXISTS progreso_uso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  fecha TEXT NOT NULL,
  cargo_lo_esperado INTEGER NOT NULL DEFAULT 0,
  UNIQUE(usuario_id, fecha)
);

-- Etapa 1 de la Hoja de Ruta: Stock simple, sin historial (se pisa el
-- valor al editar). "nombre" es la clave natural, mismo string que el
-- nombre de insumo usado en lib/produccion.ts.
CREATE TABLE IF NOT EXISTS stock_insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  cantidad REAL NOT NULL DEFAULT 0,
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Catálogo público: entidad COMERCIAL, separada a propósito de "productos"
-- (que es la entidad operativa de pedidos/producción con precios por fecha
-- de corte). produccion_ref queda como vínculo opcional a productos(id)
-- para cruzar catálogo <-> producción en una etapa futura, sin obligar ahora.
-- La foto vive como BLOB acá mismo (comprimida a ~100-200KB desde el editor)
-- porque esta app no tiene un storage de archivos aparte y el catálogo son
-- ~10 fotos chicas; se sirve por /api/catalogo/[id]/foto con caché.
CREATE TABLE IF NOT EXISTS catalogo_productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  peso TEXT NOT NULL DEFAULT '',
  descripcion TEXT NOT NULL DEFAULT '',
  precio REAL,                          -- NULL = "Precio a confirmar"
  badge TEXT NOT NULL DEFAULT '',
  tag_color TEXT NOT NULL DEFAULT '#B14539',
  foto BLOB,                            -- NULL = placeholder "Foto próximamente"
  foto_mime TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  orden INTEGER NOT NULL DEFAULT 0,
  produccion_ref INTEGER REFERENCES productos(id),
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Textos sueltos del catálogo público (Quiénes somos, los chips). Van en una
-- tabla clave/valor y no en el código para que los dueños los cambien desde
-- el panel sin depender de un despliegue.
CREATE TABLE IF NOT EXISTS catalogo_textos (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Condiciones de compra: una fila por condición para poder reordenarlas y
-- agregar o sacar sin tocar código. visible_mayorista/visible_distribuidor
-- controlan en qué página de precios aparece cada una (default: en las dos).
CREATE TABLE IF NOT EXISTS catalogo_condiciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  visible_mayorista INTEGER NOT NULL DEFAULT 1,
  visible_distribuidor INTEGER NOT NULL DEFAULT 1
);

-- Precio de cada insumo (materia prima), editable desde /insumos. Reemplaza
-- el array fijo que antes vivía en lib/costos.ts: "nombre" sigue siendo la
-- clave natural para cruzar con lib/produccion.ts y stock_insumos por string
-- exacto, igual que costos.ts ya hacía.
CREATE TABLE IF NOT EXISTS insumos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  unidad TEXT NOT NULL DEFAULT 'u',
  precio_unitario REAL NOT NULL DEFAULT 0,
  proveedor TEXT NOT NULL DEFAULT '—',
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Receta de cada producto: qué insumos y en qué cantidad lleva UNA unidad
-- de venta (un paquete, una bandeja) de ese producto. Se carga a mano desde
-- /recetas; no hay fórmula que la derive (a diferencia de lib/produccion.ts,
-- que calcula por LOTE de amasijo para decidir compras).
CREATE TABLE IF NOT EXISTS receta_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE CASCADE,
  cantidad REAL NOT NULL,
  UNIQUE(producto_id, insumo_id)
);

-- Migración única de los precios que antes vivían en lib/costos.ts. OR
-- IGNORE + UNIQUE(nombre) hace que esto no duplique nada en los arranques
-- siguientes. La unidad de cada insumo se copió de lib/produccion.ts, donde
-- ya estaba declarada por insumo (los de packaging son todos "u").
INSERT OR IGNORE INTO insumos (nombre, unidad, precio_unitario, proveedor) VALUES
  ('Huevo', 'u', 116.67, 'Huvero'),
  ('Vainilla', 'ml', 1.2, 'Emeth · Insupar'),
  ('Colorante amarillo', 'cm³', 1.28, 'Emeth · Insupar'),
  ('Miel', 'cm³', 4, 'Apicultor local'),
  ('Sorbato de potasio', 'g', 17, 'CGA · Insupar/ISCO'),
  ('Propionato de calcio', 'g', 6, 'CGA · Insupar/ISCO'),
  ('Azúcar', 'kg', 1080, 'GAMA'),
  ('Margarina', 'kg', 6170, 'Cordobesa · ISCO Varisco'),
  ('Maicena (Femag)', 'kg', 1340, 'Insupar'),
  ('Harina 000', 'kg', 740, 'Estrella del Paraná · ISCO Varisco'),
  ('Polvo de hornear', 'g', 5.6, 'Prindal · ISCO Varisco'),
  ('Bicarbonato de sodio', 'g', 6, '—'),
  ('Esencia de manteca', 'ml', 1.6, '—'),
  ('Dulce de leche', 'kg', 2350, 'La Colonias'),
  ('Membrillo', 'kg', 2200, '—'),
  ('Coco rallado', 'kg', 7200, '—'),
  ('Dulce de batata', 'kg', 2400, 'Multiprocesadora'),
  ('Mermelada de arándano', 'kg', 6200, '—'),
  ('Frutos del bosque', 'kg', 10600, '—'),
  ('Azúcar impalpable', 'kg', 1600, '—'),
  ('Albúmina', 'g', 60, '—'),
  ('Glucosa', 'g', 2.24, '—'),
  ('Esencia de limón', 'ml', 4, '—'),
  ('Ácido acético', 'ml', 6, '—'),
  ('Bandeja plástica x7', 'u', 67, '—'),
  ('Bolsa impresa x7 (RNPA)', 'u', 97.46, 'Insupar'),
  ('Caja x7', 'u', 450, '—'),
  ('Etiqueta caja embalaje x7', 'u', 65, 'Impresora etiquetas'),
  ('Bandeja con tapa x14', 'u', 346.67, '—'),
  ('Etiqueta cierre x14', 'u', 83.24, 'Impresora etiquetas'),
  ('Bandeja abierta 320g Pepas', 'u', 410, 'Fran Descartables'),
  ('Etiqueta Pepas', 'u', 85, 'Cizalla');
`;

// Columnas agregadas después de que la tabla usuarios ya existía en
// producción: CREATE TABLE IF NOT EXISTS no las agrega solo. Se intentan
// una por una y se ignora el error de "duplicate column", que es lo que pasa
// en todos los arranques salvo el primero.
const COLUMNAS_NUEVAS = [
  "ALTER TABLE usuarios ADD COLUMN intentos_fallidos INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE usuarios ADD COLUMN bloqueado_hasta TEXT",
  // Mínimo de compra propio del producto (la Bandeja x14 pide 10 bandejas).
  // NULL = entra en el mínimo general surtido.
  "ALTER TABLE catalogo_productos ADD COLUMN minimo_propio INTEGER",
  // Tres listas de precios, una por canal. La columna "precio" que ya existía
  // es la MAYORISTA (era la única cuando se creó la tabla).
  "ALTER TABLE catalogo_productos ADD COLUMN precio_minorista REAL",
  "ALTER TABLE catalogo_productos ADD COLUMN precio_distribuidor REAL",
  // Qué condición se ve en cada página de precios (default: en las dos).
  "ALTER TABLE catalogo_condiciones ADD COLUMN visible_mayorista INTEGER NOT NULL DEFAULT 1",
  "ALTER TABLE catalogo_condiciones ADD COLUMN visible_distribuidor INTEGER NOT NULL DEFAULT 1",
  // Fecha de carga del cliente. Turso no permite default no-constante en
  // ALTER TABLE, así que la columna se agrega sin default y el valor lo pone
  // siempre la app al insertar (ver app/api/clientes/route.ts). Los clientes
  // que ya existían quedan con la fecha de esta migración (no se puede
  // reconstruir cuándo se cargó cada uno en el pasado).
  "ALTER TABLE clientes ADD COLUMN creado_en TEXT",
  "UPDATE clientes SET creado_en = datetime('now') WHERE creado_en IS NULL",
  // Canal comercial del pedido: define con qué lista de precios se valoriza
  // (ver precioPorCanal en lib/pricing.ts). NULL = pedidos anteriores a esta
  // columna; se leen como mayorista, que es la lista con la que se cargaron.
  "ALTER TABLE pedidos ADD COLUMN canal TEXT",
];

let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.executeMultiple(SCHEMA_SQL);
      for (const sql of COLUMNAS_NUEVAS) {
        try {
          await client.execute(sql);
        } catch {
          // La columna ya existe: es el caso normal, no hay nada que hacer.
        }
      }
    })();
  }
  return schemaReady;
}

function prepare(sql: string) {
  return {
    get: async (...args: any[]) => {
      await ensureSchema();
      const r = await client.execute({ sql, args });
      // Las filas de @libsql/client no son objetos planos (tienen metodos
      // propios), y Next.js no deja pasar eso de un Server Component a un
      // Client Component. Se convierten a objetos planos con el spread.
      return r.rows[0] ? ({ ...r.rows[0] } as any) : undefined;
    },
    all: async (...args: any[]) => {
      await ensureSchema();
      const r = await client.execute({ sql, args });
      return r.rows.map((row) => ({ ...row })) as any[];
    },
    run: async (...args: any[]) => {
      await ensureSchema();
      const r = await client.execute({ sql, args });
      return { changes: r.rowsAffected, lastInsertRowid: Number(r.lastInsertRowid) };
    },
  };
}

const db = { prepare, client, ensureSchema };

export default db;
