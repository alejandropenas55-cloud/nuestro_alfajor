import type { Lista } from "./formato";

// --------------------------------------------------------------------------
// Lee un pedido pegado desde WhatsApp y lo convierte en cantidades por
// producto, para precargar el formulario de Pedidos.
//
// Está pensado para los mensajes que arman los propios catálogos de la casa
// (/catalogo, /mayorista y /distribuidor): como el texto lo genera el sistema,
// se puede leer de forma exacta, sin IA, sin costo y sin depender de internet.
// Un mensaje escrito a mano por el cliente se va a leer solo en parte: lo que
// no se entienda se devuelve en "noLeidos" para cargarlo a mano, nunca se
// descarta en silencio.
//
// Esta función es pura: no toca la base ni la red. Corre en el navegador con
// los datos que la página ya bajó.
// --------------------------------------------------------------------------

/** Un producto del catálogo comercial, con su vínculo al producto operativo. */
export type ProductoCatalogo = {
  nombre: string;
  produccion_ref: number | null;
};

export type ItemLeido = {
  producto_id: number;
  cantidad: number;
  /** Nombre comercial tal como venía en el mensaje, para poder mostrarlo. */
  nombre: string;
};

export type RenglonNoLeido = {
  texto: string;
  motivo:
    // El renglón tiene forma de pedido pero el producto no está en el catálogo.
    | "producto_desconocido"
    // El producto existe en el catálogo pero nadie lo vinculó todavía con un
    // producto del sistema (se arregla desde Catálogo → Editar).
    | "producto_sin_vincular";
};

export type PedidoPegado = {
  /** De qué catálogo salió el mensaje. null = no se pudo reconocer. */
  canal: Lista | null;
  items: ItemLeido[];
  noLeidos: RenglonNoLeido[];
  /** Renglones sueltos que no son ni saludo ni total ni pedido (ej. "para el viernes"). */
  textoExtra: string[];
};

/**
 * Renglón de pedido: "10x Alfajor de Maicena x7". El nombre del producto puede
 * contener "x7" o "x14", por eso la cantidad se toma solo del arranque.
 */
const RENGLON = /^\s*(\d{1,4})\s*x\s+(.+?)\s*$/i;

/**
 * Precio al final del renglón: " — $25.000" o " — precio a confirmar". Se
 * saca por el final y no partiendo por el guión, porque hay productos que
 * llevan guión en el nombre ("Pepas — Dulce de leche").
 */
const PRECIO_AL_FINAL = /\s*[—–-]\s*(\$\s*[\d.,]+|precio a confirmar)\s*$/i;

/** Saludo, total y cierre: los arma el catálogo y no aportan nada al pedido. */
const RELLENO = [
  /^hola[!¡\s]/i,
  /^total\b/i,
  /^\(sabemos/i,
  /^[¿?]?coordinamos/i,
  /^gracias/i,
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca los acentos: "arandano" = "arandano"
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * De qué catálogo salió el mensaje. Se reconoce por el saludo que pone cada
 * página (ver CANAL en components/ListaPrecios.tsx y el saludo de
 * components/CatalogoPublico.tsx).
 */
export function detectarCanal(texto: string): Lista | null {
  const t = normalizar(texto);
  if (t.includes("distribuidores")) return "distribuidor";
  if (t.includes("revendedores") || t.includes("pedido mayorista")) return "mayorista";
  if (t.includes("quiero hacer un pedido")) return "minorista";
  return null;
}

export function leerPedidoPegado(
  texto: string,
  catalogo: ProductoCatalogo[]
): PedidoPegado {
  // Índice por nombre normalizado. Si dos productos del catálogo normalizan
  // igual, gana el primero: el catálogo no debería tener nombres repetidos.
  const porNombre = new Map<string, ProductoCatalogo>();
  for (const p of catalogo) {
    const clave = normalizar(p.nombre);
    if (clave && !porNombre.has(clave)) porNombre.set(clave, p);
  }

  // Las cantidades se acumulan: si el mismo producto aparece en dos renglones
  // (el cliente lo agregó dos veces), se suman en vez de pisarse.
  const acumulado = new Map<number, ItemLeido>();
  const noLeidos: RenglonNoLeido[] = [];
  const textoExtra: string[] = [];

  for (const crudo of texto.split(/\r?\n/)) {
    const linea = crudo.trim();
    if (!linea) continue;
    if (RELLENO.some((r) => r.test(linea))) continue;

    const m = RENGLON.exec(linea);
    if (!m) {
      textoExtra.push(linea);
      continue;
    }

    const cantidad = parseInt(m[1], 10);
    const nombre = m[2].replace(PRECIO_AL_FINAL, "").trim();
    const producto = porNombre.get(normalizar(nombre));

    if (!producto) {
      noLeidos.push({ texto: linea, motivo: "producto_desconocido" });
      continue;
    }
    if (producto.produccion_ref === null) {
      noLeidos.push({ texto: linea, motivo: "producto_sin_vincular" });
      continue;
    }
    if (cantidad <= 0) {
      noLeidos.push({ texto: linea, motivo: "producto_desconocido" });
      continue;
    }

    const yaEstaba = acumulado.get(producto.produccion_ref);
    if (yaEstaba) {
      yaEstaba.cantidad += cantidad;
    } else {
      acumulado.set(producto.produccion_ref, {
        producto_id: producto.produccion_ref,
        cantidad,
        nombre: producto.nombre,
      });
    }
  }

  return {
    canal: detectarCanal(texto),
    items: [...acumulado.values()],
    noLeidos,
    textoExtra,
  };
}
