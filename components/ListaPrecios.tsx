"use client";

import { useMemo, useState } from "react";
import type { CatalogoProducto, CatalogoTextos } from "@/lib/catalogo";
import type { Lista } from "@/lib/formato";
import { hexRgba, precioAR, precioDeLista } from "@/lib/formato";

// --------------------------------------------------------------------------
// Material comercial por canal. La misma página sirve a /mayorista y a
// /distribuidor: cambia la lista de precios y si hay mínimos de compra.
//
// Mismo estilo que el packaging: cuadrillé vichy por sabor, cinta negra y
// condensada pesada. Lee la misma tabla que el catálogo público, así que no
// hay dos verdades: un cambio de precio se ve en todos lados a la vez.
//
// El visitante no escribe nada en la base: arma el pedido acá y lo cierra por
// WhatsApp, igual que en /catalogo.
// --------------------------------------------------------------------------

const CANAL: Record<
  Exclude<Lista, "minorista">,
  { titulo: string; bajada: string; nota: string; saludo: string; conMinimos: boolean }
> = {
  mayorista: {
    titulo: "Venta mayorista y reventa",
    bajada:
      "Todo lo que necesitás para revender Nuestro Alfajor: la línea completa " +
      "con precios mayoristas, los mínimos, las condiciones y el link del " +
      "catálogo que le vas a pasar a tus propios clientes.",
    nota: "Precio mayorista por paquete",
    saludo: "Hola! Somos revendedores y queremos hacer un pedido mayorista a Nuestro Alfajor:",
    conMinimos: true,
  },
  distribuidor: {
    titulo: "Lista para distribuidores",
    bajada:
      "Precios de distribuidor sobre la línea completa. Sin mínimo de compra: " +
      "armás el pedido con las cantidades que necesites y lo cerramos por WhatsApp.",
    nota: "Precio de distribuidor por paquete",
    saludo: "Hola! Somos distribuidores y queremos hacer un pedido a Nuestro Alfajor:",
    conMinimos: false,
  },
};

type Solapa = "quienes" | "condiciones" | "pedidos" | "ganas";

// El margen se puede pensar de dos maneras y cada revendedor usa la suya:
// un porcentaje sobre el costo, o "le sumo tantos pesos a cada paquete".
type ModoMargen = "porcentaje" | "pesos";

// Pedidos es lo primero y lo que se ve al entrar: es lo que un revendedor
// viene a hacer. Condiciones y Quiénes somos van al final, en ese orden,
// porque son consulta, no la tarea principal.
const SOLAPAS: Array<[Solapa, string]> = [
  ["pedidos", "Pedidos"],
  ["ganas", "Cuánto ganás"],
  ["condiciones", "Condiciones comerciales"],
  ["quienes", "Quiénes somos"],
];

