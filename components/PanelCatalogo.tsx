"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogoProducto } from "@/lib/catalogo";
import { precioAR } from "@/lib/formato";

// --------------------------------------------------------------------------
// Editor del catálogo. Mismo login y mismos roles que el resto del panel:
// ver puede cualquiera logueado, editar solo quien puede tocar precios
// (Alejandro/Javier/Mercedes) — Francisco mira y no toca, como en Compras.
// --------------------------------------------------------------------------

const COLORES: Array<[string, string]> = [
  ["#B14539", "Rojo (Maicena)"],
  ["#4C7A4A", "Verde (Frutal)"],
  ["#2E6E93", "Celeste (Santafesino)"],
  ["#7A5C3E", "Marrón (Chocolate negro)"],
  ["#B8862E", "Dorado (Blanco / Pepas)"],
];

type Borrador = {
  nombre: string;
  peso: string;
  descripcion: string;
  precio: string; // "" = a confirmar
  badge: string;
  tag_color: string;
};

export default function PanelCatalogo({
  productosIniciales,
  puedeEditar,
}: {
  productosIniciales: CatalogoProducto[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const productos = productosIniciales;

  async function llamar(url: string, init: RequestInit): Promise<boolean> {
    setOcupado(true);
    setError("");
    try {
      const r = await fetch(url, init);
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error || "No se pudo guardar. Probá de nuevo.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("No hay conexión. Revisá internet y probá de nuevo.");
      return false;
    } finally {
      setOcupado(false);
    }
  }

  const guardar = (id: number, cambios: Record<string, unknown>) =>
    llamar(`/api/catalogo/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });

  async function mover(indice: number, direccion: -1 | 1) {
    const a = productos[indice];
    const b = productos[indice + direccion];
    if (!a || !b) return;
    // Se intercambian los valores de orden. Si empataban (ej. dos productos
    // recién creados con el mismo número), se usa la posición de la lista
    // para desempatar y que el movimiento igual se note.
    const ordenA = a.orden === b.orden ? indice + 1 : a.orden;
    const ordenB = a.orden === b.orden ? indice + 1 + direccion : b.orden;
    if (await guardar(a.id, { orden: ordenB })) {
      await guardar(b.id, { orden: ordenA });
    }
  }

  async function borrar(p: CatalogoProducto) {
    if (
      !confirm(
        `¿Borrar "${p.nombre}" del catálogo?\n\nSi solo querés sacarlo por un tiempo, es mejor desactivarlo: así no se pierde y lo volvés a prender cuando quieras.`
      )
    )
      return;
    await llamar(`/api/catalogo/${p.id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-4">
      {!puedeEditar && (
        <p className="card text-sm text-dulce-500">
          Podés ver el catálogo, pero tu usuario no tiene permiso para editarlo.
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-alerta-500/10 border-2 border-alerta-500/30 p-4 text-sm text-alerta-500">
          {error}
        </p>
      )}

      {puedeEditar && !creando && (
        <button
          onClick={() => {
            setCreando(true);
            setEditando(null);
          }}
          className="btn-secundario"
        >
          + Producto nuevo
        </button>
      )}

      {creando && (
        <Formulario
          titulo="Producto nuevo"
          inicial={{
            nombre: "",
            peso: "",
            descripcion: "",
            precio: "",
            badge: "",
            tag_color: COLORES[0][0],
          }}
          ocupado={ocupado}
          onCancelar={() => setCreando(false)}
          onGuardar={async (b) => {
            const ok = await llamar("/api/catalogo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...b, precio: b.precio === "" ? null : Number(b.precio) }),
            });
            if (ok) setCreando(false);
          }}
        />
      )}

      {productos.map((p, i) => (
        <section key={p.id} className={`card ${p.activo ? "" : "opacity-60"}`}>
          <div className="flex items-start gap-3">
            <Miniatura producto={p} />

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.tag_color }}
                />
                <p className="font-display text-dulce-700 leading-tight">{p.nombre}</p>
              </div>
              <p className="text-xs text-dulce-400 mt-0.5">{p.peso || "sin peso"}</p>
              <p className="text-sm text-dulce-600 mt-1">
                {p.precio === null ? "Precio a confirmar" : precioAR(p.precio)}
              </p>
              {p.badge && (
                <span
                  className="inline-block mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: p.tag_color }}
                >
                  {p.badge}
                </span>
              )}
              {!p.activo && (
                <p className="text-xs text-alerta-500 font-semibold mt-1.5">
                  Desactivado — no se ve en el catálogo público
                </p>
              )}
            </div>

            {puedeEditar && (
              <div className="flex flex-col gap-1 shrink-0">
                <BotonChico onClick={() => mover(i, -1)} disabled={i === 0 || ocupado} titulo="Subir">
                  ▲
                </BotonChico>
                <BotonChico
                  onClick={() => mover(i, 1)}
                  disabled={i === productos.length - 1 || ocupado}
                  titulo="Bajar"
                >
                  ▼
                </BotonChico>
              </div>
            )}
          </div>

          {puedeEditar && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditando(editando === p.id ? null : p.id);
                  setCreando(false);
                }}
                className="rounded-xl bg-masa-100 border-2 border-masa-300 px-4 py-2 text-sm font-display text-dulce-700"
              >
                {editando === p.id ? "Cerrar" : "Editar"}
              </button>
              <button
                onClick={() => guardar(p.id, { activo: !p.activo })}
                disabled={ocupado}
                className="rounded-xl bg-masa-100 border-2 border-masa-300 px-4 py-2 text-sm font-display text-dulce-700 disabled:opacity-50"
              >
                {p.activo ? "Desactivar" : "Activar"}
              </button>
              <SubirFoto
                producto={p}
                ocupado={ocupado}
                setOcupado={setOcupado}
                setError={setError}
                onListo={() => router.refresh()}
              />
              <button
                onClick={() => borrar(p)}
                disabled={ocupado}
                className="rounded-xl border-2 border-alerta-500/40 px-4 py-2 text-sm font-display text-alerta-500 disabled:opacity-50"
              >
                Borrar
              </button>
            </div>
          )}

          {editando === p.id && (
            <div className="mt-4 border-t-2 border-masa-100 pt-4">
              <Formulario
                titulo="Editar producto"
                inicial={{
                  nombre: p.nombre,
                  peso: p.peso,
                  descripcion: p.descripcion,
                  precio: p.precio === null ? "" : String(p.precio),
                  badge: p.badge,
                  tag_color: p.tag_color,
                }}
                ocupado={ocupado}
                onCancelar={() => setEditando(null)}
                onGuardar={async (b) => {
                  const ok = await guardar(p.id, {
                    ...b,
                    precio: b.precio === "" ? null : Number(b.precio),
                  });
                  if (ok) setEditando(null);
                }}
              />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Miniatura({ producto: p }: { producto: CatalogoProducto }) {
  if (!p.foto_url) {
    return (
      <div className="w-16 h-16 rounded-xl bg-masa-100 border-2 border-masa-300 shrink-0 flex items-center justify-center text-[9px] text-dulce-400 text-center leading-tight px-1">
        Sin foto
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.foto_url}
      alt={p.nombre}
      className="w-16 h-16 rounded-xl object-cover border-2 border-masa-300 shrink-0"
    />
  );
}

function BotonChico({
  children,
  titulo,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { titulo: string }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      {...rest}
      className="w-9 h-9 rounded-lg bg-masa-100 border-2 border-masa-300 text-dulce-600 text-xs disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Formulario({
  titulo,
  inicial,
  ocupado,
  onGuardar,
  onCancelar,
}: {
  titulo: string;
  inicial: Borrador;
  ocupado: boolean;
  onGuardar: (b: Borrador) => void;
  onCancelar: () => void;
}) {
  const [b, setB] = useState<Borrador>(inicial);
  const [aConfirmar, setAConfirmar] = useState(inicial.precio === "");
  const set = (k: keyof Borrador, v: string) => setB((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="card flex flex-col gap-3">
      <p className="font-display text-dulce-700">{titulo}</p>

      <Campo label="Nombre">
        <input
          className="input-grande !text-base !py-3"
          value={b.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Alfajor de Maicena x7"
        />
      </Campo>

      <Campo label="Peso / contenido">
        <input
          className="input-grande !text-base !py-3"
          value={b.peso}
          onChange={(e) => set("peso", e.target.value)}
          placeholder="350 g · 7 unidades"
        />
      </Campo>

      <Campo label="Descripción">
        <textarea
          className="input-grande !text-base !py-3"
          rows={3}
          value={b.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          placeholder="El clásico de la casa: dulce de leche y coco rallado."
        />
      </Campo>

      <Campo label="Precio por paquete">
        <label className="flex items-center gap-2 text-sm text-dulce-600 mb-2">
          <input
            type="checkbox"
            className="w-5 h-5"
            checked={aConfirmar}
            onChange={(e) => {
              setAConfirmar(e.target.checked);
              if (e.target.checked) set("precio", "");
            }}
          />
          Precio a confirmar (no muestra número en el catálogo)
        </label>
        {!aConfirmar && (
          <input
            className="input-grande !text-base !py-3"
            type="text"
            inputMode="numeric"
            value={b.precio}
            onChange={(e) => set("precio", e.target.value.replace(/[^\d]/g, ""))}
            placeholder="2500"
          />
        )}
      </Campo>

      <Campo label="Etiqueta destacada (opcional)">
        <input
          className="input-grande !text-base !py-3"
          value={b.badge}
          onChange={(e) => set("badge", e.target.value)}
          placeholder="Más vendido / Nuevo / Bajo pedido"
        />
      </Campo>

      <Campo label="Color del producto">
        <div className="flex flex-wrap gap-2">
          {COLORES.map(([hex, nombre]) => (
            <button
              key={hex}
              type="button"
              onClick={() => set("tag_color", hex)}
              title={nombre}
              aria-label={nombre}
              className={`w-10 h-10 rounded-xl border-4 ${
                b.tag_color === hex ? "border-dulce-600" : "border-transparent"
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </Campo>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onGuardar(b)}
          disabled={ocupado || !b.nombre.trim()}
          className="btn-confirmar flex-1 !py-3 !text-base disabled:opacity-50"
        >
          {ocupado ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={onCancelar} className="btn-secundario !py-3 !text-base !px-5">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-dulce-600 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

function SubirFoto({
  producto: p,
  ocupado,
  setOcupado,
  setError,
  onListo,
}: {
  producto: CatalogoProducto;
  ocupado: boolean;
  setOcupado: (v: boolean) => void;
  setError: (v: string) => void;
  onListo: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  async function elegida(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir la misma foto
    if (!archivo) return;

    setOcupado(true);
    setError("");
    try {
      const comprimida = await comprimir(archivo);
      const form = new FormData();
      form.append("foto", comprimida, "foto.jpg");
      const r = await fetch(`/api/catalogo/${p.id}/foto`, { method: "POST", body: form });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) setError(data.error || "No se pudo subir la foto.");
      else onListo();
    } catch {
      setError("No se pudo procesar la foto. Probá con otra imagen.");
    } finally {
      setOcupado(false);
    }
  }

  async function quitar() {
    setOcupado(true);
    setError("");
    try {
      await fetch(`/api/catalogo/${p.id}/foto`, { method: "DELETE" });
      onListo();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={elegida}
      />
      <button
        onClick={() => input.current?.click()}
        disabled={ocupado}
        className="rounded-xl bg-masa-100 border-2 border-masa-300 px-4 py-2 text-sm font-display text-dulce-700 disabled:opacity-50"
      >
        {p.foto_url ? "Cambiar foto" : "Subir foto"}
      </button>
      {p.foto_url && (
        <button
          onClick={quitar}
          disabled={ocupado}
          className="rounded-xl bg-masa-100 border-2 border-masa-300 px-4 py-2 text-sm font-display text-dulce-700 disabled:opacity-50"
        >
          Quitar foto
        </button>
      )}
    </>
  );
}

/**
 * Redimensiona y comprime en el celular ANTES de subir: las fotos de
 * packaging salen de la cámara con ~1 MB o más y no hace falta nada de eso
 * para una tarjeta de catálogo. Queda en ~100-200 KB sin diferencia visible.
 */
async function comprimir(archivo: File): Promise<Blob> {
  const LADO_MAX = 1000;
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("imagen inválida"));
      i.src = url;
    });

    const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    // Fondo blanco: si la original es PNG con transparencia, al pasar a JPEG
    // el transparente quedaría negro.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.72)
    );
    return blob ?? archivo;
  } finally {
    URL.revokeObjectURL(url);
  }
}
