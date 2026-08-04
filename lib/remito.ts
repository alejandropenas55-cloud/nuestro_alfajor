import { NOMBRE_CANAL, nombreProducto, type Producto } from "./pricing";
import type { Lista } from "./formato";

export type ItemRemito = {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
};

function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Genera el texto de remito tal como lo produce hoy el Excel: itemizado,
 * con emojis, subtotales y total, listo para copiar y pegar en WhatsApp.
 */
export function generarTextoRemito(params: {
  clienteNombre: string;
  fechaEntrega: string;
  items: ItemRemito[];
  /** Con qué lista de precios se valorizó (ver lib/pricing.ts). */
  canal: Lista;
}): string {
  const { clienteNombre, fechaEntrega, items, canal } = params;

  const lineas = items.map((it) => {
    const subtotal = it.cantidad * it.precioUnitario;
    return `🧁 ${it.cantidad} x ${nombreProducto(it.producto)} — $${it.precioUnitario.toLocaleString(
      "es-AR"
    )} c/u = $${subtotal.toLocaleString("es-AR")}`;
  });

  const total = items.reduce((a, it) => a + it.cantidad * it.precioUnitario, 0);

  return [
    `📦 *Nuestro Alfajor* — Remito`,
    `👤 Cliente: ${clienteNombre}`,
    `📅 Entrega: ${fechaLegible(fechaEntrega)}`,
    `🏷️ Lista: ${NOMBRE_CANAL[canal]}`,
    ``,
    ...lineas,
    ``,
    `💰 *Total: $${total.toLocaleString("es-AR")}*`,
  ].join("\n");
}
