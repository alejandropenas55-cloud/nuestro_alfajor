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
