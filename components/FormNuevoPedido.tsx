"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Producto } from "@/lib/producto-types";

type Cliente = { id: number; nombre: string; ciudad: string | null; lista_difusion: string | null };

function nombreProductoCliente(p: Producto) {
  if (p.formato === "bandeja18") return `${p.linea} (bandeja x18)`;
  return `${p.linea} ${p.formato}`;
}

function manana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function FormNuevoPedido({
  clientesIniciales,
  productos,
  pedidoId,
  clienteIdInicial,
  fechaEntregaInicial,
  cantidadesIniciales,
}: {
  clientesIniciales: Cliente[];
  productos: Producto[];
  pedidoId?: number;
  clienteIdInicial?: number;
  fechaEntregaInicial?: string;
  cantidadesIniciales?: Record<number, number>;
}) {
  const editando = pedidoId != null;
  const router = useRouter();
  const [clientes, setClientes] = useState(clientesIniciales);
  const [clienteId, setClienteId] = useState<number | "nuevo" | "">(clienteIdInicial ?? "");
  const [busquedaCliente, setBusquedaCliente] = useState(
    () => clientesIniciales.find((c) => c.id === clienteIdInicial)?.nombre ?? ""
  );
  const [listaClienteAbierta, setListaClienteAbierta] = useState(false);
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(fechaEntregaInicial ?? manana());
  const [cantidades, setCantidades] = useState<Record<number, number>>(cantidadesIniciales ?? {});
  const [ordenAlfabetico, setOrdenAlfabetico] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [remitoGenerado, setRemitoGenerado] = useState<string | null>(null);
  const cierreListaTimeout = useRef<ReturnType<typeof setTimeout>>();

  const hayCantidad = useMemo(
    () => Object.values(cantidades).some((c) => c > 0),
    [cantidades]
  );

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [clientes, busquedaCliente]);

  const productosOrdenados = useMemo(() => {
    if (!ordenAlfabetico) return productos;
    return [...productos].sort((a, b) =>
      nombreProductoCliente(a).localeCompare(nombreProductoCliente(b), "es")
    );
  }, [productos, ordenAlfabetico]);

  function setCantidad(productoId: number, valor: string) {
    const n = Math.max(0, parseInt(valor || "0", 10) || 0);
    setCantidades((prev) => ({ ...prev, [productoId]: n }));
  }

  function elegirCliente(c: Cliente) {
    setClienteId(c.id);
    setBusquedaCliente(c.nombre);
    setListaClienteAbierta(false);
  }

  function elegirClienteNuevo() {
    setClienteId("nuevo");
    setBusquedaCliente("");
    setListaClienteAbierta(false);
  }

  function abrirListaCliente() {
    if (cierreListaTimeout.current) clearTimeout(cierreListaTimeout.current);
    setListaClienteAbierta(true);
  }

  function cerrarListaClienteConRetraso() {
    // Retraso corto para que el click en una opción de la lista alcance a
    // registrarse antes de que el blur del input la cierre.
    cierreListaTimeout.current = setTimeout(() => setListaClienteAbierta(false), 150);
  }

  async function enviar() {
    setError(null);

    if (!fechaEntrega) return setError("Elegí la fecha de entrega.");
    if (!clienteId) return setError("Elegí o cargá un cliente.");
    if (!hayCantidad) return setError("Cargá al menos una cantidad.");

    setEnviando(true);
    try {
      let clienteIdFinal = clienteId;

      if (clienteId === "nuevo") {
        if (!nombreNuevoCliente.trim()) {
          setError("Escribí el nombre del cliente nuevo.");
          setEnviando(false);
          return;
        }
        const resCliente = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombreNuevoCliente.trim() }),
        });
        const dataCliente = await resCliente.json();
        if (!resCliente.ok) throw new Error(dataCliente.error ?? "No se pudo crear el cliente.");
        clienteIdFinal = dataCliente.cliente.id;
        setClientes((prev) => [...prev, dataCliente.cliente]);
      }

      const items = Object.entries(cantidades)
        .filter(([, cant]) => cant > 0)
        .map(([producto_id, cantidad]) => ({ producto_id: Number(producto_id), cantidad }));

      const res = await fetch(editando ? `/api/pedidos/${pedidoId}` : "/api/pedidos", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteIdFinal, fecha_entrega: fechaEntrega, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el pedido.");

      setRemitoGenerado(data.textoRemito);
    } catch (e: any) {
      setError(e.message ?? "Ocurrió un error. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (remitoGenerado) {
    return (
      <div className="flex flex-col gap-4">
        <div className="card">
          <p className="font-display text-dulce-700 mb-2">
            {editando ? "Pedido actualizado ✓" : "Pedido guardado ✓"}
          </p>
          <p className="text-sm text-dulce-500 mb-3">
            {editando
              ? "Copiá este texto actualizado y pegalo en WhatsApp:"
              : "Copiá este texto y pegalo en WhatsApp:"}
          </p>
          <pre className="whitespace-pre-wrap font-body text-sm bg-masa-50 rounded-xl p-3 border border-masa-100">
            {remitoGenerado}
          </pre>
        </div>
        <button
          className="btn-confirmar"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(remitoGenerado);
            } catch {}
            router.push("/pedidos");
            router.refresh();
          }}
        >
          Copiar y volver a Pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <label className="block mb-2 font-display text-dulce-700">Cliente</label>
        <input
          className="input-grande"
          placeholder="Escribí para buscar un cliente..."
          value={clienteId === "nuevo" ? "" : busquedaCliente}
          onFocus={abrirListaCliente}
          onBlur={cerrarListaClienteConRetraso}
          onChange={(e) => {
            setBusquedaCliente(e.target.value);
            setClienteId("");
            setListaClienteAbierta(true);
          }}
        />
        {listaClienteAbierta && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-2xl border-2 border-masa-300 bg-white shadow-lg">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={elegirClienteNuevo}
              className="w-full text-left px-5 py-3 font-display text-dulce-600 border-b border-masa-100 hover:bg-masa-50"
            >
              + Cliente nuevo
            </button>
            {clientesFiltrados.length === 0 ? (
              <p className="px-5 py-3 text-sm text-dulce-400">Ningún cliente coincide.</p>
            ) : (
              clientesFiltrados.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegirCliente(c)}
                  className="w-full text-left px-5 py-3 text-dulce-700 hover:bg-masa-50"
                >
                  {c.nombre}
                </button>
              ))
            )}
          </div>
        )}
        {clienteId === "nuevo" && (
          <input
            className="input-grande mt-3"
            placeholder="Nombre del cliente nuevo"
            value={nombreNuevoCliente}
            onChange={(e) => setNombreNuevoCliente(e.target.value)}
            autoFocus
          />
        )}
      </div>

      <div>
        <label className="block mb-2 font-display text-dulce-700">Fecha de entrega</label>
        <input
          type="date"
          lang="es-AR"
          className="input-grande"
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="font-display text-dulce-700">Cantidades</label>
          <button
            type="button"
            onClick={() => setOrdenAlfabetico((v) => !v)}
            className="text-xs text-dulce-500 underline underline-offset-2"
          >
            {ordenAlfabetico ? "Orden del catálogo" : "Ordenar A-Z"}
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {productosOrdenados.map((p) => (
            <div key={p.id} className="flex items-center justify-between card !py-3">
              <span className="text-dulce-700">{nombreProductoCliente(p)}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className="w-20 rounded-xl border-2 border-masa-300 text-center py-2 text-touch-lg"
                value={cantidades[p.id] ?? ""}
                onChange={(e) => setCantidad(p.id, e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          className="btn-secundario flex-1"
          onClick={() => router.push("/pedidos")}
        >
          Cancelar
        </button>
        <button className="btn-primario flex-1" disabled={enviando} onClick={enviar}>
          {enviando ? "Guardando..." : editando ? "Guardar cambios" : "Guardar pedido"}
        </button>
      </div>
    </div>
  );
}
