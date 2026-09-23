"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/orden-de-compra", label: "Orden de Compra" },
  { href: "/insumos", label: "Insumos" },
  { href: "/recetas", label: "Recetas" },
];

export default function SubNavCostos() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 -mt-1 flex-wrap">
      {ITEMS.map((item) => {
        const activo = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              activo
                ? "bg-dulce-600 text-white border-dulce-600"
                : "text-dulce-500 border-masa-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
