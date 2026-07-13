"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Producto } from "@/lib/producto-types";

type Cliente = { id: number; nombre: string; ciudad: string | null; lista_difusion: string | null };

function nombreProductoCliente(p: Producto) {
  if (p.formato === "bandeja18") return `${p.linea} (bandeja x18)`;
  return `${p.linea} ${p.formato}`;
}

export default function FormNuevoPedido({
  clientesIniciales,
  productos,
}: {
  clientesIniciales: Cliente[];
  productos: Producto[];
}) {
  const router = useRouter();
  const [clientes, setClientes] = useState(clientesIniciales);
  const [clienteId, setClienteId] = useState<number | "nuevo" | "">("");
  const [nombreNuevoCliente, setNombreNuevoCliente] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [remitoGenerado, setRemitoGenerado] = useState<string | null>(null);

  const hayCantidad = useMemo(
    () => Object.values(cantidades).some((c) => c > 0),
    [cantidades]
  );

  function setCantidad(productoId: number, valor: string) {
    const n = Math.max(0, parseInt(valor || "0", 10) || 0);
    setCantidades((prev) => ({ ...prev, [productoId]: n }));
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

      const res = await fetch("/api/pedidos", {
        method: "POST",
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
          <p className="font-display text-dulce-700 mb-2">Pedido guardado ✓</p>
          <p className="text-sm text-dulce-500 mb-3">
            Copiá este texto y pegalo en WhatsApp:
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
      <div>
        <label className="block mb-2 font-display text-dulce-700">Cliente</label>
        <select
          className="input-grande"
          value={clienteId}
          onChange={(e) =>
            setClienteId(e.target.value === "nuevo" ? "nuevo" : e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">Elegí un cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
          <option value="nuevo">+ Cliente nuevo</option>
        </select>
        {clienteId === "nuevo" && (
          <input
            className="input-grande mt-3"
            placeholder="Nombre del cliente nuevo"
            value={nombreNuevoCliente}
            onChange={(e) => setNombreNuevoCliente(e.target.value)}
          />
        )}
      </div>

      <div>
        <label className="block mb-2 font-display text-dulce-700">Fecha de entrega</label>
        <input
          type="date"
          className="input-grande"
          value={fechaEntrega}
          onChange={(e) => setFechaEntrega(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-3 font-display text-dulce-700">Cantidades</label>
        <div className="flex flex-col gap-3">
          {productos.map((p) => (
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

      <button className="btn-primario" disabled={enviando} onClick={enviar}>
        {enviando ? "Guardando..." : "Guardar pedido"}
      </button>
    </div>
  );
}
