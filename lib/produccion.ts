// --------------------------------------------------------------------------
// Fórmulas de producción — traducidas 1:1 de la sección 3 del documento de
// especificación y del Excel `NuestroAlfajor_Sistema_Produccion.xlsx`
// (hojas Amasijo-Horneado, Relleno-Glase, Armado-Packaging). Estos números
// son datos de campo verificados con Javier, no aproximaciones: no
// redondear ni "prolijizar" las constantes.
// --------------------------------------------------------------------------

export const CONST = {
  TAPAS_POR_AMASIJO_MF: 1508, // amasijo Maicena/Frutal (masa compartida)
  ALFAJORES_POR_AMASIJO_MF: 754, // = 1508 / 2 tapas por alfajor
  PEPAS_POR_AMASIJO: 1508,
  TAPAS_POR_ALFAJOR_SANTAFESINO: 3, // tapas compradas a Don Jesús
  TAPAS_POR_KG_DON_JESUS: 80,
  HORNEADAS_POR_AMASIJO: 2,
  HORNEADAS_POR_GARRAFA: 45, // garrafa de 45kg
  MAX_AMASIJOS_JORNADA_NORMAL: 3,
  PAQUETES_X7_POR_CAJA: 15,
  ALFAJORES_POR_PREPARADO_GLASE: 115, // Frutal + Santafesino comparten receta
};

// Insumos crudos por amasijo (Etapa 2 — no existían en el cálculo simplificado
// de Etapa 0). Cantidad por amasijo de masa Maicena/Frutal y por amasijo de
// masa Pepas; el necesario total es la suma de ambos aportes.
export const INSUMOS_MASA: {
  nombre: string;
  unidad: string;
  porAmasijoMF: number;
  porAmasijoPepas: number;
  proveedor: string;
}[] = [
  { nombre: "Huevo", unidad: "u", porAmasijoMF: 40, porAmasijoPepas: 40, proveedor: "Huvero" },
  { nombre: "Vainilla", unidad: "ml", porAmasijoMF: 100, porAmasijoPepas: 0, proveedor: "Emeth · Insupar" },
  { nombre: "Colorante amarillo", unidad: "cm³", porAmasijoMF: 10, porAmasijoPepas: 0, proveedor: "Emeth · Insupar" },
  { nombre: "Miel", unidad: "cm³", porAmasijoMF: 50, porAmasijoPepas: 0, proveedor: "Apicultor local" },
  { nombre: "Sorbato de potasio", unidad: "g", porAmasijoMF: 20, porAmasijoPepas: 0, proveedor: "CGA · Insupar/ISCO" },
  { nombre: "Propionato de calcio", unidad: "g", porAmasijoMF: 60, porAmasijoPepas: 0, proveedor: "CGA · Insupar/ISCO" },
  { nombre: "Azúcar", unidad: "kg", porAmasijoMF: 4, porAmasijoPepas: 4, proveedor: "GAMA" },
  { nombre: "Margarina", unidad: "kg", porAmasijoMF: 4, porAmasijoPepas: 4, proveedor: "Cordobesa · ISCO Varisco" },
  { nombre: "Maicena (Femag)", unidad: "kg", porAmasijoMF: 6, porAmasijoPepas: 0, proveedor: "Insupar" },
  { nombre: "Harina 000", unidad: "kg", porAmasijoMF: 4, porAmasijoPepas: 10, proveedor: "Estrella del Paraná · ISCO Varisco" },
  { nombre: "Polvo de hornear", unidad: "g", porAmasijoMF: 65, porAmasijoPepas: 80, proveedor: "Prindal · ISCO Varisco" },
  { nombre: "Bicarbonato de sodio", unidad: "g", porAmasijoMF: 0, porAmasijoPepas: 5, proveedor: "—" },
  { nombre: "Esencia de manteca", unidad: "ml", porAmasijoMF: 0, porAmasijoPepas: 50, proveedor: "—" },
];

// Capacidad de armado — referencia estática (María + Francisco), no depende
// de la fecha elegida.
export const CAPACIDAD_ARMADO = [
  { turno: "1ra hora", alfajoresPorHora: 504 },
  { turno: "2da hora", alfajoresPorHora: 392 },
  { turno: "3ra hora", alfajoresPorHora: 336, nota: "caída ~33% por cansancio, considerar rotación" },
];

