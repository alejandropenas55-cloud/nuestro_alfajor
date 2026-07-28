import { NextRequest, NextResponse } from "next/server";

// --------------------------------------------------------------------------
// Separación de "puertas de entrada" por dirección web.
//
// La app es UNA sola (una base de datos, un despliegue), pero se entra por dos
// direcciones distintas y cada una ve una cosa distinta:
//
//   catalogo.nuestroalfajor.com.ar  -> SOLO el catálogo público. El panel no
//                                      existe desde acá: cualquier otra
//                                      dirección devuelve al catálogo. Un
//                                      cliente nunca ve la pantalla de login.
//   nuestroalfajor.com.ar           -> el sistema completo, como siempre.
//
// Qué direcciones cuentan como "catálogo" se configura con CATALOGO_HOSTS
// (separadas por coma) para no tener que tocar código al comprar el dominio.
// Si no está definida, se toma cualquier host que empiece con "catalogo.".
// --------------------------------------------------------------------------

/** Lo único que el host del catálogo tiene permitido servir. */
const PERMITIDO = [
  /^\/catalogo$/,
  // Las otras dos listas de precios. Son PÚBLICAS: cualquiera con el link ve
  // los precios de ese canal. Si en algún momento hay que reservarlas, se
  // sacan de esta lista y se les pone una puerta.
  /^\/mayoristas?$/,
  /^\/distribuidor$/,
  // Las fotos de los productos. Es de solo lectura y ya era pública.
  /^\/api\/catalogo\/\d+\/foto$/,
  // Archivos que el navegador necesita para dibujar la página.
  /^\/_next\//,
  /^\/(favicon-32|icon-180|icon-192|icon-512|logo-nuestro-alfajor)\.png$/,
  /^\/(manifest\.json|robots\.txt)$/,
];

function esHostDeCatalogo(host: string): boolean {
  const configurados = (process.env.CATALOGO_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (configurados.length > 0) return configurados.includes(host);
  return host.startsWith("catalogo.");
}

export function middleware(req: NextRequest) {
  // El puerto no forma parte del nombre; en desarrollo el host viene como
  // "catalogo.localhost:3000".
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  if (!esHostDeCatalogo(host)) return NextResponse.next();

  const ruta = req.nextUrl.pathname;

  // La raíz del subdominio ES el catálogo: catalogo.nuestroalfajor.com.ar
  // muestra el catálogo directo, sin /catalogo en la dirección.
  if (ruta === "/") {
    return NextResponse.rewrite(new URL("/catalogo", req.url));
  }

  if (PERMITIDO.some((r) => r.test(ruta))) return NextResponse.next();

  // Cualquier otra cosa (el panel, el login, las APIs de edición) no existe
  // desde esta dirección: se vuelve al catálogo en vez de mostrar un error o,
  // peor, la pantalla de login.
  //
  // OJO: el destino se arma con el host del pedido, NO con new URL(..., req.url).
  // req.url apunta al host interno del servidor, así que ese atajo mandaría al
  // visitante del subdominio al dominio principal — es decir, justo al login
  // que estamos tratando de esconder.
  return NextResponse.redirect(`${protocolo(req, host)}://${hostConPuerto(req, host)}/`);
}

function hostConPuerto(req: NextRequest, host: string): string {
  return req.headers.get("host") || host;
}

function protocolo(req: NextRequest, host: string): string {
  const reenviado = req.headers.get("x-forwarded-proto");
  if (reenviado) return reenviado.split(",")[0].trim();
  return host === "localhost" || host.endsWith(".localhost") ? "http" : "https";
}

export const config = {
  // Se excluyen los archivos estáticos que Next sirve solo, para no ejecutar
  // esto en cada imagen.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
