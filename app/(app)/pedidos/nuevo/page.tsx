import { listarClientes } from "@/lib/clientes";
import { listarProductos } from "@/lib/pricing";
import { listarCatalogoParaPegar } from "@/lib/catalogo";
import FormNuevoPedido from "@/components/FormNuevoPedido";

export const dynamic = "force-dynamic";

export default async function NuevoPedidoPage({
  searchParams,
}: {
  searchParams: { fecha?: string };
}) {
  const [clientes, productos, catalogoWeb] = await Promise.all([
    listarClientes(),
    listarProductos(),
    listarCatalogoParaPegar(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Nuevo pedido</h1>
      <FormNuevoPedido
        clientesIniciales={clientes}
        productos={productos}
        catalogoWeb={catalogoWeb}
        fechaEntregaInicial={searchParams.fecha}
      />
    </div>
  );
}