export type ItemPedidoAgregado = {
  linea: string; // Maicena | Frutal | Santafesino | Pepas...
  formato: string; // x7 | x14 | bandeja18
  cantidad: number; // cantidad de paquetes/bandejas (no de alfajores sueltos)
};

export type InsumoCalculado = {
  nombre: string;
  unidad: string;
  necesarioTotal: number;
  proveedor?: string;
};

export type CalculoProduccion = {
  fecha: string;
  alfajoresMaicena: number;
  alfajoresFrutal: number;
  alfajoresSantafesino: number;
  pepasUnidades: number;
  amasijosMF: number;
  amasijosPepas: number;
  totalAmasijos: number;
  avisoAmasijos: boolean; // supera jornada normal (>3/día)
  kgTapasDonJesus: number;
  horneadas: number;
  garrafas: number;
  packaging: {
    bandejaPlasticaX7: number;
    bolsaImpresaX7: number;
    cajaX7: number;
    bandejaTapaIntegradaX14: number;
    etiquetaCierreX14: number;
    bandejaAbierta320g: number;
    etiquetaPepas: number;
  };
  // Etapa 2 — insumos crudos, sin Stock/Faltante todavía (eso es Etapa 1).
  insumosMasa: InsumoCalculado[];
  tapasSantafesino: InsumoCalculado; // unidades a comprar a Don Jesús, trackeable en Stock
  insumosRelleno: InsumoCalculado[];
  preparadosGlase: number;
  insumosGlase: InsumoCalculado[];
};

