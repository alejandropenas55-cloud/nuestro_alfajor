import { redirect } from "next/navigation";
import { getSesion } from "@/lib/session";
import LoginForm from "@/components/LoginForm";
import FooterPalanca from "@/components/FooterPalanca";

export default async function Home() {
  const sesion = await getSesion();
  if (sesion) redirect("/pedidos");

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display text-touch-xl text-dulce-700">Nuestro Alfajor</h1>
        <p className="text-dulce-500 mt-1">Pedidos y producción</p>
      </div>
      <LoginForm />
      <FooterPalanca />
    </main>
  );
}
