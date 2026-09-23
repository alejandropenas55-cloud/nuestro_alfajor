"use client";

import { useRouter } from "next/navigation";

export default function SelectorProductoReceta({
  productos,
  productoIdActual,
}: {
  productos: { id: number; nombre: string }[];
  productoIdActual: number;
}) {
  const router = useRouter();

  return (
    <label className="text-xs text-dulce-500">
      Ver receta de otro producto
      <select
        className="input-grande !py-2 !text-base mt-1"
        value={productoIdActual}
        onChange={(e) => router.push(`/recetas/${e.target.value}`)}
      >
        {productos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
