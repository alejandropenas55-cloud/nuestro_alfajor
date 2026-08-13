"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COLUMNAS_PLANILLA,
  DIAS_SEMANA,
  fechaLegible,
  lunesDeLaSemana,
  type DiaPlanilla,
} from "@/lib/planilla";

function hoyIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default function PlanillaProduccionPage() {
  const [lunes, setLunes] = useState(() => lunesDeLaSemana(hoyIso()));
  const [dias, setDias] = useState<DiaPlanilla[] | null>(null);
  const [enBlanco, setEnBlanco] = useState(false);
  // Media hoja (A5) es lo que pidió producción. A4 queda como salida de
  // emergencia para impresoras que no aceptan A5.
  const [hoja, setHoja] = useState<"A5" | "A4">("A5");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setError(null);
    fetch(`/api/planilla?desde=${lunes}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "No se pudo armar la planilla.");
        if (!cancelado) setDias(data.dias);
      })
      .catch((e) => !cancelado && setError(e.message ?? "El servidor no responde."));
    return () => {
      cancelado = true;
    };
  }, [lunes]);

  const ultimoDia = sumarDias(lunes, DIAS_SEMANA.length - 1);

  return (
    <>
      {/* El tamaño del papel se define con @page, que no acepta clases: se
          inyecta la regla según lo elegido en pantalla. */}
      <style>{`@page { size: ${hoja} landscape; margin: ${hoja === "A5" ? "6mm" : "8mm"}; }`}</style>

      <div className="plan-barra no-imprimir">
        <Link href="/produccion" className="btn-secundario !py-3 !px-5 !text-base">
          ← Volver
        </Link>

        <button
          onClick={() => setLunes(sumarDias(lunes, -7))}
          className="btn-secundario !py-3 !px-5 !text-base"
        >
          ◀ Semana anterior
        </button>
        <button
          onClick={() => setLunes(sumarDias(lunes, 7))}
          className="btn-secundario !py-3 !px-5 !text-base"
        >
          Semana siguiente ▶
        </button>

        {/* Elegir cualquier día: la planilla siempre se arma desde el lunes de
            esa semana, así no hay que contar semanas con las flechas. */}
        <label className="flex items-center gap-2 text-dulce-700 font-body">
          Semana del
          <input
            type="date"
            lang="es-AR"
            className="rounded-xl border-2 border-masa-300 px-3 py-2"
            value={lunes}
            onChange={(e) =>
              e.target.value && setLunes(lunesDeLaSemana(e.target.value))
            }
          />
        </label>

        <label className="flex items-center gap-2 text-dulce-700 font-body">
          <input
            type="checkbox"
            className="w-5 h-5"
            checked={enBlanco}
            onChange={(e) => setEnBlanco(e.target.checked)}
          />
          Imprimir en blanco
        </label>

        <label className="flex items-center gap-2 text-dulce-700 font-body">
          Hoja
          <select
            className="rounded-xl border-2 border-masa-300 px-3 py-2"
            value={hoja}
            onChange={(e) => setHoja(e.target.value as "A5" | "A4")}
          >
            <option value="A5">Media hoja (A5)</option>
            <option value="A4">Hoja entera (A4)</option>
          </select>
        </label>

        <button
          onClick={() => window.print()}
          className="btn-primario !py-3 !px-6 !text-base ml-auto"
        >
          🖨️ Imprimir
        </button>
      </div>

      {error && (
        <p className="no-imprimir text-center text-alerta-500 py-4">{error}</p>
      )}

      {!dias && !error && (
        <p className="no-imprimir text-center text-dulce-500 py-8">Armando la planilla...</p>
      )}

      {dias && (
        <div className={`plan-hoja ${hoja === "A4" ? "plan-a4" : ""}`}>
          <div className="plan-membrete">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nuestro-alfajor.png" alt="Nuestro Alfajor" />
            <div className="plan-datos">
              <h1>Nuestro Alfajor</h1>
              <p className="plan-contacto">
                Prof. Diego Mackinnon 1590, Paraná · 343 507-8807 · @nuestroalfajor
              </p>
            </div>
            <div className="plan-semana">
              Producción
              <b>
                {fechaLegible(lunes).slice(0, 5)} al {fechaLegible(ultimoDia)}
              </b>
            </div>
          </div>

          <table className="plan-tabla">
            <thead>
              <tr>
                <th className="plan-col-fecha">DIA / FECHA</th>
                {COLUMNAS_PLANILLA.map((c) => (
                  <th key={c.id}>{c.titulo}</th>
                ))}
                <th className="plan-col-obs">OBSERVACIONES</th>
              </tr>
            </thead>
            <tbody>
              {dias.map((d) => (
                <tr key={d.fecha}>
                  <td>
                    <div className="plan-dia">{d.dia}</div>
                    <div className="plan-lote">{d.lote}</div>
                  </td>
                  {COLUMNAS_PLANILLA.map((c) => (
                    <td key={c.id} className="plan-cant">
                      {enBlanco ? "" : d.cantidades[c.id] ?? ""}
                    </td>
                  ))}
                  <td className="plan-col-obs" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
