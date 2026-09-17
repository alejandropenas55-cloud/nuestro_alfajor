import { redirect } from "next/navigation";
import Link from "next/link";
import { getSesion, puedeVerCostos } from "@/lib/session";
import { listarProductos, nombreProducto, precioVigente } from "@/lib/pricing";
import { costoProducto } from "@/lib/receta";
import SubNavCostos from "@/components/SubNavCostos";

export const dynamic = "force-dynamic";

export default async function RecetasPage() {
  const sesion = await getSesion();
  if (!sesion || !puedeVerCostos(sesion.rol)) redirect("/pedidos");

  const productos = await listarProductos();
  const hoy = new Date().toISOString().slice(0, 10);

  const filas = await Promise.all(
    productos.map(async (p) => {
      const costo = await costoProducto(p.id);
      const precioVenta = precioVigente(p, hoy);
      return { producto: p, costo, precioVenta };
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Recetas</h1>
      <SubNavCostos />
      <p className="text-dulce-500 -mt-2">
        Qué insumos y en qué cantidad lleva cada producto. El costo y el
        margen se calculan solos con el precio cargado en Insumos.
      </p>

      <section className="card">
        <div className="flex flex-col gap-3">
          {filas.map(({ producto, costo, precioVenta }) => {
            const sinReceta = costo === 0;
            const margen = precioVenta - costo;
            const margenPct = precioVenta > 0 ? Math.round((margen / precioVenta) * 100) : 0;
            return (
              <div
                key={producto.id}
                className="flex justify-between items-center gap-3 border-b border-masa-100 pb-3 last:border-0"
              >
                <div>
                  <p className="text-dulce-700">{nombreProducto(producto)}</p>
                  {sinReceta ? (
                    <p className="text-xs text-dulce-400">Sin receta cargada</p>
                  ) : (
                    <p className="text-xs text-dulce-500">
                      Costo ${costo.toLocaleString("es-AR")} · Margen $
                      {margen.toLocaleString("es-AR")} ({margenPct}%)
                    </p>
                  )}
                </div>
                <Link
                  href={`/recetas/${producto.id}`}
                  className="text-xs text-dulce-500 underline underline-offset-2 whitespace-nowrap"
                >
                  {sinReceta ? "Cargar receta" : "Editar"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
