"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogoTextos } from "@/lib/catalogo";

// Edición de los textos del catálogo público. Antes vivían en el código y
// cambiar una coma exigía un despliegue; ahora los cambian los dueños.

export default function PanelTextosCatalogo({
  textosIniciales,
  puedeEditar,
}: {
  textosIniciales: CatalogoTextos;
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [quienes, setQuienes] = useState(textosIniciales.quienes_somos);
  const [chips, setChips] = useState(textosIniciales.chips);
  const [condiciones, setCondiciones] = useState(
    textosIniciales.condiciones.map((c) => ({
      titulo: c.titulo,
      texto: c.texto,
      visible_mayorista: c.visible_mayorista !== 0,
      visible_distribuidor: c.visible_distribuidor !== 0,
    }))
  );
  const [minPaquetes, setMinPaquetes] = useState(String(textosIniciales.min_paquetes));
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function guardar() {
    setOcupado(true);
    setError("");
    setMensaje("");
    try {
      const r = await fetch("/api/catalogo/textos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quienes_somos: quienes,
          chips,
          condiciones,
          min_paquetes: Number(minPaquetes) || 0,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || "No se pudo guardar.");
      } else {
        setMensaje("Guardado. Ya se ve en el catálogo público.");
        router.refresh();
      }
    } catch {
      setError("No hay conexión. Revisá internet y probá de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="card">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between"
      >
        <span className="font-display text-dulce-700">Textos del catálogo</span>
        <span className="text-sm text-dulce-500">{abierto ? "Cerrar ▾" : "Abrir ▸"}</span>
      </button>

      {abierto && (
        <div className="mt-4 flex flex-col gap-4 border-t-2 border-masa-100 pt-4">
          {!puedeEditar && (
            <p className="text-sm text-dulce-500">
              Podés ver los textos, pero tu usuario no tiene permiso para
              cambiarlos.
            </p>
          )}

          <div>
            <p className="text-sm font-semibold text-dulce-600 mb-1.5">Quiénes somos</p>
            <textarea
              className="input-grande !text-base !py-3"
              rows={6}
              value={quienes}
              disabled={!puedeEditar}
              onChange={(e) => setQuienes(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-dulce-600 mb-1.5">
              Sellos de confianza
            </p>
            <div className="flex flex-col gap-2">
              {chips.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input-grande !text-base !py-2.5 flex-1"
                    value={c}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      setChips(chips.map((x, j) => (j === i ? e.target.value : x)))
                    }
                  />
                  {puedeEditar && (
                    <button
                      onClick={() => setChips(chips.filter((_, j) => j !== i))}
                      className="px-3 rounded-xl border-2 border-alerta-500/40 text-alerta-500 text-sm"
                      aria-label={`Borrar sello ${c}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {puedeEditar && (
              <button
                onClick={() => setChips([...chips, ""])}
                className="mt-2 text-sm text-dulce-600 underline underline-offset-2"
              >
                + Agregar sello
              </button>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-dulce-600 mb-1.5">
              Mínimo de compra (paquetes surtidos)
            </p>
            <input
              className="input-grande !text-base !py-3"
              type="text"
              inputMode="numeric"
              value={minPaquetes}
              disabled={!puedeEditar}
              onChange={(e) => setMinPaquetes(e.target.value.replace(/\D/g, ""))}
            />
            <p className="text-xs text-dulce-400 mt-1.5">
              Es el número que controla la página de mayoristas. Si un producto
              tiene su propio mínimo (como la bandeja x14), se carga en el
              producto, más abajo.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-dulce-600 mb-1.5">
              Condiciones de compra
            </p>
            <div className="flex flex-col gap-3">
              {condiciones.map((c, i) => (
                <div key={i} className="rounded-2xl border-2 border-masa-100 p-3">
                  <div className="flex gap-2 items-start">
                    <input
                      className="input-grande !text-base !py-2.5 flex-1"
                      placeholder="Título (ej: Forma de pago)"
                      value={c.titulo}
                      disabled={!puedeEditar}
                      onChange={(e) =>
                        setCondiciones(
                          condiciones.map((x, j) =>
                            j === i ? { ...x, titulo: e.target.value } : x
                          )
                        )
                      }
                    />
                    {puedeEditar && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => mover(i, -1)}
                          disabled={i === 0}
                          className="w-9 h-9 rounded-lg bg-masa-100 border-2 border-masa-300 text-dulce-600 text-xs disabled:opacity-30"
                          aria-label="Subir"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => mover(i, 1)}
                          disabled={i === condiciones.length - 1}
                          className="w-9 h-9 rounded-lg bg-masa-100 border-2 border-masa-300 text-dulce-600 text-xs disabled:opacity-30"
                          aria-label="Bajar"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    className="input-grande !text-base !py-2.5 mt-2"
                    rows={3}
                    placeholder="Texto de la condición"
                    value={c.texto}
                    disabled={!puedeEditar}
                    onChange={(e) =>
                      setCondiciones(
                        condiciones.map((x, j) =>
                          j === i ? { ...x, texto: e.target.value } : x
                        )
                      )
                    }
                  />
                  <div className="mt-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-dulce-600">
                      <input
                        type="checkbox"
                        checked={c.visible_mayorista}
                        disabled={!puedeEditar}
                        onChange={(e) =>
                          setCondiciones(
                            condiciones.map((x, j) =>
                              j === i ? { ...x, visible_mayorista: e.target.checked } : x
                            )
                          )
                        }
                      />
                      Se ve en Mayorista
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-dulce-600">
                      <input
                        type="checkbox"
                        checked={c.visible_distribuidor}
                        disabled={!puedeEditar}
                        onChange={(e) =>
                          setCondiciones(
                            condiciones.map((x, j) =>
                              j === i ? { ...x, visible_distribuidor: e.target.checked } : x
                            )
                          )
                        }
                      />
                      Se ve en Distribuidor
                    </label>
                  </div>
                  {puedeEditar && (
                    <button
                      onClick={() => setCondiciones(condiciones.filter((_, j) => j !== i))}
                      className="mt-2 text-sm text-alerta-500 underline underline-offset-2"
                    >
                      Borrar esta condición
                    </button>
                  )}
                </div>
              ))}
            </div>
            {puedeEditar && (
              <button
                onClick={() =>
                  setCondiciones([
                    ...condiciones,
                    { titulo: "", texto: "", visible_mayorista: true, visible_distribuidor: true },
                  ])
                }
                className="mt-2 text-sm text-dulce-600 underline underline-offset-2"
              >
                + Agregar condición
              </button>
            )}
          </div>

          {error && <p className="text-sm text-alerta-500">{error}</p>}
          {mensaje && <p className="text-sm text-rio-600">{mensaje}</p>}

          {puedeEditar && (
            <button
              onClick={guardar}
              disabled={ocupado}
              className="btn-confirmar !py-3 !text-base disabled:opacity-50"
            >
              {ocupado ? "Guardando…" : "Guardar textos"}
            </button>
          )}
        </div>
      )}
    </section>
  );

  function mover(i: number, d: -1 | 1) {
    const copia = [...condiciones];
    const j = i + d;
    if (j < 0 || j >= copia.length) return;
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setCondiciones(copia);
  }
}
