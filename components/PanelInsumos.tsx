"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Insumo } from "@/lib/insumos";

export default function PanelInsumos({ insumosIniciales }: { insumosIniciales: Insumo[] }) {
  const router = useRouter();
  const [insumos, setInsumos] = useState(insumosIniciales);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [borrador, setBorrador] = useState<Partial<Insumo>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agregandoAbierto, setAgregandoAbierto] = useState(false);
  const [nuevo, setNuevo] = useState<Partial<Insumo>>({ unidad: "kg" });
  const [agregando, setAgregando] = useState(false);
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  function empezarEdicion(i: Insumo) {
    setEditandoId(i.id);
    setBorrador({ unidad: i.unidad, precio_unitario: i.precio_unitario, proveedor: i.proveedor });
    setError(null);
  }

  async function guardar(id: number) {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`/api/insumos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidad: borrador.unidad,
          precio_unitario: Number(borrador.precio_unitario),
          proveedor: borrador.proveedor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar.");
      setInsumos((prev) => prev.map((i) => (i.id === id ? data.insumo : i)));
      setEditandoId(null);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "El servidor no responde, probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function agregarInsumo() {
    setAgregando(true);
    setErrorNuevo(null);
    try {
      const res = await fetch("/api/insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevo.nombre,
          unidad: nuevo.unidad,
          precio_unitario: Number(nuevo.precio_unitario),
          proveedor: nuevo.proveedor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo agregar el insumo.");
      setInsumos((prev) => [...prev, data.insumo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevo({ unidad: "kg" });
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
      <p className="font-display text-dulce-700 mb-3">Insumos ({insumos.length})</p>

      <div className="flex flex-col gap-3">
        {insumos.map((i) => {
          const enEdicion = editandoId === i.id;
          return (
            <div key={i.id} className="border-b border-masa-100 pb-3 last:border-0">
              <div className="flex justify-between items-start gap-3">
                <span className="text-dulce-700">{i.nombre}</span>
                {!enEdicion && (
                  <span className="text-right text-sm text-dulce-600">
                    ${i.precio_unitario.toLocaleString("es-AR")} / {i.unidad}
                    <br />
                    <span className="text-dulce-400">{i.proveedor}</span>
                  </span>
                )}
              </div>

              {!enEdicion && (
                <button
                  onClick={() => empezarEdicion(i)}
                  className="text-xs text-dulce-500 underline underline-offset-2 mt-1"
                >
                  Editar
                </button>
              )}

              {enEdicion && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-dulce-500">
                    Unidad (kg, g, ml, u...)
                    <input
                      type="text"
                      className="input-grande !py-2 !text-base mt-1"
                      value={borrador.unidad ?? ""}
                      onChange={(e) => setBorrador((b) => ({ ...b, unidad: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs text-dulce-500">
                    Precio por unidad
                    <input
                      type="number"
                      className="input-grande !py-2 !text-base mt-1"
                      value={borrador.precio_unitario ?? ""}
                      onChange={(e) =>
                        setBorrador((b) => ({ ...b, precio_unitario: Number(e.target.value) }))
                      }
                    />
                  </label>
                  <label className="text-xs text-dulce-500">
                    Proveedor
                    <input
                      type="text"
                      className="input-grande !py-2 !text-base mt-1"
                      value={borrador.proveedor ?? ""}
                      onChange={(e) => setBorrador((b) => ({ ...b, proveedor: e.target.value }))}
                    />
                  </label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => guardar(i.id)}
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

      <div className="mt-4 pt-3 border-t border-masa-100">
        {!agregandoAbierto ? (
          <button
            onClick={() => setAgregandoAbierto(true)}
            className="btn-secundario w-full !py-2 !text-sm"
          >
            + Agregar insumo nuevo
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-dulce-500">
              Nombre
              <input
                type="text"
                placeholder="Ej: Chocolate cobertura"
                className="input-grande !py-2 !text-base mt-1"
                value={nuevo.nombre ?? ""}
                onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
              />
            </label>
            <label className="text-xs text-dulce-500">
              Unidad (kg, g, ml, u...)
              <input
                type="text"
                className="input-grande !py-2 !text-base mt-1"
                value={nuevo.unidad ?? ""}
                onChange={(e) => setNuevo((n) => ({ ...n, unidad: e.target.value }))}
              />
            </label>
            <label className="text-xs text-dulce-500">
              Precio por unidad
              <input
                type="number"
                className="input-grande !py-2 !text-base mt-1"
                value={nuevo.precio_unitario ?? ""}
                onChange={(e) => setNuevo((n) => ({ ...n, precio_unitario: Number(e.target.value) }))}
              />
            </label>
            <label className="text-xs text-dulce-500">
              Proveedor
              <input
                type="text"
                className="input-grande !py-2 !text-base mt-1"
                value={nuevo.proveedor ?? ""}
                onChange={(e) => setNuevo((n) => ({ ...n, proveedor: e.target.value }))}
              />
            </label>

            {errorNuevo && (
              <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2">
                {errorNuevo}
              </div>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={agregarInsumo}
                disabled={agregando || !nuevo.nombre?.trim() || !nuevo.unidad?.trim()}
                className="btn-confirmar flex-1 !py-2 !text-sm"
              >
                {agregando ? "Agregando..." : "Agregar"}
              </button>
              <button
                onClick={() => {
                  setAgregandoAbierto(false);
                  setErrorNuevo(null);
                  setNuevo({ unidad: "kg" });
                }}
                className="btn-secundario flex-1 !py-2 !text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