export default function ListaPrecios({
  lista,
  productos,
  textos,
  whatsapp,
  instagram,
}: {
  lista: Exclude<Lista, "minorista">;
  productos: CatalogoProducto[];
  textos: CatalogoTextos;
  whatsapp: string;
  instagram: string;
}) {
  const canal = CANAL[lista];
  // El simulador de reventa ("Cuánto ganás") es una herramienta para quien
  // revende con margen propio: aplica a mayorista, no a distribuidor.
  const solapas = lista === "distribuidor" ? SOLAPAS.filter(([id]) => id !== "ganas") : SOLAPAS;
  const condicionesCanal = textos.condiciones.filter((c) =>
    lista === "mayorista" ? c.visible_mayorista !== 0 : c.visible_distribuidor !== 0
  );
  const [solapa, setSolapa] = useState<Solapa>("pedidos");
  // Cantidad como TEXTO: los pedidos mayoristas son por volumen y hay que
  // poder tipear "30" sin que el campo se reescriba en cada tecla.
  const [cant, setCant] = useState<Record<number, string>>({});
  const [modoMargen, setModoMargen] = useState<ModoMargen>("porcentaje");
  const [markup, setMarkup] = useState(50);
  // Pesos que se le suman a CADA paquete. Se guarda como texto para poder
  // escribir el número directo sin pelear con el campo.
  const [pesosExtra, setPesosExtra] = useState("1000");

  // El precio depende del canal; el resto de la ficha es el mismo.
  const elegidos = useMemo(
    () =>
      productos
        .map((p) => ({ p, q: aEntero(cant[p.id]), precio: precioDeLista(p, lista) }))
        .filter((x) => x.q > 0),
    [productos, cant, lista]
  );

  const total = elegidos.reduce((a, { precio, q }) => a + (precio ?? 0) * q, 0);
  const sueltos = elegidos
    .filter(({ p }) => !p.minimo_propio)
    .reduce((a, { q }) => a + q, 0);
  const totalUnidades = elegidos.reduce((a, { q }) => a + q, 0);

  // Cada producto con mínimo propio se controla por separado. Los
  // distribuidores no tienen mínimos: compran por volumen y el freno sobra.
  const conMinimoPropio = canal.conMinimos ? elegidos.filter(({ p }) => p.minimo_propio) : [];
  const faltaAlgo =
    canal.conMinimos &&
    ((sueltos > 0 && sueltos < textos.min_paquetes) ||
      conMinimoPropio.some(({ p, q }) => q < (p.minimo_propio ?? 0)));

  function sumar(id: number, d: number) {
    setCant((prev) => ({ ...prev, [id]: String(Math.max(0, aEntero(prev[id]) + d)) }));
  }

  const mensaje = construirMensaje(canal.saludo, elegidos, total, faltaAlgo);
  const linkWsp = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="may">
      <header className="may-masthead">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nuestro-alfajor.png" alt="Nuestro Alfajor — Artesanal" className="may-logo" />
        <h1 className="may-titulo">{canal.titulo}</h1>
        <p className="may-kicker">Fábrica artesanal · Paraná, Entre Ríos</p>
        <p className="may-bajada">{canal.bajada}</p>
        <div className="may-franja" style={vichy("#B14539", 0.55)} aria-hidden="true" />
      </header>

      <nav className="may-solapas" aria-label="Secciones">
        <div className="may-solapas-inner" role="tablist">
          {solapas.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={solapa === id}
              className={`may-solapa ${solapa === id ? "activa" : ""}`}
              onClick={() => setSolapa(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="may-ancho">
        {solapa === "quienes" && (
          <section>
            <Rotulo titulo="Quiénes somos" nota="Desde Paraná" />
            <p className="may-parrafo">{textos.quienes_somos}</p>
            <ul className="may-sellos">
              {textos.chips.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            <Rotulo titulo="Cómo se pide" nota="Cuatro pasos" espacio />
            <ol className="may-pasos">
              {PASOS.map(([t, d], i) => (
                <li key={t}>
                  <span className="may-num">{i + 1}</span>
                  <div>
                    <h3>{t}</h3>
                    <p className="may-plomo">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {solapa === "condiciones" && (
          <section>
            <Rotulo titulo="Condiciones comerciales" nota="Vigentes" />
            <dl className="may-cond">
              {condicionesCanal.map((c) => (
                <div key={c.id}>
                  <dt>{c.titulo}</dt>
                  <dd>{c.texto}</dd>
                </div>
              ))}
            </dl>

            <Rotulo titulo="Contacto" nota="Nuestro Alfajor" espacio />
            <div className="may-contacto">
              <p className="may-cinta">Nuestro Alfajor · Artesanal</p>
              <p className="may-plomo" style={{ marginTop: "1rem" }}>
                Prof. Diego Mackinnon 1590
                <br />
                Paraná, Entre Ríos
              </p>
              <div className="may-enlaces">
                <a href={`https://wa.me/${whatsapp}`}>WhatsApp 343 507-8807</a>
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer">
                  Instagram @{instagram}
                </a>
                <a href="/catalogo" target="_blank" rel="noopener noreferrer">
                  Catálogo para pasarle a tus clientes ↗
                </a>
              </div>
              <p className="may-plomo" style={{ fontSize: ".82rem", marginTop: "1.25rem" }}>
                Ese último link es el catálogo público: mandáselo a tus clientes y
                arman el pedido solos desde el celular.
              </p>
            </div>
          </section>
        )}

        {solapa === "pedidos" && (
          <section>
            <Rotulo titulo="Línea y precios" nota={canal.nota} />
            <p className="may-plomo">
              Poné las cantidades y el pedido se arma solo. Podés escribir el
              número directo
              {canal.conMinimos ? " — abajo te vamos avisando si llegás a los mínimos." : "."}
            </p>

            <div className="may-lista">
              {productos.map((p) => (
                <Tarjeta
                  key={p.id}
                  producto={p}
                  precio={precioDeLista(p, lista)}
                  mostrarMinimo={canal.conMinimos}
                  valor={cant[p.id] ?? ""}
                  onCambiar={(v) => setCant((prev) => ({ ...prev, [p.id]: v }))}
                  onSumar={(d) => sumar(p.id, d)}
                  onSalir={() =>
                    setCant((prev) => {
                      const n = aEntero(prev[p.id]);
                      return { ...prev, [p.id]: n > 0 ? String(n) : "" };
                    })
                  }
                />
              ))}
            </div>

            <div className="may-chequeo">
              {!canal.conMinimos ? (
                elegidos.length === 0 ? (
                  <p className="may-plomo" style={{ margin: 0, fontSize: ".9rem" }}>
                    Sin mínimo de compra: armá el pedido con las cantidades que
                    necesites.
                  </p>
                ) : (
                  <div className="may-total">
                    <span>Total del pedido</span>
                    <b>{precioAR(total)}</b>
                  </div>
                )
              ) : elegidos.length === 0 ? (
                <p className="may-plomo" style={{ margin: 0, fontSize: ".9rem" }}>
                  Mínimo de compra: {textos.min_paquetes} paquetes surtidos.
                  {productos
                    .filter((p) => p.minimo_propio)
                    .map((p) => ` ${p.nombre} tiene su propio mínimo de ${p.minimo_propio}.`)
                    .join("")}
                </p>
              ) : (
                <>
                  {sueltos > 0 && (
                    <Chequeo
                      ok={sueltos >= textos.min_paquetes}
                      texto={`${sueltos} de ${textos.min_paquetes} paquetes surtidos`}
                      nota={
                        sueltos >= textos.min_paquetes
                          ? "llegás al mínimo"
                          : `te faltan ${textos.min_paquetes - sueltos}`
                      }
                    />
                  )}
                  {conMinimoPropio.map(({ p, q }) => (
                    <Chequeo
                      key={p.id}
                      ok={q >= (p.minimo_propio ?? 0)}
                      texto={`${q} de ${p.minimo_propio} · ${p.nombre}`}
                      nota={
                        q >= (p.minimo_propio ?? 0)
                          ? "llegás al mínimo"
                          : `te faltan ${(p.minimo_propio ?? 0) - q}`
                      }
                    />
                  ))}
                  <div className="may-total">
                    <span>Total del pedido</span>
                    <b>{precioAR(total)}</b>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {solapa === "ganas" && (
          <section>
            <Rotulo titulo="Cuánto ganás" nota="Simulador de reventa" />
            <div className="may-sim">
              <b>Margen que le querés poner a la reventa</b>
              <p className="may-plomo" style={{ fontSize: ".86rem", margin: ".3rem 0 .9rem" }}>
                El precio de reventa lo definís vos: Nuestro Alfajor no fija precio
                de venta al público. Ponelo como te resulte más cómodo y ves cómo
                queda tu ganancia sobre el pedido que armaste en la solapa Pedidos.
              </p>

              <div className="may-modo" role="tablist" aria-label="Forma de calcular el margen">
                <button
                  role="tab"
                  aria-selected={modoMargen === "porcentaje"}
                  className={modoMargen === "porcentaje" ? "activa" : ""}
                  onClick={() => setModoMargen("porcentaje")}
                >
                  Por porcentaje
                </button>
                <button
                  role="tab"
                  aria-selected={modoMargen === "pesos"}
                  className={modoMargen === "pesos" ? "activa" : ""}
                  onClick={() => setModoMargen("pesos")}
                >
                  Por pesos
                </button>
              </div>

              {modoMargen === "porcentaje" ? (
                <>
                  <input
                    id="markup"
                    className="may-slider"
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={markup}
                    onChange={(e) => setMarkup(Number(e.target.value))}
                    aria-label="Porcentaje sobre el costo"
                  />
                  <p className="may-markup">+{markup}% sobre el costo</p>
                </>
              ) : (
                <div className="may-pesos">
                  <label htmlFor="pesos-extra">Le sumo a cada paquete</label>
                  <div className="may-pesos-campo">
                    <span>$</span>
                    <input
                      id="pesos-extra"
                      type="text"
                      inputMode="numeric"
                      value={pesosExtra}
                      placeholder="0"
                      onChange={(e) => setPesosExtra(e.target.value.replace(/[^\d]/g, ""))}
                    />
                  </div>
                </div>
              )}

              {elegidos.length === 0 ? (
                <div className="may-vacio">
                  <p className="may-plomo" style={{ margin: 0 }}>
                    Todavía no armaste ningún pedido.
                  </p>
                  <button className="may-btn-ir" onClick={() => setSolapa("pedidos")}>
                    Ir a armar el pedido
                  </button>
                </div>
              ) : (
                <Simulador
                  elegidos={elegidos}
                  modo={modoMargen}
                  markup={markup}
                  pesosExtra={aEntero(pesosExtra)}
                />
              )}
            </div>
          </section>
        )}

        <p className="may-credito">
          Material comercial preparado por Palanca Consultores para Nuestro Alfajor
        </p>
      </main>

      <div className={`may-barra ${elegidos.length ? "visible" : ""}`} aria-hidden={!elegidos.length}>
        <div className="may-barra-inner">
          <span className="may-resumen">
            {totalUnidades} paquete{totalUnidades === 1 ? "" : "s"} · {precioAR(total)}
          </span>
          <a
            className="may-wsp"
            href={linkWsp}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={elegidos.length === 0}
          >
            {faltaAlgo ? "Consultar por WhatsApp" : "Pedir por WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const PASOS: Array<[string, string]> = [
  ["Armás el pedido y lo mandás por WhatsApp", "Desde la solapa Pedidos, o escribiendo directo al 343 507-8807."],
  ["Reservamos la fecha de entrega", "Mínimo 3 días de anticipación. Los pedidos grandes conviene reservarlos antes."],
  ["Producimos tu pedido", "Se elabora especialmente para vos, en tandas chicas."],
  ["Retirás y pagás", "En Prof. Diego Mackinnon 1590, Paraná. 50% efectivo + 50% transferencia, o 100% efectivo."],
];

function Rotulo({ titulo, nota, espacio }: { titulo: string; nota: string; espacio?: boolean }) {
  return (
    <div className="may-rotulo" style={espacio ? { marginTop: "2.5rem" } : undefined}>
      <h2>{titulo}</h2>
      <span>{nota}</span>
    </div>
  );
}

function Chequeo({ ok, texto, nota }: { ok: boolean; texto: string; nota: string }) {
  return (
    <div className="may-chequeo-fila">
      <span className={ok ? "may-ok" : "may-falta"}>{ok ? "✓" : "!"}</span>
      <span>
        <b>{texto}</b> — {nota}
      </span>
    </div>
  );
}

function Tarjeta({
  producto: p,
  precio,
  mostrarMinimo,
  valor,
  onCambiar,
  onSumar,
  onSalir,
}: {
  producto: CatalogoProducto;
  precio: number | null;
  mostrarMinimo: boolean;
  valor: string;
  onCambiar: (v: string) => void;
  onSumar: (d: number) => void;
  onSalir: () => void;
}) {
  return (
    <article className="may-prod">
      <span className="may-banda" style={{ backgroundColor: p.tag_color, ...vichy("#ffffff", 0.35) }} />
      <figure>
        {p.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.foto_url} alt={`Paquete de ${p.nombre}`} />
        ) : (
          <div className="may-sinfoto" style={vichy(p.tag_color, 0.3)}>
            Foto próximamente
          </div>
        )}
      </figure>
      <div className="may-cuerpo">
        <h3>{p.nombre}</h3>
        {p.peso && <p className="may-meta">{p.peso}</p>}
        <div className="may-fila-precio">
          <span className="may-precio">
            {precio === null ? (
              <span style={{ fontSize: "1rem" }}>Precio a confirmar</span>
            ) : (
              <>
                {precioAR(precio)} <small>c/u</small>
              </>
            )}
          </span>
          {mostrarMinimo && p.minimo_propio ? (
            <span className="may-aviso" style={{ color: p.tag_color }}>
              Mínimo {p.minimo_propio}
            </span>
          ) : null}
          {p.badge ? (
            <span className="may-aviso" style={{ color: p.tag_color }}>
              {p.badge}
            </span>
          ) : null}
          <div className="may-stepper">
            <button type="button" onClick={() => onSumar(-1)} aria-label={`Quitar uno de ${p.nombre}`}>
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={valor}
              placeholder="0"
              aria-label={`Cantidad de ${p.nombre}`}
              onChange={(e) => onCambiar(e.target.value.replace(/[^\d]/g, ""))}
              onBlur={onSalir}
            />
            <button type="button" onClick={() => onSumar(1)} aria-label={`Agregar uno de ${p.nombre}`}>
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Simulador({
  elegidos,
  modo,
  markup,
  pesosExtra,
}: {
  elegidos: Array<{ p: CatalogoProducto; q: number; precio: number | null }>;
  modo: ModoMargen;
  markup: number;
  pesosExtra: number;
}) {
  // Por porcentaje, el precio de reventa es el costo más un %. Por pesos, se
  // le suma el mismo importe a CADA paquete — que es como lo piensa el que
  // revende: "le pongo mil pesos a cada uno".
  const ventaUnitaria = (costoUnitario: number) =>
    modo === "porcentaje" ? costoUnitario * (1 + markup / 100) : costoUnitario + pesosExtra;

  const filas = elegidos.map(({ p, q, precio }) => {
    const unitario = precio ?? 0;
    return {
      p,
      q,
      unitario,
      costo: unitario * q,
      venta: ventaUnitaria(unitario) * q,
      unitaria: ventaUnitaria(unitario),
    };
  });

  const costo = filas.reduce((a, f) => a + f.costo, 0);
  const venta = filas.reduce((a, f) => a + f.venta, 0);
  const ganancia = venta - costo;

  return (
    <>
      <div className="may-sim-grid">
        <Dato etiqueta="Te cuesta" valor={precioAR(costo)} />
        <Dato etiqueta="Vendés en" valor={precioAR(venta)} />
        <Dato etiqueta="Ganás" valor={precioAR(ganancia)} />
        <Dato
          etiqueta={modo === "porcentaje" ? "Margen sobre venta" : "Equivale a"}
          valor={
            modo === "porcentaje"
              ? (venta > 0 ? Math.round((ganancia / venta) * 100) : 0) + "%"
              : "+" + (costo > 0 ? Math.round((ganancia / costo) * 100) : 0) + "%"
          }
        />
      </div>

      <div className="may-tabla">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Costo c/u</th>
              <th>Revendés c/u</th>
              <th>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.p.id}>
                <td>{f.p.nombre}</td>
                <td>{f.q}</td>
                <td>{precioAR(f.unitario)}</td>
                <td>{precioAR(f.unitaria)}</td>
                <td>{precioAR(f.venta - f.costo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="may-dato">
      <span>{etiqueta}</span>
      <b>{valor}</b>
    </div>
  );
}

// ---------------------------------------------------------------------------

function aEntero(v: string | undefined): number {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Cuadrillé vichy del color del producto, como en el envase. */
function vichy(hex: string, alpha: number): React.CSSProperties {
  const c = hexRgba(hex, alpha);
  return {
    backgroundImage: `repeating-linear-gradient(0deg, ${c} 0 6px, transparent 6px 12px),
       repeating-linear-gradient(90deg, ${c} 0 6px, transparent 6px 12px)`,
  };
}

function construirMensaje(
  saludo: string,
  elegidos: Array<{ p: CatalogoProducto; q: number; precio: number | null }>,
  total: number,
  faltaAlgo: boolean
): string {
  const lineas = elegidos.map(({ p, q, precio }) =>
    precio === null
      ? `${q}x ${p.nombre} — precio a confirmar`
      : `${q}x ${p.nombre} — ${precioAR(precio * q)}`
  );
  const l = [saludo, ...lineas, `Total: ${precioAR(total)}`];
  if (faltaAlgo) l.push("(Sabemos que todavía no llegamos al mínimo, queríamos consultarlo.)");
  l.push("¿Coordinamos la fecha de entrega? Gracias!");
  return l.join("\n");
}
