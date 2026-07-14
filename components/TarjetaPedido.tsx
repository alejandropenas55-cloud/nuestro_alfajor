"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { cantidad: number; precio_unitario: number; linea: string; formato: string };

export type PedidoConItems = {
  id: number;
  fecha_entrega: string;
  cliente_nombre: string;
  estado: "Pendiente" | "Remito Enviado" | "Entregado";
  texto_remito: string;
  items: Item[];
};

const ESTADOS: PedidoConItems["estado"][] = ["Pendiente", "Remito Enviado", "Entregado"];

const COLOR_ESTADO: Record<PedidoConItems["estado"], string> = {
  Pendiente: "bg-masa-100 text-dulce-700",
  "Remito Enviado": "bg-dulce-400/20 text-dulce-600",
  Entregado: "bg-rio-500/15 text-rio-600",
};

function fechaLegible(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function TarjetaPedido({ pedido }: { pedido: PedidoConItems }) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const total = pedido.items.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0);

  async function cambiarEstado(estado: PedidoConItems["estado"]) {
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar el cambio.");
        return;
      }
      router.refresh();
    } catch {
      setError("No tenés conexión a internet. Probá de nuevo.");
    }
  }

  async function borrarPedido() {
    const confirmado = window.confirm(
      `¿Seguro que querés borrar el pedido de ${pedido.cliente_nombre}? No se puede deshacer.`
    );
    if (!confirmado) return;

    setError(null);
    setBorrando(true);
    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo borrar el pedido.");
        return;
      }
      router.refresh();
    } catch {
      setError("No tenés conexión a internet. Probá de nuevo.");
    } finally {
      setBorrando(false);
    }
  }

  async function copiarRemito() {
    try {
      await navigator.clipboard.writeText(pedido.texto_remito);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar. Mantené presionado el texto para copiarlo a mano.");
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-dulce-700 text-lg">{pedido.cliente_nombre}</p>
          <p className="text-sm text-dulce-500">Entrega: {fechaLegible(pedido.fecha_entrega)}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-display ${COLOR_ESTADO[pedido.estado]}`}>
          {pedido.estado}
        </span>
      </div>

      <div className="text-sm text-dulce-700 flex flex-col gap-0.5">
        {pedido.items.map((it, idx) => (
          <span key={idx}>
            {it.cantidad} x {it.linea} {it.formato !== "bandeja18" ? it.formato : "(bandeja x18)"}
          </span>
        ))}
      </div>

      <p className="font-display text-dulce-700">Total: ${total.toLocaleString("es-AR")}</p>

      {error && (
        <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={copiarRemito} className="btn-secundario flex-1 !py-3 !text-base">
          {copiado ? "¡Copiado! ✓" : "Copiar remito"}
        </button>
        <Link
          href={`/pedidos/${pedido.id}/editar`}
          className="rounded-2xl border-2 border-masa-300 text-dulce-600 px-4 !py-3 !text-base font-body flex items-center"
        >
          Editar
        </Link>
        <button
          onClick={borrarPedido}
          disabled={borrando}
          className="rounded-2xl border-2 border-alerta-500/30 text-alerta-500 px-4 !py-3 !text-base font-body"
        >
          {borrando ? "Borrando..." : "Borrar"}
        </button>
      </div>

      <div className="flex gap-2">
        {ESTADOS.map((e, idx) => {
          const indiceActual = ESTADOS.indexOf(pedido.estado);
          // "Remito Enviado" y "Entregado" quedan pintados de verde apenas se
          // alcanzan y lo siguen estando al avanzar (no se "despintan" al
          // pasar al siguiente estado) — Pendiente no entra en esta regla.
          const alcanzado = idx >= 1 && idx <= indiceActual;
          return (
            <button
              key={e}
              onClick={() => cambiarEstado(e)}
              disabled={e === pedido.estado}
              className={`flex-1 !py-2 !text-sm rounded-xl font-body border-2 ${
                alcanzado
                  ? "bg-rio-500 text-white border-rio-500"
                  : e === pedido.estado
                  ? "bg-dulce-500 text-white border-dulce-500"
                  : "bg-white text-dulce-600 border-masa-300"
              }`}
            >
              {e}
            </button>
          );
        })}
      </div>
    </div>
  );
}
