"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LineaReceta } from "@/lib/receta";
import type { Insumo } from "@/lib/insumos";

export default function PanelReceta({
  productoId,
  lineasIniciales,
  insumos,
  precioVenta,
}: {
  productoId: number;
  lineasIniciales: LineaReceta[];
  insumos: Insumo[];
  precioVenta: number;
}) {
  const router = useRouter();
  const [lineas, setLineas] = useState(lineasIniciales);
  const [insumoElegido, setInsumoElegido] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const [quitandoId, setQuitandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cantidadEditada, setCantidadEditada] = useState<string>("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const costoTotal = Math.round(lineas.reduce((a, l) => a + l.subtotal, 0) * 100) / 100;
  const margen = precioVenta - costoTotal;
  const margenPct = precioVenta > 0 ? Math.round((margen / precioVenta) * 100) : 0;

  const insumosDisponibles = insumos.filter((i) => !lineas.some((l) => l.insumo_id === i.id));

  async function agregarLinea() {
    setError(null);
    const insumoId = Number(insumoElegido);
    const cant = Number(cantidad);
    if (!insumoId || !cant || cant <= 0) {
      setError("Elegí un insumo y una cantidad mayor a 0.");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch(`/api/productos/${productoId}/receta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insumo_id: insumoId, cantidad: cant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo agregar el insumo.");
      setLineas(data.lineas);
      setInsumoElegido("");
      setCantidad("");
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "El servidor no responde, probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function empezarEdicion(l: LineaReceta) {
    setEditandoId(l.insumo_id);
    setCantidadEditada(String(l.cantidad));
    setError(null);
  }

  async function guardarEdicion(insumoId: number) {
    setError(null);
    const cant = Number(cantidadEditada);
    if (!cant || cant <= 0) {
      setError("La cantidad tiene que ser mayor a 0.");
      return;
    }
    setGuardandoEdicion(true);
    try {
      const res = await fetch(`/api/productos/${productoId}/receta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insumo_id: insumoId, cantidad: cant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setLineas(data.lineas);
      setEditandoId(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "El servidor no responde, probá de nuevo.");
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function quitarLinea(insumoId: number) {
    setError(null);
    setQuitandoId(insumoId);
    try {
      const res = await fetch(`/api/productos/${productoId}/receta/${insumoId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo quitar el insumo.");
      setLineas(data.lineas);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "El servidor no responde, probá de nuevo.");
    } finally {
      setQuitandoId(null);
    }
  }

  return (
    <section className="card">
      <div className="flex flex-col gap-1 mb-3 pb-3 border-b border-masa-100">
        <p className="text-dulce-700">
          Costo: <span className="font-display">${costoTotal.toLocaleString("es-AR")}</span>
        </p>
        <p className="text-sm text-dulce-500">
          Precio de venta: ${precioVenta.toLocaleString("es-AR")} · Margen $
          {margen.toLocaleString("es-AR")} ({margenPct}%)
        </p>
      </div>

      {lineas.length === 0 ? (
        <p className="text-dulce-400 text-sm mb-3">Todavía no hay insumos cargados en la receta.</p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {lineas.map((l) => {
            const enEdicion = editandoId === l.insumo_id;
            return (
              <div key={l.id} className="border-b border-masa-100 pb-2 last:border-0">
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <p className="text-dulce-700 text-sm">
                      {l.nombre} —{" "}
                      {l.cantidad.toLocaleString("es-AR", { maximumFractionDigits: 4 })} {l.unidad}
                    </p>
                    <p className="text-xs text-dulce-400">${l.subtotal.toLocaleString("es-AR")}</p>
                  </div>
                  {!enEdicion && (
                    <div className="flex gap-3 shrink-0">
                      <button
                        onClick={() => empezarEdicion(l)}
                        className="text-xs text-dulce-500 underline underline-offset-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => quitarLinea(l.insumo_id)}
                        disabled={quitandoId === l.insumo_id}
                        className="text-xs text-alerta-500 underline underline-offset-2"
                      >
                        {quitandoId === l.insumo_id ? "Quitando..." : "Quitar"}
                      </button>
                    </div>
                  )}
                </div>

                {enEdicion && (
                  <div className="flex items-end gap-2 mt-2">
                    <label className="text-xs text-dulce-500 flex-1">
                      Cantidad ({l.unidad})
                      <input
                        type="number"
                        className="input-grande !py-2 !text-base mt-1"
                        value={cantidadEditada}
                        onChange={(e) => setCantidadEditada(e.target.value)}
                      />
                    </label>
                    <button
                      onClick={() => guardarEdicion(l.insumo_id)}
                      disabled={guardandoEdicion}
                      className="btn-confirmar !py-2 !px-3 !text-sm"
                    >
                      {guardandoEdicion ? "..." : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="btn-secundario !py-2 !px-3 !text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-3 border-t border-masa-100">
        <label className="text-xs text-dulce-500">
          Insumo
          <select
            className="input-grande !py-2 !text-base mt-1"
            value={insumoElegido}
            onChange={(e) => setInsumoElegido(e.target.value)}
          >
            <option value="">Elegir...</option>
            {insumosDisponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} (${i.precio_unitario.toLocaleString("es-AR")}/{i.unidad})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-dulce-500">
          Cantidad por unidad de venta
          <input
            type="number"
            className="input-grande !py-2 !text-base mt-1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </label>
        <button
          onClick={agregarLinea}
          disabled={guardando || !insumoElegido || !cantidad}
          className="btn-confirmar !py-2 !text-sm"
        >
          {guardando ? "Agregando..." : "Agregar a la receta"}
        </button>
      </div>
    </section>
  );
}
