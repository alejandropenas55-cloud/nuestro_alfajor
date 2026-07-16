import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSesion, puedeVerCostos } from "@/lib/session";
import { calcularProduccion, type ItemPedidoAgregado, type InsumoCalculado } from "@/lib/produccion";
import { COSTOS_INSUMOS } from "@/lib/costos";

export async function GET(req: NextRequest) {
  const sesion = await getSesion();
  if (!sesion) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  if (!puedeVerCostos(sesion.rol)) {
    return NextResponse.json({ error: "Tu usuario no tiene permiso para ver esto." }, { status: 403 });
  }

  const fecha = req.nextUrl.searchParams.get("fecha");
  if (!fecha) return NextResponse.json({ error: "Falta la fecha." }, { status: 400 });

  // Acumulado hasta la fecha elegida: para decidir compras importa todo lo
  // pendiente, no la foto de un solo día (mismo criterio que Producción).
  const filasAcumulado = (await db
    .prepare(
      `SELECT pr.linea, pr.formato, SUM(pi.cantidad) AS cantidad
       FROM pedido_items pi
       JOIN pedidos p ON p.id = pi.pedido_id
       JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.fecha_entrega <= ? AND p.estado != 'Entregado'
       GROUP BY pr.linea, pr.formato`
    )
    .all(fecha)) as ItemPedidoAgregado[];

  const calculo = calcularProduccion(fecha, filasAcumulado);

  const stockFilas = (await db.prepare("SELECT nombre, cantidad FROM stock_insumos").all()) as {
    nombre: string;
    cantidad: number;
  }[];
  const stock: Record<string, number> = {};
  for (const f of stockFilas) stock[f.nombre] = f.cantidad;

  const packagingComoInsumos: InsumoCalculado[] = [
    { nombre: "Bandeja plástica x7", unidad: "u", necesarioTotal: calculo.packaging.bandejaPlasticaX7 },
    { nombre: "Bolsa impresa x7 (RNPA)", unidad: "u", necesarioTotal: calculo.packaging.bolsaImpresaX7 },
    { nombre: "Caja x7", unidad: "u", necesarioTotal: calculo.packaging.cajaX7 },
    { nombre: "Bandeja con tapa x14", unidad: "u", necesarioTotal: calculo.packaging.bandejaTapaIntegradaX14 },
    { nombre: "Etiqueta cierre x14", unidad: "u", necesarioTotal: calculo.packaging.etiquetaCierreX14 },
    { nombre: "Bandeja abierta 320g Pepas", unidad: "u", necesarioTotal: calculo.packaging.bandejaAbierta320g },
    { nombre: "Etiqueta Pepas", unidad: "u", necesarioTotal: calculo.packaging.etiquetaPepas },
  ];

  const todosLosInsumos: InsumoCalculado[] = [
    ...calculo.insumosMasa,
    ...calculo.insumosRelleno,
    ...calculo.insumosGlase,
    ...packagingComoInsumos,
  ];

  const costoPorNombre = new Map(COSTOS_INSUMOS.map((c) => [c.nombre, c]));

  const items = todosLosInsumos
    .map((insumo) => {
      const necesario = Math.round(insumo.necesarioTotal * 100) / 100;
      const stockActual = stock[insumo.nombre] ?? 0;
      const faltante = Math.max(Math.round((necesario - stockActual) * 100) / 100, 0);
      const costo = costoPorNombre.get(insumo.nombre);
      const precioUnitario = costo?.precioUnitario ?? 0;
      const proveedor = costo?.proveedor ?? "—";
      return {
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        faltante,
        precioUnitario,
        subtotal: Math.round(faltante * precioUnitario * 100) / 100,
        proveedor,
      };
    })
    .filter((i) => i.faltante > 0);

  const porProveedorMap = new Map<string, number>();
  for (const i of items) {
    porProveedorMap.set(i.proveedor, (porProveedorMap.get(i.proveedor) ?? 0) + i.subtotal);
  }
  const porProveedor = Array.from(porProveedorMap.entries())
    .map(([proveedor, subtotal]) => ({ proveedor, subtotal: Math.round(subtotal * 100) / 100 }))
    .sort((a, b) => b.subtotal - a.subtotal);

  const total = Math.round(items.reduce((a, i) => a + i.subtotal, 0) * 100) / 100;

  return NextResponse.json({ items, porProveedor, total });
}