export function calcularProduccion(
  fecha: string,
  items: ItemPedidoAgregado[]
): CalculoProduccion {
  const cantX7 = (linea: string) =>
    items
      .filter((i) => i.linea === linea && i.formato === "x7")
      .reduce((a, i) => a + i.cantidad, 0);

  const bandejasPorLineaPepas = (linea: string) =>
    items
      .filter((i) => i.linea === linea && i.formato === "bandeja18")
      .reduce((a, i) => a + i.cantidad, 0);

  const paquetesMaicenaX7 = cantX7("Maicena");
  const paquetesMaicenaX14 = items
    .filter((i) => i.linea === "Maicena" && i.formato === "x14")
    .reduce((a, i) => a + i.cantidad, 0);
  const paquetesFrutalX7 = cantX7("Frutal");
  const paquetesSantafesinoX7 = cantX7("Santafesino");
  const bandejasPepas = items
    .filter((i) => i.formato === "bandeja18")
    .reduce((a, i) => a + i.cantidad, 0);

  const alfajoresMaicena = paquetesMaicenaX7 * 7 + paquetesMaicenaX14 * 14;
  const alfajoresFrutal = paquetesFrutalX7 * 7;
  const alfajoresSantafesino = paquetesSantafesinoX7 * 7;
  const pepasUnidades = bandejasPepas * 18;

  // Maicena + Frutal comparten masa/amasijo (sección 3.1 y 5.3)
  const tapasNecesariasMF = (alfajoresMaicena + alfajoresFrutal) * 2;
  const amasijosMF = Math.ceil(tapasNecesariasMF / CONST.TAPAS_POR_AMASIJO_MF);

  const amasijosPepas = Math.ceil(pepasUnidades / CONST.PEPAS_POR_AMASIJO);

  const totalAmasijos = amasijosMF + amasijosPepas; // Santafesino no amasija
  const avisoAmasijos = totalAmasijos > CONST.MAX_AMASIJOS_JORNADA_NORMAL;

  // Santafesino: tapas compradas a Don Jesús, 3 tapas/alfajor, 80 tapas/kg
  const tapasSantafesinoUnidades = alfajoresSantafesino * CONST.TAPAS_POR_ALFAJOR_SANTAFESINO;
  const kgTapasDonJesus = Math.ceil(
    (tapasSantafesinoUnidades / CONST.TAPAS_POR_KG_DON_JESUS) * 100
  ) / 100;

  // Horneadas físicas: todo amasijo (MF y Pepas) se hornea, Santafesino no.
  const horneadas = totalAmasijos * CONST.HORNEADAS_POR_AMASIJO;
  const garrafas = Math.ceil(horneadas / CONST.HORNEADAS_POR_GARRAFA);

  const paquetesX7Totales =
    paquetesMaicenaX7 + paquetesFrutalX7 + paquetesSantafesinoX7;

  // --- Etapa 2: insumos de masa (Amasijo-Horneado) ---
  const insumosMasa: InsumoCalculado[] = INSUMOS_MASA.map((i) => ({
    nombre: i.nombre,
    unidad: i.unidad,
    proveedor: i.proveedor,
    necesarioTotal:
      i.porAmasijoMF * amasijosMF + i.porAmasijoPepas * amasijosPepas,
  }));

  const tapasSantafesino: InsumoCalculado = {
    nombre: "Tapas malteadas (Don Jesús)",
    unidad: "u",
    proveedor: "Don Jesús",
    necesarioTotal: tapasSantafesinoUnidades,
  };

  // --- Etapa 2: rellenos (por variedad de Pepas, no el agregado) ---
  const pepasDDL = bandejasPorLineaPepas("Pepas DDL") * 18;
  const pepasMembrillo = bandejasPorLineaPepas("Pepas Membrillo") * 18;
  const pepasArandano = bandejasPorLineaPepas("Pepas Arándano") * 18;
  const pepasBatata = bandejasPorLineaPepas("Pepas Batata") * 18;
  const pepasFrutosBosque = bandejasPorLineaPepas("Pepas Frutos del Bosque") * 18;

  const insumosRelleno: InsumoCalculado[] = [
    {
      nombre: "Dulce de leche",
      unidad: "kg",
      proveedor: "La Colonias",
      necesarioTotal:
        (alfajoresMaicena * 25.51 + alfajoresSantafesino * 30 + pepasDDL * 7.5) / 1000,
    },
    {
      nombre: "Membrillo",
      unidad: "kg",
      necesarioTotal: (alfajoresFrutal * 21.74 + pepasMembrillo * 7.5) / 1000,
    },
    {
      nombre: "Coco rallado",
      unidad: "kg",
      necesarioTotal: (alfajoresMaicena * 0.71) / 1000,
    },
    {
      nombre: "Dulce de batata",
      unidad: "kg",
      necesarioTotal: (pepasBatata * 5) / 1000,
    },
    {
      nombre: "Mermelada de arándano",
      unidad: "kg",
      necesarioTotal: (pepasArandano * 7) / 1000,
    },
    {
      nombre: "Frutos del bosque",
      unidad: "kg",
      necesarioTotal: (pepasFrutosBosque * 7) / 1000,
    },
  ];

  // --- Etapa 2: glasé (Frutal + Santafesino) ---
  const alfajoresConGlase = alfajoresFrutal + alfajoresSantafesino;
  const preparadosGlase = Math.ceil(
    alfajoresConGlase / CONST.ALFAJORES_POR_PREPARADO_GLASE
  );

  const insumosGlase: InsumoCalculado[] = [
    { nombre: "Azúcar impalpable", unidad: "kg", necesarioTotal: preparadosGlase * 1.5 },
    { nombre: "Albúmina", unidad: "g", necesarioTotal: preparadosGlase * 20 },
    { nombre: "Glucosa", unidad: "g", necesarioTotal: preparadosGlase * 80 },
    { nombre: "Esencia de limón", unidad: "ml", necesarioTotal: preparadosGlase * 5 },
    { nombre: "Ácido acético", unidad: "ml", necesarioTotal: preparadosGlase * 2.5 },
  ];

  return {
    fecha,
    alfajoresMaicena,
    alfajoresFrutal,
    alfajoresSantafesino,
    pepasUnidades,
    amasijosMF,
    amasijosPepas,
    totalAmasijos,
    avisoAmasijos,
    kgTapasDonJesus,
    horneadas,
    garrafas,
    packaging: {
      bandejaPlasticaX7: paquetesX7Totales,
      bolsaImpresaX7: paquetesX7Totales,
      cajaX7: Math.ceil(paquetesX7Totales / CONST.PAQUETES_X7_POR_CAJA),
      bandejaTapaIntegradaX14: paquetesMaicenaX14,
      etiquetaCierreX14: paquetesMaicenaX14,
      bandejaAbierta320g: bandejasPepas,
      etiquetaPepas: bandejasPepas,
    },
    insumosMasa,
    tapasSantafesino,
    insumosRelleno,
    preparadosGlase,
    insumosGlase,
  };
}
