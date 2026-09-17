import { redirect } from "next/navigation";
import { getSesion, puedeVerCostos } from "@/lib/session";
import { listarInsumos } from "@/lib/insumos";
import PanelInsumos from "@/components/PanelInsumos";
import SubNavCostos from "@/components/SubNavCostos";

export const dynamic = "force-dynamic";

export default async function InsumosPage() {
  const sesion = await getSesion();
  if (!sesion || !puedeVerCostos(sesion.rol)) redirect("/pedidos");

  const insumos = await listarInsumos();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Insumos</h1>
      <SubNavCostos />
      <p className="text-dulce-500 -mt-2">
        Precio de cada materia prima. Se actualiza una sola vez acá y se usa
        en Orden de Compra y en el costo de cada receta.
      </p>
      <PanelInsumos insumosIniciales={insumos} />
    </div>
  );
}
