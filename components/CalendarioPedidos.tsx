"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TarjetaPedido, { type PedidoConItems } from "@/components/TarjetaPedido";

const FILTROS = ["Todos", "Pendiente", "Remito Enviado", "Entregado"] as const;
type Filtro = (typeof FILTROS)[number];

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const NOMBRES_DIA_CORTO = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NOMBRES_DIA_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function rangoMes(anio: number, mes: number) {
  const desde = `${anio}-${pad2(mes)}-01`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const hasta = `${anio}-${pad2(mes)}-${pad2(ultimoDia)}`;
  return { desde, hasta, ultimoDia };
}

function diaSemanaInicio(anio: number, mes: number) {
  const d = new Date(anio, mes - 1, 1).getDay(); // 0=Dom..6=Sáb
  return (d + 6) % 7; // 0=Lun..6=Dom
}

function sumarMes(anio: number, mes: number, delta: number) {
  const idx = mes - 1 + delta;
  const nuevoAnio = anio + Math.floor(idx / 12);
  const nuevoMes = ((idx % 12) + 12) % 12 + 1;
  return { anio: nuevoAnio, mes: nuevoMes };
}

function fechaLegibleLarga(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const nombreDia = NOMBRES_DIA_LARGO[(new Date(y, m - 1, d).getDay() + 6) % 7];
  return `${nombreDia.charAt(0).toUpperCase()}${nombreDia.slice(1)} ${d} de ${NOMBRES_MES[m - 1].toLowerCase()}`;
}

function colorDia(lista: PedidoConItems[]) {
  if (lista.length === 0) return null;
  return lista.every((p) => p.estado === "Entregado") ? "bg-rio-500" : "bg-dulce-500";
}

export default function CalendarioPedidos({
  pedidosIniciales,
  anioInicial,
  mesInicial,
  hoyInicial,
}: {
  pedidosIniciales: PedidoConItems[];
  anioInicial: number;
  mesInicial: number;
  hoyInicial: string;
}) {
  const [anio, setAnio] = useState(anioInicial);
  const [mes, setMes] = useState(mesInicial);
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const primerRender = useRef(true);

  async function cargar(anioC: number, mesC: number, filtroC: Filtro) {
    setCargando(true);
    setError(null);
    try {
      const { desde, hasta } = rangoMes(anioC, mesC);
      const params = new URLSearchParams({ desde, hasta });
      if (filtroC !== "Todos") params.set("estado", filtroC);
      const res = await fetch(`/api/pedidos?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudieron cargar los pedidos.");
      setPedidos(data.pedidos);
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
    cargar(anio, mes, filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mes, filtro]);

  const pedidosPorDia = useMemo(() => {
    const mapa = new Map<string, PedidoConItems[]>();
    for (const p of pedidos) {
      const lista = mapa.get(p.fecha_entrega) ?? [];
      lista.push(p);
      mapa.set(p.fecha_entrega, lista);
    }
    return mapa;
  }, [pedidos]);

  const celdas = useMemo(() => {
    const { ultimoDia } = rangoMes(anio, mes);
    const inicioSemana = diaSemanaInicio(anio, mes);
    const dias: (string | null)[] = [
      ...Array(inicioSemana).fill(null),
      ...Array.from({ length: ultimoDia }, (_, i) => `${anio}-${pad2(mes)}-${pad2(i + 1)}`),
    ];
    while (dias.length % 7 !== 0) dias.push(null);
    return dias;
  }, [anio, mes]);

  const viendoMesActual = anio === Number(hoyInicial.slice(0, 4)) && mes === Number(hoyInicial.slice(5, 7));
  const pedidosDelDia = pedidosPorDia.get(diaSeleccionado) ?? [];

  function irMesAnterior() {
    const { anio: a, mes: m } = sumarMes(anio, mes, -1);
    setAnio(a);
    setMes(m);
    setDiaSeleccionado(`${a}-${pad2(m)}-01`);
  }

  function irMesSiguiente() {
    const { anio: a, mes: m } = sumarMes(anio, mes, 1);
    setAnio(a);
    setMes(m);
    setDiaSeleccionado(`${a}-${pad2(m)}-01`);
  }

  function irHoy() {
    setAnio(Number(hoyInicial.slice(0, 4)));
    setMes(Number(hoyInicial.slice(5, 7)));
    setDiaSeleccionado(hoyInicial);
  }

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

      <div className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={irMesAnterior}
            aria-label="Mes anterior"
            className="btn bg-white border-2 border-masa-300 text-dulce-600 !px-4 !py-2"
          >
            ‹
          </button>
          <div className="flex flex-col items-center">
            <p className="font-display text-touch-lg text-dulce-700">
              {NOMBRES_MES[mes - 1]} {anio}
            </p>
            {!viendoMesActual && (
              <button onClick={irHoy} className="text-xs text-dulce-500 underline underline-offset-2">
                Ir a hoy
              </button>
            )}
          </div>
          <button
            onClick={irMesSiguiente}
            aria-label="Mes siguiente"
            className="btn bg-white border-2 border-masa-300 text-dulce-600 !px-4 !py-2"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-display text-dulce-400 uppercase">
          {NOMBRES_DIA_CORTO.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((iso, idx) => {
            if (!iso) return <div key={idx} />;
            const lista = pedidosPorDia.get(iso) ?? [];
            const color = colorDia(lista);
            const esHoy = iso === hoyInicial;
            const esSeleccionado = iso === diaSeleccionado;
            const dia = Number(iso.slice(-2));
            return (
              <button
                key={iso}
                onClick={() => setDiaSeleccionado(iso)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 font-body text-sm border-2 transition-colors ${
                  esSeleccionado
                    ? "bg-dulce-500 text-white border-dulce-500"
                    : esHoy
                    ? "border-dulce-400 text-dulce-700"
                    : "border-transparent text-dulce-700 hover:bg-masa-50"
                }`}
              >
                <span>{dia}</span>
                {color &&
                  (lista.length > 1 ? (
                    <span
                      className={`text-[10px] leading-none font-display rounded-full px-1 ${
                        esSeleccionado ? "bg-white/30 text-white" : `${color} text-white`
                      }`}
                    >
                      {lista.length}
                    </span>
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full ${esSeleccionado ? "bg-white" : color}`} />
                  ))}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-display text-dulce-700">{fechaLegibleLarga(diaSeleccionado)}</p>
        <Link href={`/pedidos/nuevo?fecha=${diaSeleccionado}`} className="btn-primario !py-2 !px-4 !text-sm">
          + Cargar pedido
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-alerta-500/10 border border-alerta-500/30 text-alerta-500 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="card text-center text-dulce-500 py-10">Cargando...</div>
      ) : pedidosDelDia.length === 0 ? (
        <div className="card text-center text-dulce-500 py-10">
          {filtro === "Todos"
            ? "No hay pedidos para este día."
            : `No hay pedidos en estado "${filtro}" para este día.`}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidosDelDia.map((p) => (
            <TarjetaPedido key={p.id} pedido={p} onCambiado={() => cargar(anio, mes, filtro)} />
          ))}
        </div>
      )}
    </div>
  );
}
