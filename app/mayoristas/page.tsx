import type { Metadata } from "next";
import {
  INSTAGRAM_CATALOGO,
  leerTextos,
  listarCatalogoPublico,
  WHATSAPP_CATALOGO,
} from "@/lib/catalogo";
import Mayoristas from "@/components/Mayoristas";

// Material comercial para distribuidores y revendedores. Lee la MISMA tabla
// que /catalogo: si el dueño cambia un precio, sube una foto o agrega un
// producto desde el panel, acá se actualiza solo. Antes esto era un HTML
// aparte con los precios escritos adentro, y quedaba desactualizado sin que
// nadie se enterara.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuestro Alfajor — Venta mayorista y reventa",
  description:
    "Precios mayoristas, mínimos de compra y condiciones para revender Nuestro Alfajor.",
};

export default async function MayoristasPage() {
  const [productos, textos] = await Promise.all([
    listarCatalogoPublico(),
    leerTextos(),
  ]);

  return (
    <Mayoristas
      productos={productos}
      textos={textos}
      whatsapp={WHATSAPP_CATALOGO}
      instagram={INSTAGRAM_CATALOGO}
    />
  );
}
