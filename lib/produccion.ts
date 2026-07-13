// --------------------------------------------------------------------------
// Fórmulas de producción — traducidas 1:1 de la sección 3 del documento de
// especificación. Estos números son datos de campo verificados con Javier,
// no aproximaciones: no redondear ni "prolijizar" las constantes.
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
};

export type ItemPedidoAgregado = {
  linea: string; // Maicena | Frutal | Santafesino | Pepas...
  formato: string; // x7 | x14 | bandeja18
  cantidad: number; // cantidad de paquetes/bandejas (no de alfajores sueltos)
};

export type CalculoManana = {
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
};

export function calcularManana(
  fecha: string,
  items: ItemPedidoAgregado[]
): CalculoManana {
  const cantX7 = (linea: string) =>
    items
      .filter((i) => i.linea === linea && i.formato === "x7")
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
  const tapasSantafesino = alfajoresSantafesino * CONST.TAPAS_POR_ALFAJOR_SANTAFESINO;
  const kgTapasDonJesus = Math.ceil(
    (tapasSantafesino / CONST.TAPAS_POR_KG_DON_JESUS) * 100
  ) / 100;

  // Horneadas físicas: todo amasijo (MF y Pepas) se hornea, Santafesino no.
  const horneadas = totalAmasijos * CONST.HORNEADAS_POR_AMASIJO;
  const garrafas = Math.ceil(horneadas / CONST.HORNEADAS_POR_GARRAFA);

  const paquetesX7Totales =
    paquetesMaicenaX7 + paquetesFrutalX7 + paquetesSantafesinoX7;

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
  };
}
