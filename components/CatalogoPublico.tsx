"use client";

import { useMemo, useState } from "react";
import type { CatalogoProducto, CatalogoTextos } from "@/lib/catalogo";
import { hexRgba, precioAR } from "@/lib/formato";

// --------------------------------------------------------------------------
// Catálogo público. Todo el estado es local y efímero: el visitante arma el
// pedido acá y lo cierra por WhatsApp. Nada se guarda en la base — el canal
// de entrada de pedidos sigue siendo uno solo (Pedidos/Remito del panel).
// --------------------------------------------------------------------------

type Estilo = "foto" | "etiqueta";

export default function CatalogoPublico({
  productos,
  textos,
  whatsapp,
  instagram,
}: {
  productos: CatalogoProducto[];
  textos: CatalogoTextos;
  whatsapp: string;
  instagram: string;
}) {
  // La cantidad se guarda como TEXTO tal cual lo tipea el cliente. Así el
  // input nunca pelea con el estado mientras escribe (ej. tipear "30": si
  // normalizáramos en cada tecla, el "3" intermedio se reescribiría solo).
  // Se normaliza recién al salir del campo.
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [estilo, setEstilo] = useState<Estilo>("foto");
  const [expandido, setExpandido] = useState(false);

  // Este catálogo es el del consumidor final: usa el precio MINORISTA, que se
  // carga aparte del mayorista y del de distribuidor.
  const elegidos = useMemo(
    () =>
      productos
        .map((p) => ({ p, cant: aEntero(cantidades[p.id]), precio: p.precio_minorista }))
        .filter((x) => x.cant > 0),
    [productos, cantidades]
  );

  const totalConocido = elegidos.reduce(
    (a, { precio, cant }) => a + (precio ?? 0) * cant,
    0
  );
  const unidadesAConfirmar = elegidos.reduce(
    (a, { precio, cant }) => a + (precio === null ? cant : 0),
    0
  );
  const totalUnidades = elegidos.reduce((a, x) => a + x.cant, 0);

  function setCant(id: number, valor: string) {
    setCantidades((prev) => ({ ...prev, [id]: valor }));
  }
  function sumar(id: number, delta: number) {
    setCantidades((prev) => ({
      ...prev,
      [id]: String(Math.max(0, aEntero(prev[id]) + delta)),
    }));
  }
  function normalizar(id: number) {
    setCantidades((prev) => {
      const n = aEntero(prev[id]);
      return { ...prev, [id]: n > 0 ? String(n) : "" };
    });
  }

  const mensaje = construirMensaje(elegidos, totalConocido, unidadesAConfirmar);
  const linkWsp = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="min-h-screen bg-cat-fondo text-cat-tinta">
      <div className="mx-auto max-w-[600px] pb-40">
        {/* ---------------- Hero ---------------- */}
        <header className="px-5 pt-8 pb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-cat-caramelo font-semibold">
            Fábrica artesanal · Paraná, Entre Ríos
          </p>

          <div className="mt-5 inline-block rounded-2xl bg-white px-6 py-5 shadow-sm border border-cat-borde">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-512.png"
              alt="Nuestro Alfajor — artesanal"
              className="w-44 h-auto mx-auto"
            />
          </div>

          <h1 className="mt-7 font-display text-[1.9rem] leading-tight text-cat-tinta">
            Alfajores artesanales para tu escuela, club o empresa
          </h1>

          <p className="mt-4 text-cat-suave leading-relaxed">
            Elegí las cantidades acá abajo y cerrá el pedido por WhatsApp con
            Mercedes. Sin pagos online: coordinamos entrega y pago directamente
            con vos.
          </p>

          <div
            className="mt-7 mx-auto w-36 h-36 rounded-full border-4 border-white shadow-sm overflow-hidden flex items-center justify-center"
            style={vichy("#B14539")}
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="w-24 h-24 opacity-95" />
          </div>

          <a
            href="#productos"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-cat-caramelo px-8 py-4 font-display text-lg text-white shadow-md active:scale-[0.98] transition-transform"
          >
            Ver productos y armar pedido
          </a>
        </header>

        {/* ---------------- Quiénes somos ---------------- */}
        <section className="mx-5 rounded-2xl bg-white border border-cat-borde p-6">
          <h2 className="font-display text-xl text-cat-tinta">Quiénes somos</h2>
          <p className="mt-3 text-cat-suave leading-relaxed whitespace-pre-line">
            {textos.quienes_somos}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {textos.chips.map((c) => (
              <li
                key={c}
                className="rounded-full bg-cat-fondo border border-cat-borde px-3 py-1.5 text-xs font-semibold text-cat-caramelo"
              >
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- Productos ---------------- */}
        <section id="productos" className="mt-10 px-5 scroll-mt-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl text-cat-tinta">
              Línea de productos
            </h2>
            <SelectorEstilo estilo={estilo} setEstilo={setEstilo} />
          </div>
          <p className="mt-2 text-sm text-cat-suave">
            Poné la cantidad de paquetes de cada uno. Podés escribir el número
            directo.
          </p>

          {productos.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white border border-cat-borde p-6 text-center text-cat-suave">
              Estamos actualizando el catálogo. Escribinos por WhatsApp y te
              pasamos la lista al momento.
            </p>
          ) : (
            <div className="mt-5 flex flex-col gap-4">
              {productos.map((p) => (
                <TarjetaProducto
                  key={p.id}
                  producto={p}
                  estilo={estilo}
                  valor={cantidades[p.id] ?? ""}
                  onCambiar={(v) => setCant(p.id, v)}
                  onSumar={(d) => sumar(p.id, d)}
                  onSalir={() => normalizar(p.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ---------------- Condiciones de compra ---------------- */}
        <section className="mt-10 mx-5 rounded-2xl bg-white border border-cat-borde p-6">
          <h2 className="font-display text-xl text-cat-tinta">
            Condiciones de compra
          </h2>
          <dl className="mt-4 flex flex-col gap-3">
            {textos.condiciones.map((c) => (
              <div key={c.id} className="border-b border-cat-borde pb-3 last:border-0 last:pb-0">
                <dt className="font-semibold text-sm text-cat-caramelo">{c.titulo}</dt>
                <dd className="text-cat-suave text-sm leading-relaxed mt-0.5">{c.texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- Contacto / footer ---------------- */}
        <footer className="mt-10">
          <div className="mx-5 rounded-2xl bg-white border border-cat-borde p-6 text-center">
            <p className="font-display text-xl text-cat-tinta">Nuestro Alfajor</p>
            <p className="mt-2 text-sm text-cat-suave">
              Prof. Diego Mackinnon 1590
              <br />
              Paraná, Entre Ríos
            </p>
            <div className="mt-4 flex flex-col gap-2 items-center">
              <a
                href={`https://wa.me/${whatsapp}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cat-caramelo underline underline-offset-2"
              >
                <IconoWhatsapp /> 343 507-8807
              </a>
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cat-caramelo underline underline-offset-2"
              >
                <IconoInstagram /> @{instagram}
              </a>
            </div>
            <p className="mt-3 text-xs text-cat-suave">
              Retiros: lunes a viernes de 17:00 a 18:30 hs · sábados de 9:00 a
              11:00 hs
            </p>
          </div>

          <div className="mt-8 bg-cat-navy py-4 text-center">
            <p className="text-[11px] text-white/70">
              Sistema desarrollado por Palanca Consultores
            </p>
          </div>
        </footer>
      </div>

      <BarraResumen
        elegidos={elegidos}
        totalUnidades={totalUnidades}
        totalConocido={totalConocido}
        unidadesAConfirmar={unidadesAConfirmar}
        mensaje={mensaje}
        linkWsp={linkWsp}
        expandido={expandido}
        setExpandido={setExpandido}
        onSumar={sumar}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function SelectorEstilo({
  estilo,
  setEstilo,
}: {
  estilo: Estilo;
  setEstilo: (e: Estilo) => void;
}) {
  return (
    <div className="flex rounded-full bg-white border border-cat-borde p-0.5 text-[11px] font-semibold shrink-0">
      {(
        [
          ["foto", "Foto"],
          ["etiqueta", "Etiqueta"],
        ] as Array<[Estilo, string]>
      ).map(([valor, label]) => (
        <button
          key={valor}
          type="button"
          onClick={() => setEstilo(valor)}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            estilo === valor ? "bg-cat-caramelo text-white" : "text-cat-suave"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function TarjetaProducto({
  producto: p,
  estilo,
  valor,
  onCambiar,
  onSumar,
  onSalir,
}: {
  producto: CatalogoProducto;
  estilo: Estilo;
  valor: string;
  onCambiar: (v: string) => void;
  onSumar: (delta: number) => void;
  onSalir: () => void;
}) {
  const cant = aEntero(valor);
  const elegido = cant > 0;

  return (
    <article
      className={`rounded-2xl bg-white overflow-hidden border transition-colors ${
        elegido ? "border-cat-caramelo shadow-md" : "border-cat-borde"
      }`}
    >
      {estilo === "foto" ? (
        <div className="relative h-44 bg-cat-fondo">
          {p.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
          ) : (
            <Placeholder color={p.tag_color} />
          )}
          {p.badge && <Badge texto={p.badge} color={p.tag_color} flotante />}
        </div>
      ) : (
        <div className="relative h-44 flex items-center justify-center" style={vichy(p.tag_color)}>
          <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
            {p.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/icon-192.png" alt="" className="w-20 h-20" />
            )}
          </div>
          {p.badge && <Badge texto={p.badge} color={p.tag_color} flotante />}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start gap-2">
          <span
            className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: p.tag_color }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight text-cat-tinta">{p.nombre}</h3>
            {p.peso && <p className="text-xs text-cat-suave mt-0.5">{p.peso}</p>}
          </div>
        </div>

        {p.descripcion && (
          <p className="mt-3 text-sm text-cat-suave leading-relaxed">{p.descripcion}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="font-display text-lg text-cat-caramelo">
            {p.precio_minorista === null ? (
              <span className="text-base text-cat-suave">Precio a confirmar</span>
            ) : (
              <>
                {precioAR(p.precio_minorista)} <span className="text-sm text-cat-suave">c/u</span>
              </>
            )}
          </p>

          <Stepper valor={valor} onCambiar={onCambiar} onSumar={onSumar} onSalir={onSalir} etiqueta={p.nombre} />
        </div>

        {elegido && p.precio_minorista !== null && (
          <p className="mt-3 text-right text-sm font-semibold text-cat-tinta">
            Subtotal: {precioAR(p.precio_minorista * cant)}
          </p>
        )}
      </div>
    </article>
  );
}

function Stepper({
  valor,
  onCambiar,
  onSumar,
  onSalir,
  etiqueta,
}: {
  valor: string;
  onCambiar: (v: string) => void;
  onSumar: (d: number) => void;
  onSalir: () => void;
  etiqueta: string;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <BotonStepper onClick={() => onSumar(-1)} aria-label={`Quitar uno de ${etiqueta}`}>
        −
      </BotonStepper>
      <input
        // inputMode numérico: en el celular abre el teclado de números, pero
        // sigue siendo type=text para poder quedar vacío sin pelear con el
        // spinner nativo de type=number.
        type="text"
        inputMode="numeric"
        value={valor}
        placeholder="0"
        aria-label={`Cantidad de ${etiqueta}`}
        onChange={(e) => onCambiar(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={onSalir}
        className="w-14 text-center rounded-xl border-2 border-cat-borde bg-white py-2 font-display text-lg text-cat-tinta focus:outline-none focus:border-cat-caramelo"
      />
      <BotonStepper onClick={() => onSumar(1)} aria-label={`Agregar uno de ${etiqueta}`}>
        +
      </BotonStepper>
    </div>
  );
}

function BotonStepper({
  children,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="w-10 h-10 rounded-xl bg-cat-fondo border-2 border-cat-borde font-display text-xl text-cat-caramelo leading-none active:scale-95 transition-transform"
    >
      {children}
    </button>
  );
}

function Badge({ texto, color, flotante }: { texto: string; color: string; flotante?: boolean }) {
  return (
    <span
      className={`${flotante ? "absolute top-3 left-3" : ""} rounded-full px-3 py-1 text-[11px] font-bold text-white shadow-sm`}
      style={{ backgroundColor: color }}
    >
      {texto}
    </span>
  );
}

function Placeholder({ color }: { color: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={vichy(color)}>
      <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-cat-suave">
        Foto próximamente
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------

function BarraResumen({
  elegidos,
  totalUnidades,
  totalConocido,
  unidadesAConfirmar,
  mensaje,
  linkWsp,
  expandido,
  setExpandido,
  onSumar,
}: {
  elegidos: Array<{ p: CatalogoProducto; cant: number }>;
  totalUnidades: number;
  totalConocido: number;
  unidadesAConfirmar: number;
  mensaje: string;
  linkWsp: string;
  expandido: boolean;
  setExpandido: (v: boolean) => void;
  onSumar: (id: number, delta: number) => void;
}) {
  const hayAlgo = elegidos.length > 0;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 transition-transform duration-300 ${
        hayAlgo ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!hayAlgo}
    >
      <div className="mx-auto max-w-[600px] rounded-t-2xl bg-white border-t-2 border-x-2 border-cat-borde shadow-[0_-8px_24px_rgba(46,32,19,0.12)]">
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="font-display text-cat-tinta">
            {elegidos.length} producto{elegidos.length === 1 ? "" : "s"} ·{" "}
            {precioAR(totalConocido)}
          </span>
          <span className="text-sm text-cat-caramelo font-semibold">
            {expandido ? "Ocultar ▾" : "Ver detalle ▴"}
          </span>
        </button>

        {expandido && (
          <div className="px-5 pb-4 max-h-[45vh] overflow-y-auto border-t border-cat-borde pt-4">
            <div className="flex flex-col gap-3">
              {elegidos.map(({ p, cant }) => (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-cat-tinta truncate">{p.nombre}</p>
                    <p className="text-xs text-cat-suave">
                      {p.precio_minorista === null ? "A confirmar" : precioAR(p.precio_minorista * cant)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSumar(p.id, -1)}
                      aria-label={`Quitar uno de ${p.nombre}`}
                      className="w-8 h-8 rounded-lg bg-cat-fondo border border-cat-borde text-cat-caramelo font-display leading-none"
                    >
                      −
                    </button>
                    <span className="w-7 text-center font-display text-cat-tinta">{cant}</span>
                    <button
                      type="button"
                      onClick={() => onSumar(p.id, 1)}
                      aria-label={`Agregar uno de ${p.nombre}`}
                      className="w-8 h-8 rounded-lg bg-cat-fondo border border-cat-borde text-cat-caramelo font-display leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {unidadesAConfirmar > 0 && (
              <p className="mt-3 text-xs text-cat-suave">
                + {unidadesAConfirmar}{" "}
                {unidadesAConfirmar === 1 ? "unidad" : "unidades"} con precio a
                confirmar
              </p>
            )}

            <div className="mt-4 rounded-2xl rounded-bl-sm bg-[#DCF8C6] p-3">
              <p className="text-[11px] font-semibold text-cat-suave mb-1">
                Así le llega el mensaje a Mercedes:
              </p>
              <pre className="whitespace-pre-wrap break-words font-body text-xs text-cat-tinta">
                {mensaje}
              </pre>
            </div>
          </div>
        )}

        <div className="px-5 pb-5 pt-1">
          <a
            href={linkWsp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-cat-wsp px-6 py-4 font-display text-lg text-white shadow-md active:scale-[0.98] transition-transform"
          >
            Enviar pedido por WhatsApp
          </a>
          <p className="mt-2 text-center text-[11px] text-cat-suave">
            {totalUnidades} paquete{totalUnidades === 1 ? "" : "s"} · el mínimo
            de compra es 15
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

/* Iconos en SVG inline: no se puede depender de una librería externa ni de
   una fuente de íconos, el catálogo tiene que cargar rápido en un celular
   con datos móviles. */
function IconoWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21z" />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function aEntero(v: string | undefined): number {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Cuadrillé vichy del color del producto (dos tramas cruzadas, como el logo). */
function vichy(hex: string): React.CSSProperties {
  const c = hexRgba(hex, 0.42);
  return {
    backgroundColor: "#ffffff",
    backgroundImage: `repeating-linear-gradient(0deg, ${c} 0 14px, transparent 14px 28px),
       repeating-linear-gradient(90deg, ${c} 0 14px, transparent 14px 28px)`,
  };
}

function construirMensaje(
  elegidos: Array<{ p: CatalogoProducto; cant: number }>,
  totalConocido: number,
  unidadesAConfirmar: number
): string {
  const lineas = elegidos.map(({ p, cant }) =>
    p.precio_minorista === null
      ? `${cant}x ${p.nombre} — precio a confirmar`
      : `${cant}x ${p.nombre} — ${precioAR(p.precio_minorista * cant)}`
  );

  let total = `Total (precio de lista): ${precioAR(totalConocido)}`;
  if (unidadesAConfirmar > 0) {
    total += ` + ${unidadesAConfirmar} ${
      unidadesAConfirmar === 1 ? "unidad" : "unidades"
    } a confirmar precio`;
  }

  return [
    "Hola! Quiero hacer un pedido a Nuestro Alfajor:",
    ...lineas,
    total,
    "¿Coordinamos la entrega? Gracias!",
  ].join("\n");
}
