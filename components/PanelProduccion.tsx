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

  // Etapa 1 — Stock: independiente de la fecha/pestaña, se carga una sola vez.
  const [stock, setStock] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        const mapa: Record<string, number> = {};
        for (const fila of data.stock ?? []) mapa[fila.nombre] = fila.cantidad;
        setStock(mapa);
      })
      .catch(() => {});
  }, []);

  async function actualizarStock(nombre: string, cantidad: number) {
    setStock((prev) => ({ ...prev, [nombre]: cantidad }));
    try {
      await fetch("/api/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, cantidad }),
      });
    } catch {
      // Si falla la conexión, el valor queda en pantalla igual — se
      // reintenta en la próxima edición. No bloqueamos la carga por esto.
    }
  }

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
            stock={stock}
            onCambiarStock={actualizarStock}
          />

          <div className="border-t-2 border-dashed border-masa-300 pt-1" />

          <BloqueCalculo
            titulo={`Acumulado hasta el ${fechaLegible(fecha)}`}
            subtitulo="Todo lo pendiente con entrega en esa fecha o antes (incluye atrasos) — lo que hace falta para estar al día."
            calculo={datos.calculoAcumulado}
            huboPedidos={datos.huboPedidosAcumulado}
            pestana={pestana}
            stock={stock}
            onCambiarStock={actualizarStock}
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

type StockProps = {
  stock: Record<string, number>;
  onCambiarStock: (nombre: string, cantidad: number) => void;
};

function BloqueCalculo({
  titulo,
  subtitulo,
  calculo,
  huboPedidos,
  pestana,
  stock,
  onCambiarStock,
  destacarAviso,
}: {
  titulo: string;
  subtitulo: string;
  calculo: CalculoProduccion;
  huboPedidos: boolean;
  pestana: PestanaId;
  destacarAviso?: boolean;
} & StockProps) {
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
                <Fila label="Kg de tapas Santafesino (referencia)" valor={calculo.kgTapasDonJesus} />
                <div className="mt-2 pt-1 border-t border-masa-100">
                  <FilaInsumo
                    insumo={calculo.tapasSantafesino}
                    stock={stock[calculo.tapasSantafesino.nombre] ?? 0}
                    onCambiarStock={onCambiarStock}
                  />
                </div>
              </div>

              <TablaInsumos
                titulo="Insumos de masa"
                insumos={calculo.insumosMasa}
                stock={stock}
                onCambiarStock={onCambiarStock}
              />
            </>
          )}

          {pestana === "relleno" && (
            <>
              <TablaInsumos
                titulo="Rellenos"
                insumos={calculo.insumosRelleno}
                stock={stock}
                onCambiarStock={onCambiarStock}
              />

              <div className="card">
                <p className="font-display text-dulce-700 mb-2">Glasé</p>
                <Fila label="Preparados de glasé" valor={calculo.preparadosGlase} destacado />
                {calculo.insumosGlase.map((i) => (
                  <FilaInsumo
                    key={i.nombre}
                    insumo={i}
                    stock={stock[i.nombre] ?? 0}
                    onCambiarStock={onCambiarStock}
                  />
                ))}
              </div>
            </>
          )}

          {pestana === "packaging" && (
            <>
              <TablaInsumos
                titulo="Packaging"
                insumos={[
                  { nombre: "Bandeja plástica x7", unidad: "u", necesarioTotal: calculo.packaging.bandejaPlasticaX7 },
                  { nombre: "Bolsa impresa x7 (RNPA)", unidad: "u", necesarioTotal: calculo.packaging.bolsaImpresaX7 },
                  { nombre: "Caja x7", unidad: "u", necesarioTotal: calculo.packaging.cajaX7 },
                  { nombre: "Bandeja con tapa x14", unidad: "u", necesarioTotal: calculo.packaging.bandejaTapaIntegradaX14 },
                  { nombre: "Etiqueta cierre x14", unidad: "u", necesarioTotal: calculo.packaging.etiquetaCierreX14 },
                  { nombre: "Bandeja abierta 320g Pepas", unidad: "u", necesarioTotal: calculo.packaging.bandejaAbierta320g },
                  { nombre: "Etiqueta Pepas", unidad: "u", necesarioTotal: calculo.packaging.etiquetaPepas },
                ]}
                stock={stock}
                onCambiarStock={onCambiarStock}
              />

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
            <p className="font-display text-dulce-700 mb-2">Paquetes a producir</p>
            <Fila label="Maicena x7" valor={calculo.paquetes.maicenaX7} unidad="paq." />
            <Fila label="Maicena x14" valor={calculo.paquetes.maicenaX14} unidad="paq." />
            <Fila label="Frutal x7" valor={calculo.paquetes.frutalX7} unidad="paq." />
            <Fila label="Santafesino x7" valor={calculo.paquetes.santafesinoX7} unidad="paq." />
            <Fila label="Pepas DDL" valor={calculo.paquetes.pepasDDL} unidad="band." />
            <Fila label="Pepas Membrillo" valor={calculo.paquetes.pepasMembrillo} unidad="band." />
            <Fila label="Pepas Arándano" valor={calculo.paquetes.pepasArandano} unidad="band." />
            <Fila label="Pepas Batata" valor={calculo.paquetes.pepasBatata} unidad="band." />
            <Fila label="Pepas Frutos del Bosque" valor={calculo.paquetes.pepasFrutosBosque} unidad="band." />
          </div>
        </>
      )}
    </div>
  );
}

