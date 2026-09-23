import { redirect, notFound } from "next/navigation";
import { getSesion, puedeVerCostos } from "@/lib/session";
import { getProducto, listarProductos, nombreProducto, precioVigente } from "@/lib/pricing";
import { listarRecetaDeProducto } from "@/lib/receta";
import { listarInsumos } from "@/lib/insumos";
import PanelReceta from "@/components/PanelReceta";
import SubNavCostos from "@/components/SubNavCostos";
import SelectorProductoReceta from "@/components/SelectorProductoReceta";

export const dynamic = "force-dynamic";

export default async function RecetaProductoPage({ params }: { params: { id: string } }) {
  const sesion = await getSesion();
  if (!sesion || !puedeVerCostos(sesion.rol)) redirect("/pedidos");

  const producto = await getProducto(Number(params.id));
  if (!producto) notFound();

  const [lineas, insumos, todosLosProductos] = await Promise.all([
    listarRecetaDeProducto(producto.id),
    listarInsumos(),
    listarProductos(),
  ]);
  const hoy = new Date().toISOString().slice(0, 10);
  const precioVenta = precioVigente(producto, hoy);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">{nombreProducto(producto)}</h1>
      <SubNavCostos />
      <SelectorProductoReceta
        productoIdActual={producto.id}
        productos={todosLosProductos.map((p) => ({ id: p.id, nombre: nombreProducto(p) }))}
      />
      <PanelReceta
        productoId={producto.id}
        lineasIniciales={lineas}
        insumos={insumos}
        precioVenta={precioVenta}
      />
    </div>
  );
}
