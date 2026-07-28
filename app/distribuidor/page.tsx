import type { Metadata } from "next";
import {
  INSTAGRAM_CATALOGO,
  leerTextos,
  listarCatalogoPublico,
  WHATSAPP_CATALOGO,
} from "@/lib/catalogo";
import ListaPrecios from "@/components/ListaPrecios";

// Canal distribuidor: precio propio y SIN mínimos de compra. Es la misma
// página que /mayorista con otra lista de precios — misma tabla, misma foto,
// mismos textos.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuestro Alfajor — Lista para distribuidores",
  description: "Precios de distribuidor de Nuestro Alfajor, sin mínimo de compra.",
};

export default async function DistribuidorPage() {
  const [productos, textos] = await Promise.all([
    listarCatalogoPublico(),
    leerTextos(),
  ]);

  return (
    <ListaPrecios
      lista="distribuidor"
      productos={productos}
      textos={textos}
      whatsapp={WHATSAPP_CATALOGO}
      instagram={INSTAGRAM_CATALOGO}
    />
  );
}
