import type { Metadata } from "next";
import {
  INSTAGRAM_CATALOGO,
  leerTextos,
  listarCatalogoPublico,
  WHATSAPP_CATALOGO,
} from "@/lib/catalogo";
import ListaPrecios from "@/components/ListaPrecios";

// Canal mayorista / reventa: escuelas, clubes, empresas y revendedores. Lee
// la MISMA tabla que /catalogo y /distribuidor, con la lista de precios que
// le corresponde a este canal.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuestro Alfajor — Venta mayorista y reventa",
  description:
    "Precios mayoristas, mínimos de compra y condiciones para revender Nuestro Alfajor.",
};

export default async function MayoristaPage() {
  const [productos, textos] = await Promise.all([
    listarCatalogoPublico(),
    leerTextos(),
  ]);

  return (
    <ListaPrecios
      lista="mayorista"
      productos={productos}
      textos={textos}
      whatsapp={WHATSAPP_CATALOGO}
      instagram={INSTAGRAM_CATALOGO}
    />
  );
}
