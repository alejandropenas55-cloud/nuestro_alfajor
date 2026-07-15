import PanelProduccion from "@/components/PanelProduccion";

export default function ProduccionPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Producción</h1>
      <p className="text-dulce-500 -mt-2">
        Qué hay que producir para una fecha — no solo para mañana.
      </p>
      <PanelProduccion />
    </div>
  );
}
