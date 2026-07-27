"use client";

import { useState } from "react";

// Cambio del PIN propio. Cada uno el suyo: nadie puede cambiarle el PIN a
// otro, ni siquiera Alejandro desde acá.

export default function PanelCambiarPin({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [repetido, setRepetido] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  async function guardar() {
    setOcupado(true);
    setError("");
    try {
      const r = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin_actual: actual,
          pin_nuevo: nuevo,
          pin_repetido: repetido,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || "No se pudo cambiar el PIN.");
        return;
      }
      setListo(true);
      setActual("");
      setNuevo("");
      setRepetido("");
    } catch {
      setError("No hay conexión. Revisá internet y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  const completo = actual.length === 4 && nuevo.length === 4 && repetido.length === 4;

  return (
    <section className="card">
      <button
        onClick={() => {
          setAbierto(!abierto);
          setListo(false);
          setError("");
        }}
        className="w-full flex items-center justify-between"
      >
        <span className="font-display text-dulce-700">Mi PIN</span>
        <span className="text-sm text-dulce-500">{abierto ? "Cerrar ▾" : "Cambiar ▸"}</span>
      </button>

      {abierto && (
        <div className="mt-4 flex flex-col gap-3 border-t-2 border-masa-100 pt-4">
          {listo ? (
            <>
              <p className="text-rio-600 font-display">
                Listo, {nombre}. Tu PIN quedó cambiado.
              </p>
              <p className="text-sm text-dulce-500">
                Anotalo en algún lado seguro: si te lo olvidás, no hay forma de
                recuperarlo solo — hay que pedirle a Alejandro que lo reponga.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-dulce-500">
                Elegí 4 números que no sean fáciles de adivinar. Evitá 1234,
                0000 y tu año de nacimiento.
              </p>

              <CampoPin label="PIN actual" valor={actual} setValor={setActual} />
              <CampoPin label="PIN nuevo" valor={nuevo} setValor={setNuevo} />
              <CampoPin label="Repetí el PIN nuevo" valor={repetido} setValor={setRepetido} />

              {error && <p className="text-sm text-alerta-500">{error}</p>}

              <button
                onClick={guardar}
                disabled={ocupado || !completo}
                className="btn-confirmar !py-3 !text-base disabled:opacity-50"
              >
                {ocupado ? "Guardando…" : "Cambiar mi PIN"}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function CampoPin({
  label,
  valor,
  setValor,
}: {
  label: string;
  valor: string;
  setValor: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-dulce-600 mb-1.5">{label}</p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        className="input-grande tracking-[0.5em] text-center"
        value={valor}
        onChange={(e) => setValor(e.target.value.replace(/\D/g, "").slice(0, 4))}
      />
    </div>
  );
}
