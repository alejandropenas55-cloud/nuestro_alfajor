"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ITEMS_BASE = [
  { href: "/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/produccion", label: "Producción", icon: "🥣" },
  { href: "/config", label: "Config", icon: "⚙️" },
];

// El catálogo público muestra precios de venta, así que lo edita el mismo
// grupo que puede tocar precios (Alejandro/Javier/Mercedes). Francisco no
// lo ve, igual que no edita precios.
const ITEM_CATALOGO = { href: "/editar-catalogo", label: "Catálogo", icon: "🏷️" };

export default function NavInferior({
  nombreUsuario,
  mostrarCatalogo,
}: {
  nombreUsuario: string;
  mostrarCatalogo: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = mostrarCatalogo
    ? [...ITEMS_BASE.slice(0, 2), ITEM_CATALOGO, ITEMS_BASE[2]]
    : ITEMS_BASE;

  async function salir() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-masa-50/95 backdrop-blur border-b-2 border-masa-100 px-4 py-3 flex items-center justify-between">
        <span className="font-display text-dulce-700">Hola, {nombreUsuario}</span>
        <button onClick={salir} className="text-dulce-500 text-sm underline underline-offset-2">
          Salir
        </button>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t-2 border-masa-100 flex">
        {items.map((item) => {
          const activo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 font-display min-w-0 ${
                activo ? "text-dulce-600" : "text-dulce-400"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              {/* Cuando aparece la pestaña Catálogo el ancho por ítem se
                  achica: el texto baja un escalón para que "Producción" no se
                  corte en pantallas de 360 px. */}
              <span className={items.length > 3 ? "text-[11px]" : "text-sm"}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
