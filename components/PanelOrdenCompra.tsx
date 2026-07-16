"use client";

import { useEffect, useMemo, useState } from "react";

function manana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type ItemOrden = {
  nombre: string;
  unidad: string;
  faltante: number;
  precioUnitario: number;
  subtotal: number;
  proveedor: string;
};

type RespuestaOrdenCompra = {
  items: ItemOrden[];
  porProveedor: { proveedor: string; subtotal: number }[];
  total: number;
};

const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function PanelOrdenCompra() {
  const [fecha, setFecha] = useState(manana());
  const [datos, setDatos] = useState<RespuestaOrdenCompra | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    fetch(`/api/orden-compra?fecha=${fecha}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo calcular.");
        if (!cancelado) setDatos(data);
      })
      .catch((e) => !cancelado && setError(e.message ?? "El servidor no responde, probá de nuevo."))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [fecha]);

  const grupos = useMemo(() => {
    if (!datos) return [];
    const mapa = new Map<string, ItemOrden[]>();
    for (const item of datos.items) {
      const lista = mapa.get(item.proveedor) ?? [];
      lista.push(item);
      mapa.set(item.proveedor, lista);
    }
    return datos.porProveedor.map((p) => ({
      proveedor: p.proveedor,
      subtotal: p.subtotal,
      items: mapa.get(p.proveedor) ?? [],
    }));
  }, [datos]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block mb-2 font-display text-dulce-700">Ponerse al día hasta la fecha</label>
        <input
          type="date"
          lang="es-AR"
          className="input-grande"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {cargando && <p className="text-dulce-500 text-center py-6">Calculando...</p>}

      {error && (
        <div className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3">
          {error}
        </div>
      )}

      {!cargando && !error && datos && (
        <>
          {datos.items.length === 0 ? (
            <div className="card text-center text-dulce-500 py-10">
              No falta comprar nada para esa fecha — el stock cubre todo.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {grupos.map((g) => (
                <div key={g.proveedor} className="card">
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="font-display text-dulce-700">{g.proveedor}</p>
                    <p className="font-display text-dulce-700">{formatoPesos.format(g.subtotal)}</p>
                  </div>
                  {g.items.map((i) => (
                    <div key={i.nombre} className="flex justify-between py-1.5 border-b border-masa-100 last:border-0 text-sm">
                      <span className="text-dulce-600">
                        {i.nombre}
                        <span className="text-dulce-400"> — {i.faltante} {i.unidad}</span>
                      </span>
                      <span className="font-body font-semibold text-dulce-700">
                        {formatoPesos.format(i.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}

              <div className="card bg-dulce-500 !border-dulce-500">
                <div className="flex justify-between items-baseline">
                  <p className="font-display text-white text-lg">Total Orden de Compra</p>
                  <p className="font-display text-white text-lg">{formatoPesos.format(datos.total)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
