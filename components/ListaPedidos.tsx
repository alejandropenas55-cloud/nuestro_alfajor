"use client";

import { useEffect, useRef, useState } from "react";
import TarjetaPedido, { type PedidoConItems } from "@/components/TarjetaPedido";

const FILTROS = ["Todos", "Pendiente", "Remito Enviado", "Entregado"] as const;
type Filtro = (typeof FILTROS)[number];

const LIMITE = 20;

export default function ListaPedidos({
  pedidosIniciales,
  hasMoreInicial,
}: {
  pedidosIniciales: PedidoConItems[];
  hasMoreInicial: boolean;
}) {
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [hasMore, setHasMore] = useState(hasMoreInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primerRender = useRef(true);

  async function cargar(filtroActual: Filtro, offset: number, reemplazar: boolean) {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({ offset: String(offset), limit: String(LIMITE) });
      if (filtroActual !== "Todos") params.set("estado", filtroActual);
      const res = await fetch(`/api/pedidos?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar los pedidos.");
      setPedidos((prev) => (reemplazar ? data.pedidos : [...prev, ...data.pedidos]));
      setHasMore(data.hasMore);
    } catch (e: any) {
      setError(e.message ?? "No tenés conexión a internet. Probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    cargar(filtro, 0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`whitespace-nowrap !py-2 !px-4 !text-sm rounded-full font-body border-2 transition-colors ${
              f === filtro
                ? "bg-dulce-500 text-white border-dulce-500"
                : "bg-white text-dulce-600 border-masa-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {pedidos.length === 0 && !cargando ? (
        <div className="card text-center text-dulce-500 py-10">
          {filtro === "Todos"
            ? 'Todavía no hay pedidos cargados. Tocá "Cargar pedido" para empezar.'
            : `No hay pedidos en estado "${filtro}".`}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((p) => (
            <TarjetaPedido key={p.id} pedido={p} />
          ))}
        </div>
      )}

      {cargando && pedidos.length === 0 && (
        <div className="card text-center text-dulce-500 py-10">Cargando...</div>
      )}

      {hasMore && (
        <button
          onClick={() => cargar(filtro, pedidos.length, false)}
          disabled={cargando}
          className="btn btn-secundario"
        >
          {cargando ? "Cargando..." : "Cargar más"}
        </button>
      )}
    </div>
  );
}
