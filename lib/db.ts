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
`;

let schemaReady: Promise<unknown> | null = null;
function ensureSchema() {
  if (!schemaReady) schemaReady = client.executeMultiple(SCHEMA_SQL);
  return schemaReady;
}

function prepare(sql: string) {
  return {
    get: async (...args: any[]) => {
      await ensureSchema();
      const r = await client.execute({ sql, args });
      return r.rows[0] as any;
    },
    all: async (...args: any[]) => {
      await ensureSchema();
      const r = await client.execute({ sql, args });
      return r.rows as any[];
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
