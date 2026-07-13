# Para Juan Pablo y Martín — bienvenidos al repo

Alejandro les compartió esto para ser totalmente transparente con el
desarrollo: acá abajo tienen todo lo que necesitan para entender qué es esto,
cómo se construyó, y hacia dónde va. Cualquier cosa rara que vean, comentario
o pregunta, es bienvenida — para eso está esto.

## Qué es esto

"Nuestro Alfajor" es un negocio real (alfajores artesanales) y esto es el
sistema de pedidos y producción que le estamos construyendo, hecho con
Claude Code (asistido por IA, con Alejandro dirigiendo cada decisión). Hoy
está en producción y lo usan 4 personas del día a día del negocio.

- **App en vivo**: https://nuestro-alfajor-ese9.vercel.app
- **Stack**: Next.js 14 (App Router) + TypeScript + Tailwind, base de datos
  Turso (libSQL, compatible con SQLite), deploy en Vercel, código en este
  repo de GitHub.

## Por dónde empezar

1. **[README.md](README.md)** — el documento técnico principal. Tiene todo:
   qué hace la app hoy, dónde vive cada regla de negocio, cómo correrla
   local, y la sección "Arquitectura de esta etapa vs. la definitiva" que
   explica las decisiones de infraestructura (por qué Turso y no SQLite
   local, por qué Vercel, qué falta para migrar a Supabase más adelante).
2. **[docs/HOJA_DE_RUTA.md](docs/HOJA_DE_RUTA.md)** — el plan de fondo: las
   7 etapas completas del sistema (Etapa 0 a Etapa 6), qué se agrega en cada
   una, y el criterio para avanzar de una a la siguiente (nunca por
   calendario, siempre por uso real). Ahí también están, sin tocar, los dos
   documentos originales:
   - `Hoja_de_Ruta_Sistema_Produccion.docx` (el original en Word)
   - `NuestroAlfajor_Sistema_Produccion.xlsx` (el "destino final": la
     planilla Excel completa con Stock, Producción Real, Merma y Orden de
     Compra ya diseñados y funcionando — hoy vivimos en la Etapa 0 de eso)

## Cómo se llegó hasta acá (resumen honesto)

- Se empezó con SQLite local para poder probar sin depender de crear
  ninguna cuenta.
- Cuando hubo que pasar a uso real por los 4 usuarios desde sus celulares,
  se migró todo el motor de datos a Turso (mismo SQL, cliente async) y se
  deployó en Vercel + GitHub — sin costo, sin tarjeta de crédito.
- En el camino aparecieron y se corrigieron un par de bugs reales de
  producción (un `BigInt` que rompía una respuesta JSON, y falta de forma de
  borrar un pedido cargado por error — ya está el botón "Borrar" con
  confirmación).
- Hay un diseño ya pensado (no construido) para que Mercedes pueda pegar el
  texto de un pedido de WhatsApp y que una IA lo interprete, sin automatizar
  WhatsApp directamente (se descartó adrede por el riesgo de que WhatsApp
  banee el número del negocio) — está documentado en el README.

## Limitaciones conocidas (sin esconder nada)

- El login es teléfono + PIN de 4 dígitos, sin protección contra fuerza
  bruta todavía — riesgo aceptado a propósito para esta etapa, mitigado por
  `robots.txt` (no indexado) y por ser una URL no publicitada.
- No hay tests automatizados todavía.
- No hay Stock, Producción Real, Merma ni Orden de Compra construidos en el
  software — existen en el Excel destino, pendientes de construir cuando la
  Etapa 0 esté sólidamente incorporada por el equipo (ver Hoja de Ruta).

## Preguntas

Cualquier duda, directo a Alejandro.
