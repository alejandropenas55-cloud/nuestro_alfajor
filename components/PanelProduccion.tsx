"use client";

import { useEffect, useState } from "react";
import type { CalculoProduccion, InsumoCalculado } from "@/lib/produccion";
import { CAPACIDAD_ARMADO } from "@/lib/produccion";

function manana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type RespuestaProduccion = {
  calculoDia: CalculoProduccion;
  calculoAcumulado: CalculoProduccion;
  huboPedidosDia: boolean;
  huboPedidosAcumulado: boolean;
};

const PESTANAS = [
  { id: "amasijo", label: "Amasijo-Horneado" },
  { id: "relleno", label: "Relleno-Glasé" },
  { id: "packaging", label: "Armado-Packaging" },
] as const;
type PestanaId = (typeof PESTANAS)[number]["id"];

export default function PanelProduccion() {
  const [fecha, setFecha] = useState(manana());
  const [pestana, setPestana] = useState<PestanaId>("amasijo");
  const [datos, setDatos] = useState<RespuestaProduccion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    fetch(`/api/produccion?fecha=${fecha}`)
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block mb-2 font-display text-dulce-700">Fecha de entrega a producir</label>
        <input
          type="date"
          lang="es-AR"
          className="input-grande"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`whitespace-nowrap !py-2 !px-4 !text-sm rounded-full font-body border-2 transition-colors ${
              p.id === pestana
                ? "bg-dulce-500 text-white border-dulce-500"
                : "bg-white text-dulce-600 border-masa-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {cargando && <p className="text-dulce-500 text-center py-6">Calculando...</p>}

      {error && (
        <div className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3">
          {error}
        </div>
      )}

      {!cargando && !error && datos && (
        <div className="flex flex-col gap-6">
          <BloqueCalculo
            titulo={`Solo ese día (${fechaLegible(fecha)})`}
            subtitulo="Lo que hay que producir puntualmente para esa fecha de entrega."
            calculo={datos.calculoDia}
            huboPedidos={datos.huboPedidosDia}
            pestana={pestana}
          />

          <div className="border-t-2 border-dashed border-masa-300 pt-1" />

          <BloqueCalculo
            titulo={`Acumulado hasta el ${fechaLegible(fecha)}`}
            subtitulo="Todo lo pendiente con entrega en esa fecha o antes (incluye atrasos) — lo que hace falta para estar al día."
            calculo={datos.calculoAcumulado}
            huboPedidos={datos.huboPedidosAcumulado}
            pestana={pestana}
            destacarAviso
          />
        </div>
      )}
    </div>
  );
}

function fechaLegible(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function BloqueCalculo({
  titulo,
  subtitulo,
  calculo,
  huboPedidos,
  pestana,
  destacarAviso,
}: {
  titulo: string;
  subtitulo: string;
  calculo: CalculoProduccion;
  huboPedidos: boolean;
  pestana: PestanaId;
  destacarAviso?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-display text-dulce-700 text-lg">{titulo}</p>
        <p className="text-xs text-dulce-500">{subtitulo}</p>
      </div>

      {!huboPedidos ? (
        <div className="card text-center text-dulce-500 py-6">No hay pedidos pendientes acá.</div>
      ) : (
        <>
          {calculo.avisoAmasijos && (
            <div className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3 font-display">
              ⚠️ {calculo.totalAmasijos} amasijos
              {destacarAviso
                ? " en total para ponerse al día — si se hace en un solo día supera la jornada normal (3). Repartir en varios días o reforzar personal."
                : " — supera la jornada normal (3). Avisar con tiempo: turno extra, adelantar producción o reforzar personal."}
            </div>
          )}

          {pestana === "amasijo" && (
            <>
              <div className="card">
                <p className="font-display text-dulce-700 mb-2">Amasijo</p>
                <Fila label="Amasijos Maicena/Frutal" valor={calculo.amasijosMF} />
                <Fila label="Amasijos Pepas" valor={calculo.amasijosPepas} />
                <Fila label="Total amasijos" valor={calculo.totalAmasijos} destacado />
              </div>

              <div className="card">
                <p className="font-display text-dulce-700 mb-2">Horneado</p>
                <Fila label="Horneadas necesarias" valor={calculo.horneadas} />
                <Fila label="Garrafas (45kg)" valor={calculo.garrafas} />
              </div>

              <div className="card">
                <p className="font-display text-dulce-700 mb-2">Compra a Don Jesús</p>
                <Fila label="Kg de tapas Santafesino" valor={calculo.kgTapasDonJesus} />
              </div>

              <TablaInsumos titulo="Insumos de masa" insumos={calculo.insumosMasa} />
            </>
          )}

          {pestana === "relleno" && (
            <>
              <TablaInsumos titulo="Rellenos" insumos={calculo.insumosRelleno} />

              <div className="card">
                <p className="font-display text-dulce-700 mb-2">Glasé</p>
                <Fila label="Preparados de glasé" valor={calculo.preparadosGlase} destacado />
                {calculo.insumosGlase.map((i) => (
                  <Fila
                    key={i.nombre}
                    label={i.nombre}
                    valor={redondeado(i.necesarioTotal)}
                    unidad={i.unidad}
                  />
                ))}
              </div>
            </>
          )}

          {pestana === "packaging" && (
            <>
              <div className="card">
                <p className="font-display text-dulce-700 mb-2">Packaging</p>
                <Fila label="Bandeja plástica x7" valor={calculo.packaging.bandejaPlasticaX7} />
                <Fila label="Bolsa impresa x7" valor={calculo.packaging.bolsaImpresaX7} />
                <Fila label="Caja x7 (cada 15 paq.)" valor={calculo.packaging.cajaX7} />
                <Fila label="Bandeja con tapa x14" valor={calculo.packaging.bandejaTapaIntegradaX14} />
                <Fila label="Etiqueta cierre x14" valor={calculo.packaging.etiquetaCierreX14} />
                <Fila label="Bandeja abierta 320g (Pepas)" valor={calculo.packaging.bandejaAbierta320g} />
                <Fila label="Etiqueta Pepas" valor={calculo.packaging.etiquetaPepas} />
              </div>

              <div className="card">
                <p className="font-display text-dulce-700 mb-1">Capacidad de armado</p>
                <p className="text-xs text-dulce-500 mb-2">Referencia (María + Francisco), no depende de la fecha.</p>
                {CAPACIDAD_ARMADO.map((c) => (
                  <div key={c.turno} className="py-1.5 border-b border-masa-100 last:border-0">
                    <div className="flex justify-between text-dulce-600">
                      <span>{c.turno}</span>
                      <span className="font-body font-semibold">{c.alfajoresPorHora} alfajores/hora</span>
                    </div>
                    {"nota" in c && c.nota && (
                      <p className="text-xs text-dulce-400 mt-0.5">{c.nota}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="card">
            <p className="font-display text-dulce-700 mb-2">Unidades a producir</p>
            <Fila label="Alfajores Maicena" valor={calculo.alfajoresMaicena} />
            <Fila label="Alfajores Frutal" valor={calculo.alfajoresFrutal} />
            <Fila label="Alfajores Santafesino" valor={calculo.alfajoresSantafesino} />
            <Fila label="Pepas (unidades)" valor={calculo.pepasUnidades} />
          </div>
        </>
      )}
    </div>
  );
}

function redondeado(n: number) {
  return Math.round(n * 100) / 100;
}

function TablaInsumos({ titulo, insumos }: { titulo: string; insumos: InsumoCalculado[] }) {
  return (
    <div className="card">
      <p className="font-display text-dulce-700 mb-2">{titulo}</p>
      {insumos.map((i) => (
        <Fila key={i.nombre} label={i.nombre} valor={redondeado(i.necesarioTotal)} unidad={i.unidad} />
      ))}
    </div>
  );
}

function Fila({
  label,
  valor,
  unidad,
  destacado,
}: {
  label: string;
  valor: number;
  unidad?: string;
  destacado?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1.5 ${destacado ? "font-display text-dulce-700" : "text-dulce-600"}`}>
      <span>{label}</span>
      <span className={destacado ? "font-display" : "font-body font-semibold"}>
        {valor}
        {unidad ? ` ${unidad}` : ""}
      </span>
    </div>
  );
}
