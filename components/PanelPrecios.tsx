"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nombreProducto, type Producto } from "@/lib/producto-types";

export default function PanelPrecios({
  productosIniciales,
  puedeEditar,
}: {
  productosIniciales: Producto[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [productos, setProductos] = useState(productosIniciales);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [borrador, setBorrador] = useState<Partial<Producto>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agregandoAbierto, setAgregandoAbierto] = useState(false);
  const [nuevo, setNuevo] = useState<Partial<Producto>>({ unidad: "paquete" });
  const [agregando, setAgregando] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  function empezarEdicion(p: Producto) {
    setEditandoId(p.id);
    setBorrador({
      precio_hasta: p.precio_hasta,
      precio_desde: p.precio_desde,
      fecha_corte: p.fecha_corte,
    });
    setError(null);
  }

  async function guardar(id: number) {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precio_hasta: Number(borrador.precio_hasta),
          precio_desde: Number(borrador.precio_desde),
          fecha_corte: borrador.fecha_corte,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setProductos((prev) => prev.map((p) => (p.id === id ? data.producto : p)));
      setEditandoId(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "El servidor no responde, probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function agregarProducto() {
    setAgregando(true);
    setErrorNuevo(null);
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          linea: nuevo.linea,
          formato: nuevo.formato,
          unidad: nuevo.unidad,
          precio_hasta: Number(nuevo.precio_hasta),
          precio_desde: Number(nuevo.precio_desde),
          fecha_corte: nuevo.fecha_corte,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo agregar el producto.");
      setProductos((prev) => [...prev, data.producto]);
      setNuevo({ unidad: "paquete" });
      setAgregandoAbierto(false);
      router.refresh();
    } catch (e: any) {
      setErrorNuevo(e.message ?? "El servidor no responde, probá de nuevo.");
    } finally {
      setAgregando(false);
    }
  }

  return (
    <section className="card">
      <p className="font-display text-dulce-700 mb-3">Precios</p>

      {!puedeEditar && (
        <p className="text-xs text-dulce-400 mb-3">
          Solo lectura — pedile a Javier, Mercedes o Alejandro que cambien un precio.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {productos.map((p) => {
          const enEdicion = editandoId === p.id;
          return (
            <div key={p.id} className="border-b border-masa-100 pb-3 last:border-0">
              <div className="flex justify-between items-start gap-3">
                <span className="text-dulce-700">{nombreProducto(p)}</span>
                {!enEdicion && (
                  <span className="text-right text-sm text-dulce-600">
                    ${p.precio_hasta.toLocaleString("es-AR")} hasta{" "}
                    {p.fecha_corte.split("-").reverse().join("/")}
                    <br />
                    ${p.precio_desde.toLocaleString("es-AR")} desde esa fecha
                  </span>
                )}
              </div>

              {puedeEditar && !enEdicion && (
                <button
                  onClick={() => empezarEdicion(p)}
                  className="text-xs text-dulce-500 underline underline-offset-2 mt-1"
                >
                  Editar
                </button>
              )}

              {enEdicion && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-dulce-500">
                    Precio hasta la fecha de corte
                    <input
                      type="number"
                      className="input-grande !py-2 !text-base mt-1"
                      value={borrador.precio_hasta ?? ""}
                      onChange={(e) =>
                        setBorrador((b) => ({ ...b, precio_hasta: Number(e.target.value) }))
                      }
                    />
                  </label>
                  <label className="text-xs text-dulce-500">
                    Precio desde la fecha de corte
                    <input
                      type="number"
                      className="input-grande !py-2 !text-base mt-1"
                      value={borrador.precio_desde ?? ""}
                      onChange={(e) =>
                        setBorrador((b) => ({ ...b, precio_desde: Number(e.target.value) }))
                      }
                    />
                  </label>
                  <label className="text-xs text-dulce-500">
                    Fecha de corte (a partir de qué entrega rige el precio nuevo)
                    <input
                      type="date"
                      lang="es-AR"
                      className="input-grande !py-2 !text-base mt-1"
                      value={borrador.fecha_corte ?? ""}
                      onChange={(e) => setBorrador((b) => ({ ...b, fecha_corte: e.target.value }))}
                    />
                  </label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => guardar(p.id)}
                      disabled={guardando}
                      className="btn-confirmar flex-1 !py-2 !text-sm"
                    >
                      {guardando ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="btn-secundario flex-1 !py-2 !text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2 mt-3">
          {error}
        </div>
      )}

      {puedeEditar && (
        <div className="mt-4 pt-3 border-t border-masa-100">
          {!agregandoAbierto ? (
            <button
              onClick={() => setAgregandoAbierto(true)}
              className="btn-secundario w-full !py-2 !text-sm"
            >
              + Agregar producto nuevo
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-dulce-500">
                Línea (nombre del producto)
                <input
                  type="text"
                  placeholder="Ej: Chocolate Semiamargo"
                  className="input-grande !py-2 !text-base mt-1"
                  value={nuevo.linea ?? ""}
                  onChange={(e) => setNuevo((n) => ({ ...n, linea: e.target.value }))}
                />
              </label>
              <label className="text-xs text-dulce-500">
                Formato
                <input
                  type="text"
                  placeholder="Ej: x7, x14, bandeja18"
                  className="input-grande !py-2 !text-base mt-1"
                  value={nuevo.formato ?? ""}
                  onChange={(e) => setNuevo((n) => ({ ...n, formato: e.target.value }))}
                />
              </label>
              <label className="text-xs text-dulce-500">
                Precio hasta la fecha de corte
                <input
                  type="number"
                  className="input-grande !py-2 !text-base mt-1"
                  value={nuevo.precio_hasta ?? ""}
                  onChange={(e) => setNuevo((n) => ({ ...n, precio_hasta: Number(e.target.value) }))}
                />
              </label>
              <label className="text-xs text-dulce-500">
                Precio desde la fecha de corte
                <input
                  type="number"
                  className="input-grande !py-2 !text-base mt-1"
                  value={nuevo.precio_desde ?? ""}
                  onChange={(e) => setNuevo((n) => ({ ...n, precio_desde: Number(e.target.value) }))}
                />
              </label>
              <label className="text-xs text-dulce-500">
                Fecha de corte (a partir de qué entrega rige el precio nuevo)
                <input
                  type="date"
                  lang="es-AR"
                  className="input-grande !py-2 !text-base mt-1"
                  value={nuevo.fecha_corte ?? ""}
                  onChange={(e) => setNuevo((n) => ({ ...n, fecha_corte: e.target.value }))}
                />
              </label>

              {errorNuevo && (
                <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2">
                  {errorNuevo}
                </div>
              )}

              <p className="text-xs text-dulce-400">
                Esto solo agrega el producto a Pedidos y Precios. Si también querés que aparezca en
                el catálogo público, hay que cargarlo aparte desde /editar-catalogo.
              </p>

              <div className="flex gap-2 mt-1">
                <button
                  onClick={agregarProducto}
                  disabled={agregando || !nuevo.linea?.trim() || !nuevo.formato?.trim()}
                  className="btn-confirmar flex-1 !py-2 !text-sm"
                >
                  {agregando ? "Agregando..." : "Agregar"}
                </button>
                <button
                  onClick={() => {
                    setAgregandoAbierto(false);
                    setErrorNuevo(null);
                    setNuevo({ unidad: "paquete" });
                  }}
                  className="btn-secundario flex-1 !py-2 !text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-dulce-400 mt-3">
        El precio que se cobra depende de la fecha de ENTREGA del pedido, no de la fecha en que se
        carga.
      </p>
    </section>
  );
}
