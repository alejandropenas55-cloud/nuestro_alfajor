import PanelManana from "@/components/PanelManana";

export default function MananaPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-touch-xl text-dulce-700">Mañana</h1>
      <p className="text-dulce-500 -mt-2">Qué hay que producir según lo pedido.</p>
      <PanelManana />
    </div>
  );
}
