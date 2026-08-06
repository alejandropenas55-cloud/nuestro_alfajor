import db from "@/lib/db";
import { listarProductos } from "@/lib/pricing";
import { getSesion, puedeEditarPrecios } from "@/lib/session";
import { fechaAltaLegible } from "@/lib/formato";
import PanelPrecios from "@/components/PanelPrecios";
import PanelCambiarPin from "@/components/PanelCambiarPin";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const sesion = await getSesion();
  const productos = await listarProductos();
  // Más nuevo primero: la pregunta que se le hace a esta lista es "quién entró
  // último", no "cómo se llama". Empate de fecha (los históricos comparten la
  // fecha de la migración que los rellenó) se desempata por nombre, para que
  // el orden no baile entre recargas.
  //
  // El CASE deja al final a los que no tengan fecha: hoy no debería haber
  // ninguno — la migración de lib/db.ts rellena los NULL en cada arranque —
  // pero Turso ordena NULL primero en DESC, así que si alguna vez aparece uno
  // (por ejemplo al recrear el esquema en Supabase) no se cuela arriba de todo
  // como si fuera el cliente más nuevo.
  const clientes = (await db
    .prepare(
      `SELECT * FROM clientes
       ORDER BY CASE WHEN creado_en IS NULL THEN 1 ELSE 0 END, creado_en DESC, nombre`
    )
    .all()) as any[];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-touch-xl text-dulce-700">Config</h1>

      <PanelCambiarPin nombre={sesion?.nombre ?? ""} />

      <PanelPrecios
        productosIniciales={productos}
        puedeEditar={puedeEditarPrecios(sesion?.rol ?? "")}
      />

      <section className="card">
        <p className="font-display text-dulce-700">Clientes ({clientes.length})</p>
        {clientes.length > 0 && (
          <p className="text-dulce-500 text-sm mt-0.5 mb-3">
            Ordenados por fecha de alta, del más nuevo al más viejo.
          </p>
        )}
        {clientes.length === 0 ? (
          <p className="text-dulce-500 text-sm mt-3">
            Todavía no hay clientes cargados. Se agregan solos al cargar un pedido nuevo.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {clientes.map((c) => (
              <div key={c.id} className="flex justify-between gap-3 text-dulce-700 text-sm border-b border-masa-100 py-1.5 last:border-0">
                <span className="flex flex-col">
                  <span>{c.nombre}</span>
                  <span className="text-dulce-400 text-xs">Alta: {fechaAltaLegible(c.creado_en)}</span>
                </span>
                <span className="text-dulce-400 text-right">{c.lista_difusion ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
