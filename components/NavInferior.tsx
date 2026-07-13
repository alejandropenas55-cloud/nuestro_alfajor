"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { href: "/pedidos", label: "Pedidos", icon: "📦" },
  { href: "/manana", label: "Mañana", icon: "🥣" },
  { href: "/config", label: "Config", icon: "⚙️" },
];

export default function NavInferior({ nombreUsuario }: { nombreUsuario: string }) {
  const pathname = usePathname();
  const router = useRouter();

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
        {ITEMS.map((item) => {
          const activo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 font-display ${
                activo ? "text-dulce-600" : "text-dulce-400"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
