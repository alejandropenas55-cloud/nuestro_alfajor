import db from "@/lib/db";
import { listarProductos } from "@/lib/pricing";
import FormNuevoPedido from "@/components/FormNuevoPedido";

export const dynamic = "force-dynamic";

export default async function NuevoPedidoPage() {
  const clientes = (await db.prepare("SELECT * FROM clientes ORDER BY nombre").all()) as any[];
  const productos = await listarProductos();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Nuevo pedido</h1>
      <FormNuevoPedido clientesIniciales={clientes} productos={productos} />
    </div>
  );
}
