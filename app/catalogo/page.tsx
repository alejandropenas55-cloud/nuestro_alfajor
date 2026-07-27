import type { Metadata } from "next";
import {
  INSTAGRAM_CATALOGO,
  leerTextos,
  listarCatalogoPublico,
  WHATSAPP_CATALOGO,
} from "@/lib/catalogo";
import CatalogoPublico from "@/components/CatalogoPublico";

// Ruta PÚBLICA: vive fuera del grupo (app), así que no pasa por el layout
// que exige sesión. El visitante solo lee; el pedido se cierra por WhatsApp
// y no toca la base (decisión explícita del spec, sección 6).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo · Nuestro Alfajor",
  description:
    "Alfajores artesanales de Paraná, Entre Ríos. Armá tu pedido y cerralo por WhatsApp.",
};

export default async function CatalogoPage() {
  const [productos, textos] = await Promise.all([
    listarCatalogoPublico(),
    leerTextos(),
  ]);
  return (
    <CatalogoPublico
      productos={productos}
      textos={textos}
      whatsapp={WHATSAPP_CATALOGO}
      instagram={INSTAGRAM_CATALOGO}
    />
  );
}
