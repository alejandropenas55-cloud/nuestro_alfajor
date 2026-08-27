"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Dos vistas de los mismos datos de pedidos: el calendario del mes y los
// totales por período. Van como selector arriba de las dos pantallas para
// que se pueda saltar de una a la otra sin buscar.
const VISTAS = [
  { href: "/pedidos", label: "Calendario", icon: "📅" },
  { href: "/pedidos/totales", label: "Totales", icon: "📊" },
] as const;

export default function SelectorVistaPedidos() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      {VISTAS.map((v) => {
        const activo = pathname === v.href;
        return (
          <Link
            key={v.href}
            href={v.href}
            className={`flex-1 flex items-center justify-center gap-1.5 !py-2.5 !px-3 rounded-full font-body border-2 transition-colors ${
              activo
                ? "bg-dulce-500 text-white border-dulce-500"
                : "bg-white text-dulce-600 border-masa-300"
            }`}
          >
            <span aria-hidden>{v.icon}</span>
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