function redondeado(n: number) {
  return Math.round(n * 100) / 100;
}

function TablaInsumos({
  titulo,
  insumos,
  stock,
  onCambiarStock,
}: {
  titulo: string;
  insumos: InsumoCalculado[];
} & StockProps) {
  return (
    <div className="card">
      <p className="font-display text-dulce-700 mb-1">{titulo}</p>
      <p className="text-[11px] text-dulce-400 mb-2 flex justify-end gap-4 pr-1">
        <span className="w-14 text-center">Necesita</span>
        <span className="w-16 text-center">Stock</span>
        <span className="w-14 text-center">Falta</span>
      </p>
      {insumos.map((i) => (
        <FilaInsumo
          key={i.nombre}
          insumo={i}
          stock={stock[i.nombre] ?? 0}
          onCambiarStock={onCambiarStock}
        />
      ))}
    </div>
  );
}

function FilaInsumo({
  insumo,
  stock,
  onCambiarStock,
}: {
  insumo: InsumoCalculado;
} & { stock: number; onCambiarStock: (nombre: string, cantidad: number) => void }) {
  const necesario = redondeado(insumo.necesarioTotal);
  const faltante = Math.max(redondeado(necesario - stock), 0);
  const [valorLocal, setValorLocal] = useState(String(stock));

  useEffect(() => {
    setValorLocal(String(stock));
  }, [stock]);

  function guardar() {
    const n = Math.max(0, parseFloat(valorLocal.replace(",", ".")) || 0);
    setValorLocal(String(n));
    if (n !== stock) onCambiarStock(insumo.nombre, n);
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-masa-100 last:border-0">
      <span className="text-dulce-700 text-sm flex-1 min-w-0 truncate" title={insumo.nombre}>
        {insumo.nombre}
        <span className="text-dulce-400 text-xs"> ({insumo.unidad})</span>
      </span>
      <span className="w-14 text-center font-body font-semibold text-dulce-700">{necesario}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        className="w-16 text-center rounded-lg border-2 border-masa-300 py-1 text-sm"
        value={valorLocal}
        onChange={(e) => setValorLocal(e.target.value)}
        onBlur={guardar}
      />
      <span
        className={`w-14 text-center font-body font-semibold ${
          faltante > 0 ? "text-alerta-500" : "text-rio-500"
        }`}
      >
        {faltante}
      </span>
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
