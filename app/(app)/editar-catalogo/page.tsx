import { getSesion, puedeEditarPrecios } from "@/lib/session";
import { leerTextos, listarCatalogoCompleto } from "@/lib/catalogo";
import { listarProductos } from "@/lib/pricing";
import PanelCatalogo from "@/components/PanelCatalogo";
import PanelTextosCatalogo from "@/components/PanelTextosCatalogo";

export const dynamic = "force-dynamic";

export default async function CatalogoInternoPage() {
  const sesion = await getSesion();
  const [productos, textos, productosSistema] = await Promise.all([
    listarCatalogoCompleto(),
    leerTextos(),
    listarProductos(),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-touch-xl text-dulce-700">Catálogo</h1>
        <p className="text-sm text-dulce-500 mt-1">
          Lo que edites acá se ve al instante en el catálogo público que les
          mandás a los clientes por WhatsApp.
        </p>
        <a
          href="/catalogo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm text-dulce-600 underline underline-offset-2"
        >
          Abrir el catálogo público ↗
        </a>
      </div>

      <PanelTextosCatalogo
        textosIniciales={textos}
        puedeEditar={puedeEditarPrecios(sesion?.rol ?? "")}
      />

      <PanelCatalogo
        productosIniciales={productos}
        productosSistema={productosSistema}
        puedeEditar={puedeEditarPrecios(sesion?.rol ?? "")}
      />
    </div>
  );
}
