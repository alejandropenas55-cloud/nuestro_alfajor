// --------------------------------------------------------------------------
// Planilla de producción semanal — el papel que Mercedes usa en la fábrica.
//
// Reemplaza la hoja de la libreta anillada: se imprime el lunes a la mañana
// con la semana completa (lunes a viernes) y las cantidades ya calculadas a
// partir de los pedidos cargados. Producción corrige a mano arriba de lo
// impreso a medida que entran pedidos nuevos durante la semana.
//
// La primera columna NO es solo la fecha: el formato ddmmaa (sin barras ni
// espacios) ES el número de lote del día. Por eso se genera acá y no se
// formatea en la vista — es un dato, no una decoración.
// --------------------------------------------------------------------------

export type ColumnaPlanilla = {
  id: string;
  /** Encabezado tal cual se imprime, con las abreviaturas de la fábrica. */
  titulo: string;
  /** Producto en la base con el que se precarga la columna. Sin esto, la
   *  columna se imprime vacía para completar a mano. */
  linea?: string;
  formato?: string;
};

// El orden de este array es el orden de las columnas en el papel. Los títulos
// son las abreviaturas que usa producción, no los nombres del sistema: la
// planilla la lee la gente de la fábrica, no el sistema.
export const COLUMNAS_PLANILLA: ColumnaPlanilla[] = [
  { id: "M", titulo: "M", linea: "Maicena", formato: "x7" },
  { id: "F", titulo: "F", linea: "Frutal", formato: "x7" },
  { id: "SF", titulo: "SF", linea: "Santafesino", formato: "x7" },
  { id: "x14", titulo: "x 14", linea: "Maicena", formato: "x14" },
  // CN = Chocolate Negro, que en el sistema se llama "Chocolate Semiamargo"
  // (es el mismo producto: la fábrica le dice negro, la lista semiamargo).
  { id: "CN", titulo: "CN", linea: "Chocolate Semiamargo", formato: "x7" },
  { id: "CB", titulo: "CB", linea: "Chocolate Blanco", formato: "x7" },
  { id: "PM", titulo: "P.M", linea: "Pepas Membrillo", formato: "bandeja18" },
  { id: "PB", titulo: "P.B", linea: "Pepas Batata", formato: "bandeja18" },
  { id: "PDDL", titulo: "P. DDL", linea: "Pepas DDL", formato: "bandeja18" },
];

// Incluye el sábado: hay pedidos con entrega en sábado y quedaban afuera de la
// planilla. El domingo no se produce.
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export type DiaPlanilla = {
  /** ISO (YYYY-MM-DD), para las consultas. */
  fecha: string;
  /** ddmmaa — lo que se imprime en la primera columna y es el N° de lote. */
  lote: string;
  dia: string;
  /** Cantidad por id de columna. Vacío si no hay pedidos para ese día. */
  cantidades: Record<string, number>;
};

// Las fechas se manipulan al mediodía UTC a propósito: construir un Date
// desde "YYYY-MM-DD" lo interpreta como medianoche UTC y en Argentina (UTC-3)
// eso cae el día anterior, así que el lunes salía domingo.
function aDate(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`);
}

function aIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** El lunes de la semana a la que pertenece esa fecha. */
export function lunesDeLaSemana(iso: string): string {
  const d = aDate(iso);
  const diaSemana = d.getUTCDay(); // 0 = domingo
  const retroceder = diaSemana === 0 ? 6 : diaSemana - 1;
  d.setUTCDate(d.getUTCDate() - retroceder);
  return aIso(d);
}

/** Las fechas de la semana de producción (lunes a sábado) desde un lunes. */
export function diasHabiles(lunesIso: string): string[] {
  const d = aDate(lunesIso);
  return DIAS_SEMANA.map((_, i) => {
    const f = new Date(d);
    f.setUTCDate(d.getUTCDate() + i);
    return aIso(f);
  });
}

/** ddmmaa, sin separadores: es el número de lote del día. */
export function loteDeFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}${m}${y.slice(2)}`;
}

export function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export type FilaPedidoAgregada = {
  fecha_entrega: string;
  linea: string;
  formato: string;
  cantidad: number;
};

/**
 * Cruza los pedidos ya agregados por día/línea/formato contra las columnas
 * de la planilla y devuelve las cinco filas listas para imprimir.
 */
export function armarSemana(
  lunesIso: string,
  filas: FilaPedidoAgregada[]
): DiaPlanilla[] {
  return diasHabiles(lunesIso).map((fecha, i) => {
    const cantidades: Record<string, number> = {};

    for (const col of COLUMNAS_PLANILLA) {
      if (!col.linea || !col.formato) continue;
      const total = filas
        .filter(
          (f) =>
            f.fecha_entrega === fecha &&
            f.linea === col.linea &&
            f.formato === col.formato
        )
        .reduce((a, f) => a + Number(f.cantidad), 0);
      if (total > 0) cantidades[col.id] = total;
    }

    return { fecha, lote: loteDeFecha(fecha), dia: DIAS_SEMANA[i], cantidades };
  });
}
