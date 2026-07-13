"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [telefono, setTelefono] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function entrar() {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Mensajes específicos, nunca un error genérico (riesgo 1 del pre-mortem).
        setError(data.error ?? "No se pudo entrar. Probá de nuevo.");
        return;
      }
      router.push("/pedidos");
      router.refresh();
    } catch {
      setError("No tenés conexión a internet. Fijate el wifi y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block mb-2 font-display text-dulce-700">Tu celular</label>
        <input
          className="input-grande"
          inputMode="tel"
          placeholder="Ej: 3434000001"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-2 font-display text-dulce-700">PIN (4 números)</label>
        <input
          className="input-grande tracking-[0.5em] text-center"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
      </div>
      {error && (
        <div className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 text-alerta-500 px-4 py-3 font-body">
          {error}
        </div>
      )}
      <button
        className="btn-primario mt-2"
        disabled={cargando || !telefono || pin.length !== 4}
        onClick={entrar}
      >
        {cargando ? "Entrando..." : "Entrar"}
      </button>
    </div>
  );
}
