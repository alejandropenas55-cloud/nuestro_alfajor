import { redirect } from "next/navigation";
import { getSesion } from "@/lib/session";
import NavInferior from "@/components/NavInferior";
import FooterPalanca from "@/components/FooterPalanca";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sesion = await getSesion();
  if (!sesion) redirect("/");

  return (
    <div className="min-h-screen pb-24">
      <NavInferior nombreUsuario={sesion.nombre} />
      <main className="px-4 py-5 max-w-md mx-auto">{children}</main>
      <FooterPalanca />
    </div>
  );
}
