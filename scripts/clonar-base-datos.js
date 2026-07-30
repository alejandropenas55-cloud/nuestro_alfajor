// Copia TODOS los datos de una base Turso a otra, reemplazando por completo
// lo que haya en el destino (se borra y se vuelve a cargar igual que el origen).
//
// Uso:
//   node scripts/clonar-base-datos.js --de production --a staging
//   node scripts/clonar-base-datos.js --de staging --a production --confirmo-produccion
//
// El destino "production" exige el flag extra "--confirmo-produccion" a
// proposito: es una traba mas para que nunca se pise produccion por
// accidente con un copy/paste apurado. Cada vez que este comando apunte a
// "production" como destino, hay que confirmarlo explicitamente en el chat
// con Alejandro antes de correrlo, mas alla de este flag.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

const AMBIENTES = {
  development: ".env.development",
  staging: ".env.staging",
  production: ".env.production",
};

// Orden pensado para respetar las referencias entre tablas: al borrar, las
// tablas "hijas" primero; al insertar, las "padres" primero.
const TABLAS_BORRAR_EN_ORDEN = ["pedido_items", "progreso_uso", "pedidos", "clientes", "productos", "usuarios"];
const TABLAS_INSERTAR_EN_ORDEN = [
  { nombre: "usuarios", columnas: ["id", "nombre", "rol", "telefono", "pin", "etapa_habilitada"] },
  { nombre: "productos", columnas: ["id", "linea", "formato", "unidad", "precio_hasta", "precio_desde", "fecha_corte"] },
  { nombre: "clientes", columnas: ["id", "nombre", "ciudad", "lista_difusion"] },
  { nombre: "pedidos", columnas: ["id", "fecha_pedido", "fecha_entrega", "cliente_id", "estado", "texto_remito", "creado_en"] },
  { nombre: "pedido_items", columnas: ["id", "pedido_id", "producto_id", "cantidad", "precio_unitario"] },
  { nombre: "progreso_uso", columnas: ["id", "usuario_id", "fecha", "cargo_lo_esperado"] },
];

function leerEnv(nombreAmbiente) {
  const archivo = AMBIENTES[nombreAmbiente];
  if (!archivo) {
    throw new Error(`Ambiente desconocido: "${nombreAmbiente}". Usa: development, staging o production.`);
  }
  const ruta = path.join(__dirname, "..", archivo);
  const contenido = fs.readFileSync(ruta, "utf8");
  const env = {};
  for (const linea of contenido.split(/\r?\n/)) {
    const m = linea.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error(`Falta TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en ${archivo}.`);
  }
  return env;
}

function parsearArgs(argv) {
  const args = { de: null, a: null, confirmoProduccion: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--de") args.de = argv[++i];
    else if (argv[i] === "--a") args.a = argv[++i];
    else if (argv[i] === "--confirmo-produccion") args.confirmoProduccion = true;
  }
  return args;
}

async function main() {
  const { de, a, confirmoProduccion } = parsearArgs(process.argv.slice(2));

  if (!de || !a) {
    console.error('Uso: node scripts/clonar-base-datos.js --de <ambiente> --a <ambiente>');
    process.exit(1);
  }
  if (de === a) {
    console.error("El origen y el destino no pueden ser el mismo ambiente.");
    process.exit(1);
  }
  if (a === "production" && !confirmoProduccion) {
    console.error(
      'Para escribir en "production" hay que agregar el flag --confirmo-produccion. ' +
        "Esto va a BORRAR y REEMPLAZAR por completo la base de produccion real."
    );
    process.exit(1);
  }

  const envOrigen = leerEnv(de);
  const envDestino = leerEnv(a);

  const origen = createClient({ url: envOrigen.TURSO_DATABASE_URL, authToken: envOrigen.TURSO_AUTH_TOKEN });
  const destino = createClient({ url: envDestino.TURSO_DATABASE_URL, authToken: envDestino.TURSO_AUTH_TOKEN });

  console.log(`Leyendo datos de "${de}"...`);
  const datosPorTabla = {};
  for (const { nombre, columnas } of TABLAS_INSERTAR_EN_ORDEN) {
    const resultado = await origen.execute(`SELECT ${columnas.join(", ")} FROM ${nombre}`);
    datosPorTabla[nombre] = resultado.rows;
    console.log(`  ${nombre}: ${resultado.rows.length} filas`);
  }

  console.log(`Reemplazando datos en "${a}"...`);
  const tx = await destino.transaction("write");
  try {
    for (const tabla of TABLAS_BORRAR_EN_ORDEN) {
      await tx.execute(`DELETE FROM ${tabla}`);
    }
    for (const { nombre, columnas } of TABLAS_INSERTAR_EN_ORDEN) {
      const filas = datosPorTabla[nombre];
      const placeholders = columnas.map(() => "?").join(", ");
      for (const fila of filas) {
        await tx.execute({
          sql: `INSERT INTO ${nombre} (${columnas.join(", ")}) VALUES (${placeholders})`,
          args: columnas.map((c) => fila[c]),
        });
      }
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  console.log(`Listo. "${a}" ahora es una copia exacta de "${de}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
