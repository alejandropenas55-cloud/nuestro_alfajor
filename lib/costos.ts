// --------------------------------------------------------------------------
// Etapa 3 — Costos de insumos por proveedor. Traducido 1:1 de la hoja
// "Orden de Compra" del Excel `NuestroAlfajor_Sistema_Produccion.xlsx`
// (filas 8-38). Datos de campo, no aproximaciones.
//
// IMPORTANTE — nunca importar este archivo desde un componente "use client".
// Es información sensible (precios de proveedores); solo debe vivir en
// código de servidor (rutas de API), para que nunca se empaquete en el
// JavaScript que se manda al navegador de alguien sin permiso para verla
// (ver lib/session.ts, puedeVerCostos).
//
// `nombre` coincide exacto con los strings ya usados en lib/produccion.ts
// y en la tabla stock_insumos, para poder cruzar por nombre sin mapear IDs.
// --------------------------------------------------------------------------

export type CostoInsumo = {
  nombre: string;
  precioUnitario: number;
  proveedor: string;
};

export const COSTOS_INSUMOS: CostoInsumo[] = [
  // --- Masa (Amasijo-Horneado) ---
  { nombre: "Huevo", precioUnitario: 116.67, proveedor: "Huvero" },
  { nombre: "Vainilla", precioUnitario: 1.2, proveedor: "Emeth · Insupar" },
  { nombre: "Colorante amarillo", precioUnitario: 1.28, proveedor: "Emeth · Insupar" },
  { nombre: "Miel", precioUnitario: 4, proveedor: "Apicultor local" },
  { nombre: "Sorbato de potasio", precioUnitario: 17, proveedor: "CGA · Insupar/ISCO" },
  { nombre: "Propionato de calcio", precioUnitario: 6, proveedor: "CGA · Insupar/ISCO" },
  { nombre: "Azúcar", precioUnitario: 1080, proveedor: "GAMA" },
  { nombre: "Margarina", precioUnitario: 6170, proveedor: "Cordobesa · ISCO Varisco" },
  { nombre: "Maicena (Femag)", precioUnitario: 1340, proveedor: "Insupar" },
  { nombre: "Harina 000", precioUnitario: 740, proveedor: "Estrella del Paraná · ISCO Varisco" },
  { nombre: "Polvo de hornear", precioUnitario: 5.6, proveedor: "Prindal · ISCO Varisco" },
  { nombre: "Bicarbonato de sodio", precioUnitario: 6, proveedor: "—" },
  { nombre: "Esencia de manteca", precioUnitario: 1.6, proveedor: "—" },

  // --- Rellenos y glasé (Relleno-Glasé) ---
  { nombre: "Dulce de leche", precioUnitario: 2350, proveedor: "La Colonias" },
  { nombre: "Membrillo", precioUnitario: 2200, proveedor: "—" },
  { nombre: "Coco rallado", precioUnitario: 7200, proveedor: "—" },
  { nombre: "Dulce de batata", precioUnitario: 2400, proveedor: "Multiprocesadora" },
  { nombre: "Mermelada de arándano", precioUnitario: 6200, proveedor: "—" },
  { nombre: "Frutos del bosque", precioUnitario: 10600, proveedor: "—" }, // 🚨 insumo caro — margen casi cero, no bajar precio de venta
  { nombre: "Azúcar impalpable", precioUnitario: 1600, proveedor: "—" },
  { nombre: "Albúmina", precioUnitario: 60, proveedor: "—" },
  { nombre: "Glucosa", precioUnitario: 2.24, proveedor: "—" },
  { nombre: "Esencia de limón", precioUnitario: 4, proveedor: "—" },
  { nombre: "Ácido acético", precioUnitario: 6, proveedor: "—" },

  // --- Packaging (Armado-Packaging) ---
  { nombre: "Bandeja plástica x7", precioUnitario: 67, proveedor: "—" },
  { nombre: "Bolsa impresa x7 (RNPA)", precioUnitario: 97.46, proveedor: "Insupar" },
  { nombre: "Caja x7", precioUnitario: 450, proveedor: "—" },
  { nombre: "Bandeja con tapa x14", precioUnitario: 346.67, proveedor: "—" },
  { nombre: "Etiqueta cierre x14", precioUnitario: 83.24, proveedor: "Impresora etiquetas" },
  { nombre: "Bandeja abierta 320g Pepas", precioUnitario: 410, proveedor: "Fran Descartables" },
  { nombre: "Etiqueta Pepas", precioUnitario: 85, proveedor: "Cizalla" },
];
