"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Producto } from "@/lib/producto-types";
import type { Lista } from "@/lib/formato";
import {
  leerPedidoPegado,
  type PedidoPegado,
  type ProductoCatalogo,
} from "@/lib/leerPedidoPegado";

type Cliente = { id: number; nombre: string; ciudad: string | null; lista_difusion: string | null };

// Las tres listas de precios, con el nombre que usa el negocio. El canal
// decide con qué lista se valoriza el remito (ver lib/pricing.ts).
const CANALES: Array<[Lista, string, string]> = [
  ["mayorista", "Mayorista", "Escuelas, clubes, negocios y revendedores"],
  ["distribuidor", "Distribuidor", "Compra por volumen, sin mínimo"],
  ["minorista", "Consumidor final", "Le vende directo a la persona"],
];

function nombreProductoCliente(p: Producto) {
  if (p.formato === "bandeja18") return `${p.linea} (bandeja x18)`;
  return `${p.linea} ${p.formato}`;
}

/**
 * Qué se entendió del mensaje pegado. Se muestra siempre completo: lo que
 * entró, lo que no, y por qué — nada se descarta en silencio.
 */
function ResumenLeido({ leido }: { leido: PedidoPegado }) {
  const nombreCanal = CANALES.find(([id]) => id === leido.canal)?.[1];

  if (!leido.items.length && !leido.noLeidos.length) {
    return (
      <div className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3 text-sm">
        No encontré ningún producto en ese texto. Fijate que hayas copiado el
        mensaje completo del cliente; si el pedido no salió de tus catálogos,
        cargalo a mano acá abajo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {leido.items.length > 0 && (
        <div className="rounded-2xl bg-masa-100 border-2 border-masa-300 px-4 py-3 text-sm text-dulce-700">
          <p className="font-display mb-1">
            Cargué {leido.items.length}{" "}
            {leido.items.length === 1 ? "producto" : "productos"}
            {nombreCanal ? ` · lista ${nombreCanal}` : ""}
          </p>
          <ul className="text-xs text-dulce-600">
            {leido.items.map((it) => (
              <li key={it.producto_id}>
                {it.cantidad} × {it.nombre}
              </li>
            ))}
          </ul>
        </div>
      )}

      {leido.canal === null && leido.items.length > 0 && (
        <div className="rounded-2xl bg-dulce-500/10 border-2 border-dulce-500/30 text-dulce-700 px-4 py-3 text-sm">
          No pude darme cuenta de qué catálogo salió este pedido. Elegí vos la
          lista de precios más abajo.
        </div>
      )}

      {leido.noLeidos.map((r, i) => (
        <div
          key={i}
          className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3 text-sm"
        >
          <p className="font-semibold">Esto no lo pude cargar: &quot;{r.texto}&quot;</p>
          <p className="text-xs mt-1">
            {r.motivo === "producto_sin_vincular"
              ? "El producto está en el catálogo pero todavía no está vinculado a un producto del sistema. Se arregla en Catálogo → Editar ese producto."
              : "No reconocí ese producto. Cargalo a mano acá abajo."}
          </p>
        </div>
      ))}

      {leido.textoExtra.length > 0 && (
        <div className="rounded-2xl bg-dulce-500/10 border-2 border-dulce-500/30 text-dulce-700 px-4 py-3 text-sm">
          <p className="font-semibold">El mensaje decía además:</p>
          <ul className="text-xs mt-1">
            {leido.textoExtra.map((t, i) => (
              <li key={i}>&quot;{t}&quot;</li>
            ))}
          </ul>
          <p className="text-xs mt-1">
            Puede tener la fecha de entrega o alguna aclaración. Revisalo.
          </p>
        </div>
      )}
    </div>
  );
}

function manana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function FormNuevoPedido({
  clientesIniciales,
  productos,
  catalogoWeb,
  pedidoId,
  clienteIdInicial,
  fechaEntregaInicial,
  cantidadesIniciales,
  canalInicial,
}: {
  clientesIniciales: Cliente[];
  productos: Producto[];
  /** El catálogo comercial, para poder leer un pedido pegado de WhatsApp. */
  catalogoWeb: ProductoCatalogo[];
  pedidoId?: number;
  clienteIdInicial?: number;
  fechaEntregaInicial?: string;
  cantidadesIniciales?: Record<number, number>;
  canalInicial?: Lista;
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

  const [canal, setCanal] = useState<Lista>(canalInicial ?? "mayorista");
  const [pegarAbierto, setPegarAbierto] = useState(false);
  const [textoPegado, setTextoPegado] = useState("");
  const [leido, setLeido] = useState<PedidoPegado | null>(null);

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

  // Leer el pedido pegado no llama a ningún servicio: el mensaje lo armó el
  // propio catálogo de la casa, así que se lee acá mismo con el catálogo que
  // esta página ya tiene cargado. Solo precarga cantidades y canal; el cliente
  // y la fecha de entrega los elige siempre la persona.
  function leerPegado() {
    const resultado = leerPedidoPegado(textoPegado, catalogoWeb);
    setLeido(resultado);
    if (resultado.canal) setCanal(resultado.canal);
    if (resultado.items.length) {
      const nuevasCantidades: Record<number, number> = {};
      for (const it of resultado.items) nuevasCantidades[it.producto_id] = it.cantidad;
      setCantidades(nuevasCantidades);
    }
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
        body: JSON.stringify({
          cliente_id: clienteIdFinal,
          fecha_entrega: fechaEntrega,
          canal,
          items,
        }),
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
      <div className="card !bg-masa-50">
        <button
          type="button"
          onClick={() => setPegarAbierto((v) => !v)}
          className="w-full text-left font-display text-dulce-600"
        >
          {pegarAbierto ? "▾" : "▸"} Pegar un pedido de WhatsApp
        </button>
        {pegarAbierto && (
          <div className="flex flex-col gap-3 mt-3">
            <p className="text-xs text-dulce-500">
              Copiá el mensaje del cliente en WhatsApp (mantené apretado el
              mensaje → Copiar) y pegalo acá. Funciona con los pedidos que llegan
              desde tus catálogos: consumidor final, mayorista y distribuidor.
            </p>
            <textarea
              className="input-grande min-h-[120px]"
              placeholder="Hola! Somos revendedores y queremos hacer un pedido mayorista a Nuestro Alfajor:&#10;10x Alfajor de Maicena x7 — $25.000&#10;..."
              value={textoPegado}
              onChange={(e) => setTextoPegado(e.target.value)}
            />
            <button
              type="button"
              className="btn-secundario"
              disabled={!textoPegado.trim()}
              onClick={leerPegado}
            >
              Leer pedido
            </button>

            {leido && <ResumenLeido leido={leido} />}

            <p className="text-xs text-dulce-400">
              Esto solo llena las cantidades de abajo. El cliente y la fecha de
              entrega los elegís vos, y podés corregir todo antes de guardar.
            </p>
          </div>
        )}
      </div>

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

      {/* El canal define con qué lista de precios se valoriza el remito. Si el
          pedido se pegó desde un catálogo, ya viene elegido, pero se puede
          cambiar a mano. */}
      <div>
        <label className="block mb-2 font-display text-dulce-700">Lista de precios</label>
        <div className="flex flex-col gap-2">
          {CANALES.map(([id, nombre, detalle]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCanal(id)}
              className={`text-left rounded-2xl border-2 px-4 py-3 ${
                canal === id
                  ? "border-dulce-600 bg-dulce-500/10"
                  : "border-masa-300 bg-white"
              }`}
            >
              <span className="font-display text-dulce-700">{nombre}</span>
              <span className="block text-xs text-dulce-400">{detalle}</span>
            </button>
          ))}
        </div>
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
