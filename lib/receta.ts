// --------------------------------------------------------------------------
// Receta por producto: qué insumos y en qué cantidad lleva UNA unidad de
// venta (un paquete, una bandeja). No confundir con lib/produccion.ts, que
// calcula por LOTE de amasijo para decidir compras — esto es costo por
// unidad vendida, para ver margen.
// --------------------------------------------------------------------------

import db from "./db";
import { INSUMOS_MASA, CONST } from "./produccion";
import type { Producto } from "./producto-types";

// Etapas del proceso productivo relevado, en el orden en que ocurren en
// fábrica (mismas hojas del Excel NuestroAlfajor_Sistema_Produccion.xlsx:
// Amasijo-Horneado, Relleno-Glase, Armado-Packaging; el baño de chocolate
// va después del relleno, antes de embolsar).
export const ETAPAS_RECETA = ["Masa", "Relleno", "Glasé", "Baño", "Packaging"] as const;
export type EtapaReceta = (typeof ETAPAS_RECETA)[number];

// Orden de los insumos DENTRO de cada etapa, tal como se relevaron. La masa
// sale directo de INSUMOS_MASA para no tener dos listas que se desfasen.
const ORDEN_POR_ETAPA: Record<EtapaReceta, string[]> = {
  Masa: [...INSUMOS_MASA.map((i) => i.nombre), "Chocolate en polvo", "Tapas malteadas (Don Jesús)"],
  Relleno: [
    "Dulce de leche",
    "Membrillo",
    "Coco rallado",
    "Dulce de batata",
    "Mermelada de arándano",
    "Frutos del bosque",
  ],
  Glasé: ["Azúcar impalpable", "Albúmina", "Glucosa", "Esencia de limón", "Ácido acético"],
  Baño: [],
  Packaging: [
    "Bandeja plástica x7",
    "Bolsa impresa x7 (RNPA)",
    "Bolsa impresa chocolate semiamargo x7",
    "Bolsa impresa chocolate blanco x7",
    "Caja x7",
    "Etiqueta caja embalaje x7",
    "Bandeja con tapa x14",
    "Etiqueta cierre x14",
    "Bandeja abierta 320g Pepas",
    "Etiqueta Pepas",
  ],
};

// Insumos cargados desde /insumos que no están en las listas de arriba
// (p. ej. los chocolates de cobertura): se ubican por palabra clave y van al
// final de su etapa. Si no matchea nada, van a Masa.
function etapaPorPalabraClave(nombre: string): EtapaReceta {
  const n = nombre.toLowerCase();
  if (/bandeja|bolsa|caja|etiqueta|film/.test(n)) return "Packaging";
  if (/chocolate|cobertura|baño/.test(n)) return "Baño";
  if (/glas/.test(n)) return "Glasé";
  if (/dulce|mermelada|relleno/.test(n)) return "Relleno";
  return "Masa";
}

export function ubicacionEnProceso(nombre: string): { etapa: EtapaReceta; orden: number } {
  for (const etapa of ETAPAS_RECETA) {
    const pos = ORDEN_POR_ETAPA[etapa].indexOf(nombre);
    if (pos !== -1) return { etapa, orden: pos };
  }
  return { etapa: etapaPorPalabraClave(nombre), orden: Number.MAX_SAFE_INTEGER };
}

export type LineaReceta = {
  id: number;
  insumo_id: number;
  nombre: string;
  unidad: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  etapa: EtapaReceta;
  // true = la cantidad sale del amasijo relevado, no se carga a mano.
  calculada: boolean;
};

