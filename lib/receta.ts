// --------------------------------------------------------------------------
// Receta por producto: qué insumos y en qué cantidad lleva UNA unidad de
// venta (un paquete, una bandeja). No confundir con lib/produccion.ts, que
// calcula por LOTE de amasijo para decidir compras — esto es costo por
// unidad vendida, para ver margen.
// --------------------------------------------------------------------------

import db from "./db";
import { INSUMOS_MASA } from "./produccion";

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
};

export async function listarRecetaDeProducto(productoId: number): Promise<LineaReceta[]> {
  const filas = (await db
    .prepare(
      `SELECT ri.id, ri.insumo_id, i.nombre, i.unidad, i.precio_unitario, ri.cantidad
       FROM receta_items ri
       JOIN insumos i ON i.id = ri.insumo_id
       WHERE ri.producto_id = ?
       ORDER BY i.nombre`
    )
    .all(productoId)) as Omit<LineaReceta, "subtotal" | "etapa">[];

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
