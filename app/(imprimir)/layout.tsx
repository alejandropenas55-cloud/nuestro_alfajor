import { redirect } from "next/navigation";
import { getSesion } from "@/lib/session";

// Layout aparte del panel: las páginas para imprimir necesitan el ancho de una
// hoja A4 apaisada y no la columna angosta de celular del layout (app), y no
// deben llevar ni la barra de navegación ni el pie. La sesión se sigue
// exigiendo igual.
export default async function ImprimirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await getSesion())) redirect("/");
  return <div className="plan min-h-screen py-4">{children}</div>;
}