// La masa de Maicena/Frutal y de Pepas NO se carga a mano: sale de
// INSUMOS_MASA (cantidad por amasijo) repartida entre lo que rinde el
// amasijo. Se cargó a mano una vez y quedó el amasijo entero en un solo
// paquete (4 kg de azúcar en un x7) — así no puede volver a pasar, y si
// cambia el rendimiento se actualizan todas las recetas juntas.
function masaDelProducto(
  producto: Producto
): { campo: "porAmasijoMF" | "porAmasijoPepas"; fraccionDeAmasijo: number } | null {
  const unidades = producto.formato === "bandeja18" ? 18 : Number(producto.formato.replace("x", ""));
  if (!unidades) return null;
  if (producto.linea === "Maicena" || producto.linea === "Frutal") {
    return { campo: "porAmasijoMF", fraccionDeAmasijo: unidades / CONST.ALFAJORES_POR_AMASIJO_MF };
  }
  if (producto.linea.startsWith("Pepas")) {
    return { campo: "porAmasijoPepas", fraccionDeAmasijo: unidades / CONST.PEPAS_POR_AMASIJO };
  }
  return null; // Santafesino (tapas compradas), chocolates (masa sin relevar)
}

async function lineasDeMasaCalculadas(
  producto: Producto,
  masa: NonNullable<ReturnType<typeof masaDelProducto>>
): Promise<Omit<LineaReceta, "subtotal" | "etapa">[]> {
  const precios = (await db
    .prepare("SELECT id, nombre, unidad, precio_unitario FROM insumos")
    .all()) as { id: number; nombre: string; unidad: string; precio_unitario: number }[];
  const porNombre = new Map(precios.map((p) => [p.nombre, p]));

  return INSUMOS_MASA.filter((i) => i[masa.campo] > 0).map((i) => {
    const insumo = porNombre.get(i.nombre);
    return {
      id: -(insumo?.id ?? 0) || -1,
      insumo_id: insumo?.id ?? 0,
      nombre: i.nombre,
      unidad: insumo?.unidad ?? i.unidad,
      precio_unitario: insumo?.precio_unitario ?? 0,
      cantidad: Math.round(i[masa.campo] * masa.fraccionDeAmasijo * 10000) / 10000,
      calculada: true,
    };
  });
}

export async function listarRecetaDeProducto(productoId: number): Promise<LineaReceta[]> {
  const producto = (await db.prepare("SELECT * FROM productos WHERE id = ?").get(productoId)) as
    | Producto
    | undefined;

  const cargadas = ((await db
    .prepare(
      `SELECT ri.id, ri.insumo_id, i.nombre, i.unidad, i.precio_unitario, ri.cantidad
       FROM receta_items ri
       JOIN insumos i ON i.id = ri.insumo_id
       WHERE ri.producto_id = ?
       ORDER BY i.nombre`
    )
    .all(productoId)) as Omit<LineaReceta, "subtotal" | "etapa" | "calculada">[]).map((f) => ({
    ...f,
    calculada: false,
  }));

  // Si el producto tiene masa relevada, las líneas de masa cargadas a mano
  // se ignoran (quedan en la base, pero no suman) y se usan las calculadas.
  const masa = producto ? masaDelProducto(producto) : null;
  const nombresMasa = new Set(INSUMOS_MASA.map((i) => i.nombre));
  const filas = masa
    ? [
        ...(await lineasDeMasaCalculadas(producto!, masa)),
        ...cargadas.filter((f) => !nombresMasa.has(f.nombre)),
      ]
    : cargadas;

  // Orden del proceso productivo, no alfabético. El ORDER BY de arriba solo
  // desempata los insumos que no están en ORDEN_POR_ETAPA (sort es estable).
  return filas
    .map((f) => ({ f, ...ubicacionEnProceso(f.nombre) }))
    .sort(
      (a, b) =>
        ETAPAS_RECETA.indexOf(a.etapa) - ETAPAS_RECETA.indexOf(b.etapa) || a.orden - b.orden
    )
    .map(({ f, etapa }) => ({
      ...f,
      etapa,
      subtotal: Math.round(f.cantidad * f.precio_unitario * 100) / 100,
    }));
}

export async function costoProducto(productoId: number): Promise<number> {
  const lineas = await listarRecetaDeProducto(productoId);
  return Math.round(lineas.reduce((a, l) => a + l.subtotal, 0) * 100) / 100;
}
