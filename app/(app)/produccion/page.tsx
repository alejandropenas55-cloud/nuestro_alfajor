import Link from "next/link";
import PanelProduccion from "@/components/PanelProduccion";

export default function ProduccionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Producción</h1>
      <p className="text-dulce-500 -mt-2">
        Qué hay que producir para una fecha — no solo para mañana.
      </p>

      {/* La planilla de papel de la fábrica: se imprime el lunes con la semana
          entera y producción la corrige a mano durante la semana. */}
      <Link href="/planilla-produccion" className="btn-secundario">
        🖨️ Planilla de la semana
      </Link>

      <PanelProduccion />
    </div>
  );
}
