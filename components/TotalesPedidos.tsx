"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { precioAR } from "@/lib/formato";
import SelectorVistaPedidos from "@/components/SelectorVistaPedidos";

type ProductoTotal = {
  id: number;
  linea: string;
  formato: string;
  unidades: number;
  total: number;
};

type Respuesta = {
  desde: string;
  hasta: string;
  cantidadPedidos: number;
  unidadesTotales: number;
  totalGeneral: number;
  productos: ProductoTotal[];
};

const LARGOS = [
  { clave: "semana", etiqueta: "Semana", dias: 7 },
  { clave: "quincena", etiqueta: "2 semanas", dias: 14 },
  { clave: "mes", etiqueta: "Mes", dias: 0 },
] as const;
type Largo = (typeof LARGOS)[number]["clave"];

const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function fromISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function sumarDias(iso: string, n: number) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
function lunesDeLaSemana(iso: string) {
  const d = fromISO(iso);
  const desplazamiento = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - desplazamiento);
  return toISO(d);
}
function primerDiaDelMes(iso: string) {
  const d = fromISO(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}
function ultimoDiaDelMes(iso: string) {
  const d = fromISO(iso);
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(ultimo)}`;
}
function sumarMeses(iso: string, n: number) {
  const d = fromISO(iso);
  d.setMonth(d.getMonth() + n, 1);
  return toISO(d);
}

/** Ancla (día de inicio) para cada largo, a partir de una fecha cualquiera. */
function anclaPara(largo: Largo, iso: string) {
  return largo === "mes" ? primerDiaDelMes(iso) : lunesDeLaSemana(iso);
}

function rango(largo: Largo, ancla: string) {
  if (largo === "mes") return { desde: ancla, hasta: ultimoDiaDelMes(ancla) };
  const dias = largo === "quincena" ? 13 : 6;
  return { desde: ancla, hasta: sumarDias(ancla, dias) };
}

function fechaCorta(iso: string) {
  const d = fromISO(iso);
  return `${d.getDate()} de ${NOMBRES_MES[d.getMonth()]}`;
}

function etiquetaRango(largo: Largo, desde: string, hasta: string) {
  if (largo === "mes") {
    const d = fromISO(desde);
    return `${NOMBRES_MES[d.getMonth()].replace(/^./, (c) => c.toUpperCase())} ${d.getFullYear()}`;
  }
  return `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`;
}

function nombre(p: ProductoTotal) {
  return p.formato === "bandeja18" ? `${p.linea} (bandeja x18)` : `${p.linea} ${p.formato}`;
}

export default function TotalesPedidos({ hoyISO }: { hoyISO: string }) {
  const [largo, setLargo] = useState<Largo>("semana");
  const [ancla, setAncla] = useState(() => anclaPara("semana", hoyISO));
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pedido = useRef(0);

  const { desde, hasta } = useMemo(() => rango(largo, ancla), [largo, ancla]);
  const anclaHoy = anclaPara(largo, hoyISO);
  const enElPeriodoActual = ancla === anclaHoy;

  useEffect(() => {
    const miTurno = ++pedido.current;
    setCargando(true);
    setError(null);
    fetch(`/api/pedidos/totales?desde=${desde}&hasta=${hasta}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar los totales.");
        if (miTurno === pedido.current) setDatos(data);
      })
      .catch((e) => {
        if (miTurno === pedido.current) {
          setError(e.message ?? "No tenés conexión a internet. Probá de nuevo.");
        }
      })
      .finally(() => {
        if (miTurno === pedido.current) setCargando(false);
      });
  }, [desde, hasta]);

  function cambiarLargo(nuevo: Largo) {
    setAncla(anclaPara(nuevo, ancla));
    setLargo(nuevo);
  }

  function mover(direccion: -1 | 1) {
    if (largo === "mes") setAncla((a) => sumarMeses(a, direccion));
    else setAncla((a) => sumarDias(a, direccion * (largo === "quincena" ? 14 : 7)));
  }

  function irAHoy() {
    setAncla(anclaPara(largo, hoyISO));
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectorVistaPedidos />

      <div className="flex gap-2">
        {LARGOS.map((l) => (
          <button
            key={l.clave}
            onClick={() => cambiarLargo(l.clave)}
            className={`flex-1 !py-2 !px-3 !text-sm rounded-full font-body border-2 transition-colors ${
              l.clave === largo
                ? "bg-dulce-500 text-white border-dulce-500"
                : "bg-white text-dulce-600 border-masa-300"
            }`}
          >
            {l.etiqueta}
          </button>
        ))}
      </div>

      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => mover(-1)}
            aria-label="Período anterior"
            className="btn bg-white border-2 border-masa-300 text-dulce-600 !px-4 !py-2"
          >
            ‹
          </button>
          <div className="flex flex-col items-center text-center">
            <p className="font-display text-dulce-700">{etiquetaRango(largo, desde, hasta)}</p>
            {!enElPeriodoActual && (
              <button
                onClick={irAHoy}
                className="text-xs text-dulce-500 underline underline-offset-2"
              >
                Ir a hoy
              </button>
            )}
          </div>
          <button
            onClick={() => mover(1)}
            aria-label="Período siguiente"
            className="btn bg-white border-2 border-masa-300 text-dulce-600 !px-4 !py-2"
          >
            ›
          </button>
        </div>

        {datos && !cargando && !error && (
          <div className="flex items-end justify-between border-t-2 border-masa-100 pt-3">
            <div className="text-sm text-dulce-500">
              {datos.cantidadPedidos === 0
                ? "Sin pedidos"
                : `${datos.cantidadPedidos} ${datos.cantidadPedidos === 1 ? "pedido" : "pedidos"} · ${datos.unidadesTotales.toLocaleString("es-AR")} ${
                    datos.unidadesTotales === 1 ? "paquete" : "paquetes"
                  }`}
            </div>
            <div className="font-display text-touch-lg text-dulce-700">
              {precioAR(datos.totalGeneral)}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="card text-center text-dulce-500 py-10">Cargando...</div>
      ) : !datos || datos.productos.length === 0 ? (
        <div className="card text-center text-dulce-500 py-10">
          No hay pedidos con entrega en este período.
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="text-xs text-dulce-400 uppercase tracking-wide font-body">
                <th className="text-left px-4 py-2.5">Producto</th>
                <th className="text-right px-2 py-2.5">Unid.</th>
                <th className="text-right px-4 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.productos.map((p) => (
                <tr key={p.id} className="border-t border-masa-100 text-dulce-700">
                  <td className="text-left px-4 py-2.5">{nombre(p)}</td>
                  <td className="text-right px-2 py-2.5">{p.unidades.toLocaleString("es-AR")}</td>
                  <td className="text-right px-4 py-2.5">{precioAR(p.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-masa-200 font-display text-dulce-700">
                <td className="text-left px-4 py-3">Total</td>
                <td className="text-right px-2 py-3">
                  {datos.unidadesTotales.toLocaleString("es-AR")}
                </td>
                <td className="text-right px-4 py-3">{precioAR(datos.totalGeneral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs text-dulce-400 leading-relaxed">
        Cuenta todos los pedidos con fecha de entrega dentro del período, estén Pendientes,
        con Remito Enviado o Entregados. El total usa el precio que se fijó en cada pedido
        según su fecha de entrega — el mismo que figura en el remito.
      </p>
    </div>
  );
}
