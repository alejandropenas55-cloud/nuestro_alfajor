const { createClient } = require("@libsql/client");

if (!process.env.TURSO_DATABASE_URL) {
  console.error("Falta TURSO_DATABASE_URL (y TURSO_AUTH_TOKEN) en el entorno. Ver .env.example.");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await client.executeMultiple(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('javier','mercedes','francisco','alejandro')),
  telefono TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  etapa_habilitada INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea TEXT NOT NULL,
  formato TEXT NOT NULL,
  unidad TEXT NOT NULL DEFAULT 'paquete',
  precio_hasta REAL NOT NULL,
  precio_desde REAL NOT NULL,
  fecha_corte TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  ciudad TEXT,
  lista_difusion TEXT
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
  precio_unitario REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS progreso_uso (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  fecha TEXT NOT NULL,
  cargo_lo_esperado INTEGER NOT NULL DEFAULT 0,
  UNIQUE(usuario_id, fecha)
);
`);

  const CORTE = "2026-07-01";
  const productos = [
    { linea: "Maicena", formato: "x7", precio_hasta: 2500, precio_desde: 2500 },
    { linea: "Frutal", formato: "x7", precio_hasta: 2500, precio_desde: 2500 },
    { linea: "Santafesino", formato: "x7", precio_hasta: 2500, precio_desde: 2500 },
    { linea: "Maicena", formato: "x14", precio_hasta: 4700, precio_desde: 5000 },
    // Las 5 variedades de Pepas se piden por bandeja, cada una por separado
    // (mismo precio para las 5) — así lo modela el Excel real, columnas J:N.
    { linea: "Pepas DDL", formato: "bandeja18", precio_hasta: 2500, precio_desde: 2600 },
    { linea: "Pepas Membrillo", formato: "bandeja18", precio_hasta: 2500, precio_desde: 2600 },
    { linea: "Pepas Arándano", formato: "bandeja18", precio_hasta: 2500, precio_desde: 2600 },
    { linea: "Pepas Batata", formato: "bandeja18", precio_hasta: 2500, precio_desde: 2600 },
    { linea: "Pepas Frutos del Bosque", formato: "bandeja18", precio_hasta: 2500, precio_desde: 2600 },
  ];

  const { rows: existentes } = await client.execute("SELECT COUNT(*) AS c FROM productos");
  if (Number(existentes[0].c) === 0) {
    for (const p of productos) {
      await client.execute({
        sql: `INSERT INTO productos (linea, formato, unidad, precio_hasta, precio_desde, fecha_corte)
              VALUES (?, ?, 'paquete', ?, ?, ?)`,
        args: [p.linea, p.formato, p.precio_hasta, p.precio_desde, CORTE],
      });
    }
    console.log(`Cargados ${productos.length} productos.`);
  } else {
    console.log("Productos ya cargados, no se vuelve a sembrar.");
  }

  // 52 clientes históricos reales, cargados del Excel de mayo 2026 (no son
  // datos de prueba: son referencia real para autocompletar pedidos).
  const clientes = [
    { nombre: "Amelia (Esc. Milagrosa)", ciudad: null, lista_difusion: null },
    { nombre: "Amparo Maternal", ciudad: null, lista_difusion: null },
    { nombre: "Graciela (Esc. Alvear Nogoyá)", ciudad: null, lista_difusion: null },
    { nombre: "Vicky (Esc. Oro Verde)", ciudad: null, lista_difusion: null },
    { nombre: "Gabriela Colmonez (Esc. Strobel)", ciudad: null, lista_difusion: null },
    { nombre: "Oscar (Cerrito)", ciudad: null, lista_difusion: null },
    { nombre: "Agustín (Esc. Col. Avellaneda)", ciudad: null, lista_difusion: null },
    { nombre: "Ileana (Club Ciclista)", ciudad: null, lista_difusion: null },
    { nombre: "Belén Mendieta (J. Oro Verde)", ciudad: null, lista_difusion: null },
    { nombre: "Yanina Dechallzi", ciudad: null, lista_difusion: null },
    { nombre: "Pastor Diego (Rafaela)", ciudad: null, lista_difusion: null },
    { nombre: "Sandra Fischer", ciudad: null, lista_difusion: null },
    { nombre: "Marcelo (Club Seguí)", ciudad: null, lista_difusion: null },
    { nombre: "Nadia (Esc. Mañasco)", ciudad: null, lista_difusion: null },
    { nombre: "Escuela Hogar", ciudad: null, lista_difusion: null },
    { nombre: "Angi (Esc. Centenario)", ciudad: null, lista_difusion: null },
    { nombre: "Cristian (el Beto)", ciudad: null, lista_difusion: null },
    { nombre: "Elizabeth Comar", ciudad: null, lista_difusion: null },
    { nombre: "Paula (San Benito)", ciudad: null, lista_difusion: null },
    { nombre: "Diamela", ciudad: null, lista_difusion: null },
    { nombre: "Hugo (Lafedar)", ciudad: null, lista_difusion: null },
    { nombre: "Andrea Hockey Rowing", ciudad: null, lista_difusion: null },
    { nombre: "Tiziana", ciudad: null, lista_difusion: null },
    { nombre: "Carolina Godoy", ciudad: null, lista_difusion: null },
    { nombre: "Flavia Aragón", ciudad: null, lista_difusion: null },
    { nombre: "Nahir Ruge", ciudad: null, lista_difusion: null },
    { nombre: "Gabriela Rubiolo", ciudad: null, lista_difusion: null },
    { nombre: "Julieta Beron", ciudad: null, lista_difusion: null },
    { nombre: "Cristina (el Beto)", ciudad: null, lista_difusion: null },
    { nombre: "Veronica Solioz (L. San Martín)", ciudad: null, lista_difusion: null },
    { nombre: "Agus Copelloti", ciudad: null, lista_difusion: null },
    { nombre: "Camila Urrutia", ciudad: null, lista_difusion: null },
    { nombre: "Keila", ciudad: null, lista_difusion: null },
    { nombre: "Mia Scarpa", ciudad: null, lista_difusion: null },
    { nombre: "Fiorela", ciudad: null, lista_difusion: null },
    { nombre: "Solcito Flores", ciudad: null, lista_difusion: null },
    { nombre: "Guadalupe Villanueva", ciudad: null, lista_difusion: null },
    { nombre: "Romina Bordou", ciudad: null, lista_difusion: null },
    { nombre: "Gerardo Cano", ciudad: null, lista_difusion: null },
    { nombre: "Fabián Jhouston", ciudad: null, lista_difusion: null },
    { nombre: "Lu (hija Ma. José)", ciudad: null, lista_difusion: null },
    { nombre: "Tortuguita", ciudad: null, lista_difusion: null },
    { nombre: "Andrés Britos", ciudad: null, lista_difusion: null },
    { nombre: "Noralli Orellanos", ciudad: null, lista_difusion: null },
    { nombre: "Coseza", ciudad: null, lista_difusion: null },
    { nombre: "Eugenia", ciudad: null, lista_difusion: null },
    { nombre: "Araceli UD", ciudad: null, lista_difusion: null },
    { nombre: "Paula Reynoso", ciudad: null, lista_difusion: null },
    { nombre: "Elena Tell", ciudad: null, lista_difusion: null },
    { nombre: "Jimena Lezcano", ciudad: null, lista_difusion: null },
    { nombre: "Rogelio Ariza", ciudad: null, lista_difusion: null },
    { nombre: "Crespo", ciudad: "Crespo", lista_difusion: null },
  ];
  for (const c of clientes) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO clientes (nombre, ciudad, lista_difusion) VALUES (?, ?, ?)`,
      args: [c.nombre, c.ciudad, c.lista_difusion],
    });
  }
  console.log(`Clientes verificados/cargados: ${clientes.length}.`);

  const usuarios = [
    { nombre: "Javier", rol: "javier", telefono: "+54 9 3434 64-3517", pin: "1234" },
    { nombre: "Mercedes", rol: "mercedes", telefono: "+54 9 3435 07-8807", pin: "1234" },
    { nombre: "Francisco", rol: "francisco", telefono: "+54 9 3434 75-5714", pin: "1234" },
    { nombre: "Alejandro", rol: "alejandro", telefono: "+54 9 3434 15-4109", pin: "1234" },
  ];
  for (const u of usuarios) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO usuarios (nombre, rol, telefono, pin, etapa_habilitada)
            VALUES (?, ?, ?, ?, 0)`,
      args: [u.nombre, u.rol, u.telefono, u.pin],
    });
  }

  console.log("Seed completo. Usuarios (Etapa 0, PIN 1234 para los cuatro):");
  for (const u of usuarios) console.log(`  ${u.nombre} — ${u.telefono}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
