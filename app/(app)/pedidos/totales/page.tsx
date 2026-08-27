import TotalesPedidos from "@/components/TotalesPedidos";

export const dynamic = "force-dynamic";

export default function TotalesPedidosPage() {
  const hoy = new Date();
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(
    hoy.getDate()
  ).padStart(2, "0")}`;

  return <TotalesPedidos hoyISO={hoyISO} />;
}
