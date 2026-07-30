import { redirect } from "next/navigation";
import { getSesion, puedeVerCostos } from "@/lib/session";
import PanelOrdenCompra from "@/components/PanelOrdenCompra";

export default async function OrdenDeCompraPage() {
  const sesion = await getSesion();
  if (!sesion || !puedeVerCostos(sesion.rol)) redirect("/pedidos");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Orden de Compra</h1>
      <p className="text-dulce-500 -mt-2">
        Todo lo que falta comprar para ponerse al día, con costo por proveedor.
      </p>
      <PanelOrdenCompra />
    </div>
  );
}
