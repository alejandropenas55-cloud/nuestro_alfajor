import { notFound } from "next/navigation";
import db from "@/lib/db";
import { listarClientes } from "@/lib/clientes";
import { listarProductos, normalizarCanal } from "@/lib/pricing";
import { listarCatalogoParaPegar } from "@/lib/catalogo";
import FormNuevoPedido from "@/components/FormNuevoPedido";

export const dynamic = "force-dynamic";

export default async function EditarPedidoPage({ params }: { params: { id: string } }) {
  const pedido = (await db
    .prepare("SELECT id, cliente_id, fecha_entrega, canal FROM pedidos WHERE id = ?")
    .get(params.id)) as
    | { id: number; cliente_id: number; fecha_entrega: string; canal: string | null }
    | undefined;

  if (!pedido) notFound();

  const items = (await db
    .prepare("SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?")
    .all(params.id)) as { producto_id: number; cantidad: number }[];

  const cantidadesIniciales = Object.fromEntries(items.map((i) => [i.producto_id, i.cantidad]));

  const [clientes, productos, catalogoWeb] = await Promise.all([
    listarClientes(),
    listarProductos(),
    listarCatalogoParaPegar(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Editar pedido</h1>
      <p className="text-dulce-500 -mt-2">
        Cambiá cantidades, fecha o cliente. El remito se vuelve a generar solo.
      </p>
      <FormNuevoPedido
        clientesIniciales={clientes}
        productos={productos}
        catalogoWeb={catalogoWeb}
        pedidoId={pedido.id}
        clienteIdInicial={pedido.cliente_id}
        fechaEntregaInicial={pedido.fecha_entrega}
        cantidadesIniciales={cantidadesIniciales}
        canalInicial={normalizarCanal(pedido.canal)}
      />
    </div>
  );
}
