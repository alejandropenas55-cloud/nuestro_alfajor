import db from "@/lib/db";
import { listarProductos } from "@/lib/pricing";
import { getSesion, puedeEditarPrecios } from "@/lib/session";
import PanelPrecios from "@/components/PanelPrecios";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const sesion = await getSesion();
  const productos = await listarProductos();
  const clientes = (await db.prepare("SELECT * FROM clientes ORDER BY nombre").all()) as any[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-touch-xl text-dulce-700">Config</h1>

      <PanelPrecios
        productosIniciales={productos}
        puedeEditar={puedeEditarPrecios(sesion?.rol ?? "")}
      />

      <section className="card">
        <p className="font-display text-dulce-700 mb-3">Clientes ({clientes.length})</p>
        {clientes.length === 0 ? (
          <p className="text-dulce-500 text-sm">
            Todavía no hay clientes cargados. Se agregan solos al cargar un pedido nuevo.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {clientes.map((c) => (
              <div key={c.id} className="flex justify-between text-dulce-700 text-sm border-b border-masa-100 py-1.5 last:border-0">
                <span>{c.nombre}</span>
                <span className="text-dulce-400">{c.lista_difusion ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
